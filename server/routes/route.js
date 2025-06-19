const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Route = require('../models/Route');

const router = express.Router();

// @route   GET /api/route
// @desc    Get all routes
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, routeType, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (routeType) query.routeType = routeType;

    const routes = await Route.find(query)
      .populate('assignedBuses', 'busNumber busType')
      .populate('assignedDrivers', 'firstName lastName')
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

// @route   GET /api/route/:id
// @desc    Get specific route
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate('assignedBuses', 'busNumber busType status')
      .populate('assignedDrivers', 'firstName lastName');

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json({ route });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/route
// @desc    Create new route (Admin only)
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), [
  body('routeNumber').notEmpty().withMessage('Route number is required'),
  body('routeName').notEmpty().withMessage('Route name is required'),
  body('stops').isArray({ min: 2 }).withMessage('At least 2 stops required'),
  body('totalDistance').isFloat({ min: 0 }).withMessage('Valid distance required'),
  body('estimatedDuration').isInt({ min: 1 }).withMessage('Valid duration required'),
  body('fare.base').isFloat({ min: 0 }).withMessage('Valid base fare required'),
  body('operatingHours.start').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time required'),
  body('operatingHours.end').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time required'),
  body('frequency').isInt({ min: 1 }).withMessage('Valid frequency required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const route = await Route.create(req.body);
    res.status(201).json({ route });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/route/:id
// @desc    Update route (Admin only)
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json({ route });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/route/:id
// @desc    Delete route (Admin only)
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (route.assignedBuses.length > 0) {
      return res.status(400).json({ message: 'Cannot delete route with assigned buses' });
    }

    await route.remove();
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 