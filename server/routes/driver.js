const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, isDriver } = require('../middleware/auth');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const Prediction = require('../models/Prediction');

const router = express.Router();

// @route   PUT /api/driver/update-location
// @desc    Update driver's current location
// @access  Private (Driver)
router.put('/update-location', protect, isDriver, [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('speed').optional().isFloat({ min: 0, max: 120 }).withMessage('Speed must be between 0 and 120 km/h'),
  body('direction').optional().isFloat({ min: 0, max: 360 }).withMessage('Direction must be between 0 and 360 degrees')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { latitude, longitude, address, speed, direction } = req.body;

    // Update driver location
    const driver = await Driver.findById(req.user._id);
    driver.currentLocation = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
    
    if (address) driver.currentLocation.address = address;
    if (speed !== undefined) driver.currentLocation.speed = speed;
    if (direction !== undefined) driver.currentLocation.direction = direction;

    await driver.save();

    // Update bus location if driver is assigned to a bus
    if (driver.currentBus) {
      const bus = await Bus.findById(driver.currentBus);
      if (bus) {
        await bus.updateLocation(latitude, longitude, address);
        
        // Emit real-time update
        const io = req.app.get('io');
        io.to(`bus-${bus._id}`).emit('bus-location-update', {
          busId: bus._id,
          location: bus.currentLocation,
          speed: bus.speed,
          direction: bus.direction,
          lastUpdate: bus.lastLocationUpdate
        });
      }
    }

    res.json({
      message: 'Location updated successfully',
      location: driver.currentLocation
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/driver/start-trip
// @desc    Start a bus trip
// @access  Private (Driver)
router.post('/start-trip', protect, isDriver, [
  body('busId').isMongoId().withMessage('Valid bus ID required'),
  body('routeId').isMongoId().withMessage('Valid route ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { busId, routeId } = req.body;

    // Check if driver is assigned to this bus
    const driver = await Driver.findById(req.user._id);
    if (driver.currentBus?.toString() !== busId) {
      return res.status(403).json({ message: 'You are not assigned to this bus' });
    }

    // Check if bus is available
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (bus.status !== 'active') {
      return res.status(400).json({ message: 'Bus is not available for trip' });
    }

    // Check if route is valid
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (route.status !== 'active') {
      return res.status(400).json({ message: 'Route is not active' });
    }

    // Start trip
    await bus.startTrip(routeId, req.user._id);
    
    // Update driver status
    driver.isOnDuty = true;
    driver.currentBus = busId;
    await driver.save();

    res.json({
      message: 'Trip started successfully',
      bus: {
        _id: bus._id,
        busNumber: bus.busNumber,
        status: bus.status,
        currentRoute: routeId
      },
      route: {
        _id: route._id,
        routeNumber: route.routeNumber,
        routeName: route.routeName
      }
    });
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/driver/end-trip
// @desc    End a bus trip
// @access  Private (Driver)
router.post('/end-trip', protect, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id);
    
    if (!driver.currentBus) {
      return res.status(400).json({ message: 'No active trip found' });
    }

    const bus = await Bus.findById(driver.currentBus);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // End trip
    await bus.endTrip();
    
    // Update driver status
    driver.isOnDuty = false;
    driver.currentBus = null;
    driver.totalTrips += 1;
    await driver.save();

    res.json({
      message: 'Trip ended successfully',
      totalTrips: driver.totalTrips
    });
  } catch (error) {
    console.error('End trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/driver/update-passenger-count
// @desc    Update passenger count on bus
// @access  Private (Driver)
router.put('/update-passenger-count', protect, isDriver, [
  body('passengerCount').isInt({ min: 0 }).withMessage('Passenger count must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { passengerCount } = req.body;

    const driver = await Driver.findById(req.user._id);
    if (!driver.currentBus) {
      return res.status(400).json({ message: 'No active trip found' });
    }

    const bus = await Bus.findById(driver.currentBus);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (passengerCount > bus.capacity) {
      return res.status(400).json({ message: 'Passenger count cannot exceed bus capacity' });
    }

    bus.currentCapacity = passengerCount;
    await bus.save();

    res.json({
      message: 'Passenger count updated successfully',
      currentCapacity: bus.currentCapacity,
      availableSeats: bus.availableSeats
    });
  } catch (error) {
    console.error('Update passenger count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/driver/current-trip
// @desc    Get current trip information
// @access  Private (Driver)
router.get('/current-trip', protect, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id)
      .populate('currentBus')
      .populate('assignedRoutes');

    if (!driver.currentBus) {
      return res.status(404).json({ message: 'No active trip found' });
    }

    const bus = await Bus.findById(driver.currentBus)
      .populate('currentRoute', 'routeNumber routeName stops')
      .populate('currentDriver', 'firstName lastName');

    res.json({
      driver: {
        _id: driver._id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        isOnDuty: driver.isOnDuty,
        currentLocation: driver.currentLocation
      },
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
        currentRoute: bus.currentRoute,
        lastLocationUpdate: bus.lastLocationUpdate
      }
    });
  } catch (error) {
    console.error('Get current trip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/driver/assigned-routes
// @desc    Get routes assigned to driver
// @access  Private (Driver)
router.get('/assigned-routes', protect, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id)
      .populate('assignedRoutes');

    res.json({
      assignedRoutes: driver.assignedRoutes
    });
  } catch (error) {
    console.error('Get assigned routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/driver/report-issue
// @desc    Report an issue with the bus
// @access  Private (Driver)
router.post('/report-issue', protect, isDriver, [
  body('issueType').isIn(['mechanical', 'electrical', 'safety', 'other']).withMessage('Valid issue type required'),
  body('description').isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid severity level required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { issueType, description, severity } = req.body;

    const driver = await Driver.findById(req.user._id);
    if (!driver.currentBus) {
      return res.status(400).json({ message: 'No active trip found' });
    }

    const bus = await Bus.findById(driver.currentBus);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Add issue to bus maintenance history
    bus.maintenanceHistory.push({
      date: new Date(),
      description: `Issue reported by driver: ${description}`,
      issueType,
      severity
    });

    // Update bus status if critical issue
    if (severity === 'critical') {
      bus.status = 'maintenance';
    }

    await bus.save();

    res.json({
      message: 'Issue reported successfully',
      issue: {
        type: issueType,
        description,
        severity,
        reportedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Report issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/driver/trip-history
// @desc    Get driver's trip history
// @access  Private (Driver)
router.get('/trip-history', protect, isDriver, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // This would typically come from a Trip model
    // For now, we'll return basic driver stats
    const driver = await Driver.findById(req.user._id);

    res.json({
      totalTrips: driver.totalTrips,
      experience: driver.experience,
      rating: driver.rating,
      isOnDuty: driver.isOnDuty,
      lastLogin: driver.lastLogin
    });
  } catch (error) {
    console.error('Get trip history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/driver/update-status
// @desc    Update driver's duty status
// @access  Private (Driver)
router.put('/update-status', protect, isDriver, [
  body('isOnDuty').isBoolean().withMessage('Duty status must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isOnDuty } = req.body;

    const driver = await Driver.findById(req.user._id);
    
    if (isOnDuty && !driver.currentBus) {
      return res.status(400).json({ message: 'Cannot go on duty without an assigned bus' });
    }

    driver.isOnDuty = isOnDuty;
    await driver.save();

    res.json({
      message: 'Status updated successfully',
      isOnDuty: driver.isOnDuty
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 