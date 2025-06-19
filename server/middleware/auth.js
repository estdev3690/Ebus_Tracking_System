const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Driver = require('../models/Driver');

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user based on role
    let user;
    switch (decoded.role) {
      case 'user':
        user = await User.findById(decoded.id).select('-password');
        break;
      case 'admin':
        user = await Admin.findById(decoded.id).select('-password');
        break;
      case 'driver':
        user = await Driver.findById(decoded.id).select('-password');
        break;
      default:
        return res.status(401).json({ message: 'Invalid token' });
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Middleware to check specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }

    next();
  };
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is driver
const isDriver = (req, res, next) => {
  if (!req.user || req.user.role !== 'driver') {
    return res.status(403).json({ message: 'Driver access required' });
  }
  next();
};

// Middleware to check if user is regular user
const isUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({ message: 'User access required' });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  isAdmin,
  isDriver,
  isUser
}; 