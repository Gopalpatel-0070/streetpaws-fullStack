const express = require('express');
const Joi = require('joi');
const { protect, authorize, ownerOrAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const Pet = require('../models/Pet');

const router = express.Router();

// Validation schemas
const createPetSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('Dog', 'Cat', 'Bird', 'Rat', 'Other').required(),
  age: Joi.string().min(1).required(),
  location: Joi.string().min(1).required(),
  description: Joi.string().min(1).max(1000).required(),
  contactNumber: Joi.string().min(1).required(),
  contactName: Joi.string().min(1).required(),
  urgency: Joi.string().valid('Low', 'Medium', 'High', 'Critical').default('Medium'),
  traits: Joi.string().max(200).optional(),
  imageUrl: Joi.string().optional()
}).unknown(false);

const updatePetSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  type: Joi.string().valid('Dog', 'Cat', 'Bird', 'Rat', 'Other').optional(),
  age: Joi.string().min(1).optional(),
  location: Joi.string().min(1).optional(),
  description: Joi.string().min(1).max(1000).optional(),
  contactNumber: Joi.string().min(1).optional(),
  contactName: Joi.string().min(1).optional(),
  urgency: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
  status: Joi.string().valid('Available', 'Adopted', 'Fostered').optional(),
  traits: Joi.string().max(200).optional(),
  imageUrl: Joi.string().optional()
}).unknown(false);

const commentSchema = Joi.object({
  text: Joi.string().min(1).max(500).required()
});

// @desc    Get all pets
// @route   GET /api/pets
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort || '-createdAt';

  const options = {
    page,
    limit,
    sort,
    populate: [
      { path: 'postedBy', select: 'username profile.firstName profile.lastName profile.avatar' },
      { path: 'comments.author', select: 'username profile.firstName profile.lastName profile.avatar' },
      { path: 'cheers', select: 'username' }
    ]
  };

  let filter = { isActive: true };

  // Apply filters
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  if (req.query.type && req.query.type !== 'All') {
    filter.type = req.query.type;
  }

  if (req.query.status && req.query.status !== 'All') {
    filter.status = req.query.status;
  }

  if (req.query.urgency && req.query.urgency !== 'All') {
    filter.urgency = req.query.urgency;
  }

  if (req.query.postedBy) {
    filter.postedBy = req.query.postedBy;
  }

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

// @desc    Get single pet
// @route   GET /api/pets/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id)
    .populate('postedBy', 'username profile.firstName profile.lastName profile.avatar')
    .populate('comments.author', 'username profile.firstName profile.lastName profile.avatar')
    .populate('cheers', 'username');

  if (!pet || !pet.isActive) {
    throw new AppError('Pet not found', 404);
  }

  // Increment views
  pet.views += 1;
  await pet.save();

  res.json({
    success: true,
    data: pet
  });
}));

// @desc    Create new pet
// @route   POST /api/pets
// @access  Private
router.post('/', protect, asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = createPetSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  // Add user to req.body
  value.postedBy = req.user._id;

  const pet = await Pet.create(value);

  // Populate the created pet
  await pet.populate('postedBy', 'username profile.firstName profile.lastName profile.avatar');

  res.status(201).json({
    success: true,
    data: pet
  });
}));

// @desc    Update pet
// @route   PUT /api/pets/:id
// @access  Private (Owner or Admin)
router.put('/:id', protect, asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = updatePetSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  let pet = await Pet.findById(req.params.id);

  if (!pet || !pet.isActive) {
    throw new AppError('Pet not found', 404);
  }

  // Check ownership
  if (pet.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update this pet', 403);
  }

  pet = await Pet.findByIdAndUpdate(req.params.id, value, {
    new: true,
    runValidators: true
  }).populate('postedBy', 'username profile.firstName profile.lastName profile.avatar')
    .populate('comments.author', 'username profile.firstName profile.lastName profile.avatar')
    .populate('cheers', 'username');

  res.json({
    success: true,
    data: pet
  });
}));

// @desc    Delete pet
// @route   DELETE /api/pets/:id
// @access  Private (Owner or Admin)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);

  if (!pet || !pet.isActive) {
    throw new AppError('Pet not found', 404);
  }

  // Check ownership
  if (pet.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to delete this pet', 403);
  }

  // Soft delete
  pet.isActive = false;
  await pet.save();

  res.json({
    success: true,
    data: {}
  });
}));

// @desc    Add comment to pet
// @route   POST /api/pets/:id/comments
// @access  Private
router.post('/:id/comments', protect, asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = commentSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const pet = await Pet.findById(req.params.id);

  if (!pet || !pet.isActive) {
    throw new AppError('Pet not found', 404);
  }

  const commentData = {
    text: value.text,
    author: req.user._id
  };

  await pet.addComment(commentData);

  // Emit socket event for real-time updates
  const io = req.app.get('io');
  io.to(`pet-${pet._id}`).emit('new-comment', {
    petId: pet._id,
    comment: {
      ...commentData,
      author: {
        _id: req.user._id,
        username: req.user.username,
        profile: req.user.profile
      },
      createdAt: new Date()
    }
  });

  // Populate and return updated pet
  await pet.populate('comments.author', 'username profile.firstName profile.lastName profile.avatar');

  res.status(201).json({
    success: true,
    data: pet.comments[pet.comments.length - 1]
  });
}));

// @desc    Delete comment from pet
// @route   DELETE /api/pets/comments/:commentId
// @access  Private (Comment author or Admin)
router.delete('/comments/:commentId', protect, asyncHandler(async (req, res) => {
  const pet = await Pet.findOne({ 'comments._id': req.params.commentId });

  if (!pet) {
    throw new AppError('Comment not found', 404);
  }

  const comment = pet.comments.id(req.params.commentId);

  // Check if user is comment author or admin
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to delete this comment', 403);
  }

  await pet.removeComment(req.params.commentId);

  res.json({
    success: true,
    data: {}
  });
}));

// @desc    Toggle cheer on pet
// @route   POST /api/pets/:id/cheer
// @access  Private
router.post('/:id/cheer', protect, asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);

  if (!pet || !pet.isActive) {
    throw new AppError('Pet not found', 404);
  }

  const hasCheered = pet.cheers.includes(req.user._id);

  if (hasCheered) {
    await pet.removeCheer(req.user._id);
  } else {
    await pet.addCheer(req.user._id);
  }

  // Emit socket event
  const io = req.app.get('io');
  io.to(`pet-${pet._id}`).emit('cheer-update', {
    petId: pet._id,
    cheersCount: pet.cheersCount,
    cheered: !hasCheered
  });

  res.json({
    success: true,
    data: {
      cheered: !hasCheered,
      cheersCount: pet.cheersCount
    }
  });
}));

// @desc    Get pet statistics
// @route   GET /api/pets/stats/overview
// @access  Public
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const stats = await Pet.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalPets: { $sum: 1 },
        byType: {
          $push: '$type'
        },
        byStatus: {
          $push: '$status'
        },
        totalCheers: { $sum: { $size: '$cheers' } },
        totalComments: { $sum: { $size: '$comments' } }
      }
    }
  ]);

  const typeStats = {};
  const statusStats = {};

  if (stats.length > 0) {
    stats[0].byType.forEach(type => {
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    stats[0].byStatus.forEach(status => {
      statusStats[status] = (statusStats[status] || 0) + 1;
    });
  }

  res.json({
    success: true,
    data: {
      totalPets: stats[0]?.totalPets || 0,
      byType: typeStats,
      byStatus: statusStats,
      totalCheers: stats[0]?.totalCheers || 0,
      totalComments: stats[0]?.totalComments || 0
    }
  });
}));

module.exports = router;