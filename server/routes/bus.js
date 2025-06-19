const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Bus = require('../models/Bus');

const router = express.Router();

// @route   GET /api/bus
// @desc    Get all buses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, busType, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (busType) query.busType = busType;

    const buses = await Bus.find(query)
      .populate('currentDriver', 'firstName lastName')
      .populate('currentRoute', 'routeNumber routeName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ busNumber: 1 });

    const total = await Bus.countDocuments(query);

    res.json({
      buses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get buses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bus/:id
// @desc    Get specific bus
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('currentDriver', 'firstName lastName phone')
      .populate('currentRoute', 'routeNumber routeName stops');

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json({ bus });
  } catch (error) {
    console.error('Get bus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bus
// @desc    Create new bus (Admin only)
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), [
  body('busNumber').notEmpty().withMessage('Bus number is required'),
  body('registrationNumber').notEmpty().withMessage('Registration number is required'),
  body('busType').isIn(['AC', 'Non-AC', 'Express', 'Local', 'Premium']).withMessage('Valid bus type required'),
  body('capacity').isInt({ min: 1, max: 100 }).withMessage('Capacity must be between 1 and 100'),
  body('model').notEmpty().withMessage('Bus model is required'),
  body('manufacturer').notEmpty().withMessage('Manufacturer is required'),
  body('yearOfManufacture').isInt({ min: 1990 }).withMessage('Valid year required'),
  body('fuelType').isIn(['Diesel', 'Petrol', 'Electric', 'Hybrid', 'CNG']).withMessage('Valid fuel type required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bus = await Bus.create(req.body);
    res.status(201).json({ bus });
  } catch (error) {
    console.error('Create bus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bus/:id
// @desc    Update bus (Admin only)
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json({ bus });
  } catch (error) {
    console.error('Update bus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/bus/:id
// @desc    Delete bus (Admin only)
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (bus.status === 'on_trip') {
      return res.status(400).json({ message: 'Cannot delete bus while on trip' });
    }

    await bus.remove();
    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('Delete bus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 