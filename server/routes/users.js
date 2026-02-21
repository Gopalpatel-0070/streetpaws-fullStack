const express = require('express');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');
const Pet = require('../models/Pet');

const router = express.Router();

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: user
  });
}));

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    'profile.firstName': req.body.firstName,
    'profile.lastName': req.body.lastName,
    'profile.phone': req.body.phone,
    'profile.location': req.body.location,
    'profile.bio': req.body.bio,
    'profile.avatar': req.body.avatar
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

// @desc    Get user's pets
// @route   GET /api/users/:userId/pets
// @access  Public
router.get('/:userId/pets', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const options = {
    page,
    limit,
    sort: '-createdAt',
    populate: [
      { path: 'postedBy', select: 'username profile.firstName profile.lastName profile.avatar' },
      { path: 'comments.author', select: 'username profile.firstName profile.lastName profile.avatar' },
      { path: 'cheers', select: 'username' }
    ]
  };

  const filter = {
    postedBy: req.params.userId,
    isActive: true
  };

  const result = await Pet.paginate(filter, options);

  res.json({
    success: true,
    data: result.docs,
    pagination: {
      page: result.page,
      pages: result.totalPages,
      total: result.totalDocs,
      limit: result.limit
    }
  });
}));

// @desc    Get user statistics
// @route   GET /api/users/:userId/stats
// @access  Public
router.get('/:userId/stats', asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  const stats = await Pet.aggregate([
    { $match: { postedBy: require('mongoose').Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        totalPets: { $sum: 1 },
        totalCheers: { $sum: { $size: '$cheers' } },
        totalComments: { $sum: { $size: '$comments' } },
        totalViews: { $sum: '$views' },
        byStatus: {
          $push: '$status'
        },
        byType: {
          $push: '$type'
        }
      }
    }
  ]);

  const statusStats = {};
  const typeStats = {};

  if (stats.length > 0) {
    stats[0].byStatus.forEach(status => {
      statusStats[status] = (statusStats[status] || 0) + 1;
    });

    stats[0].byType.forEach(type => {
      typeStats[type] = (typeStats[type] || 0) + 1;
    });
  }

  res.json({
    success: true,
    data: {
      totalPets: stats[0]?.totalPets || 0,
      totalCheers: stats[0]?.totalCheers || 0,
      totalComments: stats[0]?.totalComments || 0,
      totalViews: stats[0]?.totalViews || 0,
      byStatus: statusStats,
      byType: typeStats
    }
  });
}));

// @desc    Get user by ID
// @route   GET /api/users/:userId
// @access  Public
router.get('/:userId', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
}));

module.exports = router;