const jwt = require('jsonwebtoken');
const { asyncHandler, AppError } = require('./errorHandler');
const User = require('../models/User');

// Protect routes - require authentication
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check for token in cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET); // Removed JWT usage
    const decoded = { userId: 'dummy' }; // Dummy for now

    // Get user from token
    req.user = await User.findById(decoded.userId).select('-password');

    if (!req.user) {
      return next(new AppError('User not found', 401));
    }

    if (!req.user.isActive) {
      return next(new AppError('User account is deactivated', 401));
    }

    next();
  } catch (err) {
    return next(new AppError('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`User role ${req.user.role} is not authorized to access this route`, 403));
    }
    next();
  };
};

// Check if user owns the resource or is admin
const ownerOrAdmin = (resourceField = 'user') => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }

    if (req[resourceField] && req[resourceField].toString() === req.user._id.toString()) {
      return next();
    }

    return next(new AppError('Not authorized to access this resource', 403));
  };
};

module.exports = {
  protect,
  authorize,
  ownerOrAdmin
};