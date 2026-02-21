const express = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const User = require('../models/User');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional()
});

const loginSchema = Joi.object({
  identifier: Joi.string().required(), // email or username
  password: Joi.string().required()
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { username, email, password, firstName, lastName, phone } = value;

  // Check if user exists
  const existingUser = await User.findByEmailOrUsername(email);
  if (existingUser) {
    throw new AppError('User already exists with this email or username', 400);
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    profile: {
      firstName,
      lastName,
      phone
    }
  });

  // Generate token
  const token = user.generateAuthToken();

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        createdAt: user.createdAt
      },
      token
    }
  });
}));

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { identifier, password } = value;

  // Check for user
  const user = await User.findByEmailOrUsername(identifier).select('+password');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = user.generateAuthToken();

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        lastLogin: user.lastLogin
      },
      token
    }
  });
}));

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: user
  });
}));

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.json({
    success: true,
    data: {}
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
router.put('/updatedetails', protect, asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    username: req.body.username,
    email: req.body.email,
    'profile.firstName': req.body.firstName,
    'profile.lastName': req.body.lastName,
    'profile.phone': req.body.phone,
    'profile.location': req.body.location,
    'profile.bio': req.body.bio
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    data: user
  });
}));

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put('/updatepassword', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new AppError('Password is incorrect', 401);
  }

  user.password = req.body.newPassword;
  await user.save();

  const token = user.generateAuthToken();

  res.json({
    success: true,
    data: { token }
  });
}));

module.exports = router;