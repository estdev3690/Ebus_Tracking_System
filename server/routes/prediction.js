const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Prediction = require('../models/Prediction');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

const router = express.Router();

// @route   POST /api/prediction/generate
// @desc    Generate prediction for bus arrival
// @access  Private
router.post('/generate', protect, [
  body('busId').isMongoId().withMessage('Valid bus ID required'),
  body('routeId').isMongoId().withMessage('Valid route ID required'),
  body('stopId').isInt({ min: 1 }).withMessage('Valid stop ID required'),
  body('currentLocation.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates required'),
  body('factors.trafficConditions').isIn(['low', 'medium', 'high']).withMessage('Valid traffic condition required'),
  body('factors.weatherConditions').isIn(['clear', 'rainy', 'snowy', 'foggy']).withMessage('Valid weather condition required'),
  body('factors.distanceToStop').isFloat({ min: 0 }).withMessage('Valid distance required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { busId, routeId, stopId, currentLocation, factors } = req.body;

    // Check if bus and route exist
    const bus = await Bus.findById(busId);
    const route = await Route.findById(routeId);

    if (!bus || !route) {
      return res.status(404).json({ message: 'Bus or route not found' });
    }

    // Calculate predicted arrival time
    const now = new Date();
    let baseTime = 30; // Default 30 minutes

    // Adjust based on factors
    if (factors.trafficConditions === 'high') baseTime *= 1.5;
    else if (factors.trafficConditions === 'low') baseTime *= 0.8;

    if (factors.weatherConditions === 'rainy' || factors.weatherConditions === 'snowy') {
      baseTime *= 1.3;
    }

    if (factors.currentSpeed > 0) {
      const speedFactor = 30 / factors.currentSpeed; // 30 km/h is baseline
      baseTime *= speedFactor;
    }

    const predictedArrivalTime = new Date(now.getTime() + (baseTime * 60 * 1000));

    // Create prediction
    const prediction = await Prediction.create({
      busId,
      routeId,
      driverId: bus.currentDriver,
      stopId,
      currentLocation,
      predictedArrivalTime,
      factors: {
        ...factors,
        timeOfDay: getTimeOfDay(),
        dayOfWeek: getDayOfWeek()
      }
    });

    res.status(201).json({
      prediction: {
        _id: prediction._id,
        busId: prediction.busId,
        routeId: prediction.routeId,
        stopId: prediction.stopId,
        predictedArrivalTime: prediction.predictedArrivalTime,
        factors: prediction.factors
      }
    });
  } catch (error) {
    console.error('Generate prediction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/prediction/stop/:stopId
// @desc    Get predictions for a specific stop
// @access  Private
router.get('/stop/:stopId', protect, async (req, res) => {
  try {
    const { stopId } = req.params;
    const { routeId } = req.query;

    if (!routeId) {
      return res.status(400).json({ message: 'Route ID is required' });
    }

    const predictions = await Prediction.getPredictionsForStop(stopId, routeId);

    res.json({
      stopId,
      routeId,
      predictions
    });
  } catch (error) {
    console.error('Get stop predictions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/prediction/:id/update
// @desc    Update prediction with actual arrival time
// @access  Private
router.put('/:id/update', protect, [
  body('actualArrivalTime').isISO8601().withMessage('Valid arrival time required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { actualArrivalTime } = req.body;

    const prediction = await Prediction.findById(id);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    prediction.actualArrivalTime = new Date(actualArrivalTime);
    prediction.status = 'arrived';
    prediction.calculateAccuracy();
    await prediction.save();

    res.json({
      message: 'Prediction updated successfully',
      prediction: {
        _id: prediction._id,
        predictedArrivalTime: prediction.predictedArrivalTime,
        actualArrivalTime: prediction.actualArrivalTime,
        predictionAccuracy: prediction.predictionAccuracy
      }
    });
  } catch (error) {
    console.error('Update prediction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/prediction/analytics
// @desc    Get prediction analytics
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const { period = '7d', busId, routeId } = req.query;
    
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const matchQuery = {
      createdAt: { $gte: startDate },
      actualArrivalTime: { $exists: true, $ne: null }
    };

    if (busId) matchQuery.busId = busId;
    if (routeId) matchQuery.routeId = routeId;

    const analytics = await Prediction.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: null,
          averageAccuracy: { $avg: '$predictionAccuracy' },
          totalPredictions: { $sum: 1 },
          accuratePredictions: {
            $sum: {
              $cond: [{ $gte: ['$predictionAccuracy', 80] }, 1, 0]
            }
          },
          averageDelay: {
            $avg: {
              $abs: {
                $subtract: ['$predictedArrivalTime', '$actualArrivalTime']
              }
            }
          }
        }
      }
    ]);

    res.json({
      period,
      analytics: analytics[0] || {
        averageAccuracy: 0,
        totalPredictions: 0,
        accuratePredictions: 0,
        averageDelay: 0
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/prediction/bus/:busId
// @desc    Get predictions for a specific bus
// @access  Private
router.get('/bus/:busId', protect, async (req, res) => {
  try {
    const { busId } = req.params;
    const { status } = req.query;

    const query = { busId };
    if (status) query.status = status;

    const predictions = await Prediction.find(query)
      .populate('routeId', 'routeNumber routeName')
      .populate('driverId', 'firstName lastName')
      .sort({ predictedArrivalTime: 1 })
      .limit(20);

    res.json({
      busId,
      predictions
    });
  } catch (error) {
    console.error('Get bus predictions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getDayOfWeek() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

module.exports = router; 