const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, isAdmin } = require('../middleware/auth');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const User = require('../models/User');
const Prediction = require('../models/Prediction');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', protect, isAdmin, async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'on_trip' });
    const totalDrivers = await Driver.countDocuments();
    const onDutyDrivers = await Driver.countDocuments({ isOnDuty: true });
    const totalUsers = await User.countDocuments();
    const totalRoutes = await Route.countDocuments({ status: 'active' });

    res.json({
      statistics: {
        totalBuses,
        activeBuses,
        totalDrivers,
        onDutyDrivers,
        totalUsers,
        totalRoutes
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/drivers
// @desc    Get all drivers
// @access  Private (Admin)
router.get('/drivers', protect, isAdmin, async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate('currentBus', 'busNumber busType')
      .populate('assignedRoutes', 'routeNumber routeName');

    res.json({ drivers });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/drivers/:driverId
// @desc    Update driver information
// @access  Private (Admin)
router.put('/drivers/:driverId', protect, isAdmin, async (req, res) => {
  try {
    const { driverId } = req.params;
    const updateFields = req.body;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({
      message: 'Driver updated successfully',
      driver
    });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/buses
// @desc    Get all buses
// @access  Private (Admin)
router.get('/buses', protect, isAdmin, async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate('currentDriver', 'firstName lastName')
      .populate('currentRoute', 'routeNumber routeName');

    res.json({ buses });
  } catch (error) {
    console.error('Get buses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/routes
// @desc    Get all routes
// @access  Private (Admin)
router.get('/routes', protect, isAdmin, async (req, res) => {
  try {
    const routes = await Route.find()
      .populate('assignedBuses', 'busNumber busType')
      .populate('assignedDrivers', 'firstName lastName');

    res.json({ routes });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 