const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, isUser } = require('../middleware/auth');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Prediction = require('../models/Prediction');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/user/search-bus
// @desc    Search for buses by source and destination
// @access  Private (User)
router.get('/search-bus', protect, isUser, [
  body('source').notEmpty().withMessage('Source location is required'),
  body('destination').notEmpty().withMessage('Destination location is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { source, destination } = req.query;

    // Find routes that contain both source and destination stops
    const routes = await Route.find({
      'stops.name': { 
        $regex: new RegExp(source, 'i') 
      },
      'stops.name': { 
        $regex: new RegExp(destination, 'i') 
      },
      status: 'active'
    }).populate('assignedBuses', 'busNumber busType capacity currentCapacity status');

    if (routes.length === 0) {
      return res.status(404).json({ message: 'No routes found for the specified locations' });
    }

    // Get predictions for each route
    const routesWithPredictions = await Promise.all(
      routes.map(async (route) => {
        const sourceStop = route.stops.find(stop => 
          stop.name.toLowerCase().includes(source.toLowerCase())
        );
        const destStop = route.stops.find(stop => 
          stop.name.toLowerCase().includes(destination.toLowerCase())
        );

        if (!sourceStop || !destStop) return null;

        // Get active buses on this route
        const activeBuses = route.assignedBuses.filter(bus => 
          bus.status === 'on_trip' && bus.currentRoute?.toString() === route._id.toString()
        );

        // Get predictions for source stop
        const predictions = await Prediction.getPredictionsForStop(sourceStop.stopNumber, route._id);

        return {
          route: {
            _id: route._id,
            routeNumber: route.routeNumber,
            routeName: route.routeName,
            totalDistance: route.totalDistance,
            estimatedDuration: route.estimatedDuration,
            fare: route.calculateFare(sourceStop.stopNumber, destStop.stopNumber),
            sourceStop: sourceStop.name,
            destinationStop: destStop.name
          },
          activeBuses: activeBuses.length,
          nextPredictions: predictions.slice(0, 3), // Get next 3 predictions
          operatingHours: route.operatingHours,
          frequency: route.frequency
        };
      })
    );

    const validRoutes = routesWithPredictions.filter(route => route !== null);

    res.json({
      count: validRoutes.length,
      routes: validRoutes
    });
  } catch (error) {
    console.error('Search bus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/bus-location/:busId
// @desc    Get real-time location of a specific bus
// @access  Private (User)
router.get('/bus-location/:busId', protect, isUser, async (req, res) => {
  try {
    const { busId } = req.params;

    const bus = await Bus.findById(busId)
      .populate('currentRoute', 'routeNumber routeName stops')
      .populate('currentDriver', 'firstName lastName phone');

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (!bus.isOnline) {
      return res.status(400).json({ message: 'Bus is currently offline' });
    }

    // Join the bus tracking room for real-time updates
    const io = req.app.get('io');
    req.app.get('io').to(`bus-${busId}`).emit('bus-location-update', {
      busId: bus._id,
      location: bus.currentLocation,
      speed: bus.speed,
      direction: bus.direction,
      lastUpdate: bus.lastLocationUpdate
    });

    res.json({
      bus: {
        _id: bus._id,
        busNumber: bus.busNumber,
        busType: bus.busType,
        capacity: bus.capacity,
        currentCapacity: bus.currentCapacity,
        availableSeats: bus.availableSeats,
        status: bus.status,
        currentLocation: bus.currentLocation,
        speed: bus.speed,
        direction: bus.direction,
        lastLocationUpdate: bus.lastLocationUpdate,
        currentRoute: bus.currentRoute,
        currentDriver: bus.currentDriver
      }
    });
  } catch (error) {
    console.error('Get bus location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/user/track-bus/:busId
// @desc    Start tracking a specific bus
// @access  Private (User)
router.post('/track-bus/:busId', protect, isUser, async (req, res) => {
  try {
    const { busId } = req.params;

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Join the bus tracking room
    const io = req.app.get('io');
    io.to(`bus-${busId}`).emit('user-joined-tracking', {
      userId: req.user._id,
      busId: busId
    });

    res.json({ 
      message: 'Started tracking bus',
      busId: busId,
      busNumber: bus.busNumber
    });
  } catch (error) {
    console.error('Track bus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/user/stop-tracking/:busId
// @desc    Stop tracking a specific bus
// @access  Private (User)
router.post('/stop-tracking/:busId', protect, isUser, async (req, res) => {
  try {
    const { busId } = req.params;

    // Leave the bus tracking room
    const io = req.app.get('io');
    io.to(`bus-${busId}`).emit('user-left-tracking', {
      userId: req.user._id,
      busId: busId
    });

    res.json({ 
      message: 'Stopped tracking bus',
      busId: busId
    });
  } catch (error) {
    console.error('Stop tracking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/routes
// @desc    Get all active routes
// @access  Private (User)
router.get('/routes', protect, isUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, routeType } = req.query;

    const query = { status: 'active' };
    if (routeType) {
      query.routeType = routeType;
    }

    const routes = await Route.find(query)
      .populate('assignedBuses', 'busNumber busType status')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ routeNumber: 1 });

    const total = await Route.countDocuments(query);

    res.json({
      routes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/routes/:routeId
// @desc    Get specific route details
// @access  Private (User)
router.get('/routes/:routeId', protect, isUser, async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await Route.findById(routeId)
      .populate('assignedBuses', 'busNumber busType capacity currentCapacity status')
      .populate('assignedDrivers', 'firstName lastName');

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Get predictions for all stops on this route
    const predictions = await Promise.all(
      route.stops.map(async (stop) => {
        const stopPredictions = await Prediction.getPredictionsForStop(stop.stopNumber, route._id);
        return {
          stop: stop,
          predictions: stopPredictions
        };
      })
    );

    res.json({
      route,
      predictions
    });
  } catch (error) {
    console.error('Get route details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/user/favorite-route/:routeId
// @desc    Add route to user's favorites
// @access  Private (User)
router.post('/favorite-route/:routeId', protect, isUser, async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const user = await User.findById(req.user._id);
    if (user.favoriteRoutes.includes(routeId)) {
      return res.status(400).json({ message: 'Route is already in favorites' });
    }

    user.favoriteRoutes.push(routeId);
    await user.save();

    res.json({ 
      message: 'Route added to favorites',
      favoriteRoutes: user.favoriteRoutes
    });
  } catch (error) {
    console.error('Add favorite route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/user/favorite-route/:routeId
// @desc    Remove route from user's favorites
// @access  Private (User)
router.delete('/favorite-route/:routeId', protect, isUser, async (req, res) => {
  try {
    const { routeId } = req.params;

    const user = await User.findById(req.user._id);
    const routeIndex = user.favoriteRoutes.indexOf(routeId);
    
    if (routeIndex === -1) {
      return res.status(400).json({ message: 'Route is not in favorites' });
    }

    user.favoriteRoutes.splice(routeIndex, 1);
    await user.save();

    res.json({ 
      message: 'Route removed from favorites',
      favoriteRoutes: user.favoriteRoutes
    });
  } catch (error) {
    console.error('Remove favorite route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/favorite-routes
// @desc    Get user's favorite routes
// @access  Private (User)
router.get('/favorite-routes', protect, isUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favoriteRoutes',
      populate: {
        path: 'assignedBuses',
        select: 'busNumber busType status'
      }
    });

    res.json({
      favoriteRoutes: user.favoriteRoutes
    });
  } catch (error) {
    console.error('Get favorite routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/nearby-buses
// @desc    Get buses near user's location
// @access  Private (User)
router.get('/nearby-buses', protect, isUser, [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('radius').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be between 0.1 and 50 km')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { latitude, longitude, radius = 5 } = req.query; // Default 5km radius

    // Find buses within the specified radius
    const nearbyBuses = await Bus.find({
      isOnline: true,
      status: 'on_trip',
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .populate('currentRoute', 'routeNumber routeName')
    .populate('currentDriver', 'firstName lastName')
    .limit(20);

    res.json({
      count: nearbyBuses.length,
      buses: nearbyBuses.map(bus => ({
        _id: bus._id,
        busNumber: bus.busNumber,
        busType: bus.busType,
        currentLocation: bus.currentLocation,
        speed: bus.speed,
        direction: bus.direction,
        currentRoute: bus.currentRoute,
        currentDriver: bus.currentDriver,
        lastLocationUpdate: bus.lastLocationUpdate
      }))
    });
  } catch (error) {
    console.error('Get nearby buses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 