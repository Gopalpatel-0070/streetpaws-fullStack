const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true,
    maxlength: [100, 'Pet name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Pet type is required'],
    enum: {
      values: ['Dog', 'Cat', 'Bird', 'Rat', 'Other'],
      message: 'Pet type must be one of: Dog, Cat, Bird, Rat, Other'
    }
  },
  age: {
    type: String,
    required: [true, 'Pet age is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    index: '2dsphere'
  },
  distance: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  imageUrl: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  contactName: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  urgency: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High', 'Critical'],
      message: 'Urgency must be one of: Low, Medium, High, Critical'
    },
    default: 'Medium'
  },
  status: {
    type: String,
    enum: {
      values: ['Available', 'Adopted', 'Fostered'],
      message: 'Status must be one of: Available, Adopted, Fostered'
    },
    default: 'Available'
  },
  traits: {
    type: String,
    trim: true,
    maxlength: [200, 'Traits cannot exceed 200 characters']
  },
  comments: [commentSchema],
  cheers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
petSchema.index({ type: 1, status: 1 });
petSchema.index({ urgency: 1 });
petSchema.index({ postedBy: 1 });
petSchema.index({ createdAt: -1 });
petSchema.index({ location: 'text', name: 'text', description: 'text' }); // Text search

// Virtual for cheers count
petSchema.virtual('cheersCount').get(function() {
  return this.cheers.length;
});

// Virtual for comments count
petSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Pre-save middleware to update coordinates if location changes
petSchema.pre('save', async function(next) {
  if (this.isModified('location') && !this.coordinates) {
    // In a real app, you'd use a geocoding service here
    // For now, we'll set dummy coordinates
    this.coordinates = [0, 0]; // Replace with actual geocoding
  }
  next();
});

// Static method for search and filter
petSchema.statics.searchAndFilter = function(query = {}) {
  const {
    search,
    type,
    status,
    urgency,
    postedBy,
    sort = '-createdAt',
    page = 1,
    limit = 10
  } = query;

  let filter = { isActive: true };

  if (search) {
    filter.$text = { $search: search };
  }

  if (type && type !== 'All') {
    filter.type = type;
  }

  if (status && status !== 'All') {
    filter.status = status;
  }

  if (urgency && urgency !== 'All') {
    filter.urgency = urgency;
  }

  if (postedBy) {
    filter.postedBy = postedBy;
  }

  return this.find(filter)
    .populate('postedBy', 'username profile.firstName profile.lastName profile.avatar')
    .populate('comments.author', 'username profile.firstName profile.lastName profile.avatar')
    .populate('cheers', 'username')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Instance method to add cheer
petSchema.methods.addCheer = function(userId) {
  if (!this.cheers.includes(userId)) {
    this.cheers.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove cheer
petSchema.methods.removeCheer = function(userId) {
  this.cheers = this.cheers.filter(id => !id.equals(userId));
  return this.save();
};

// Instance method to toggle cheer
petSchema.methods.toggleCheer = function(userId) {
  const index = this.cheers.indexOf(userId);
  if (index > -1) {
    this.cheers.splice(index, 1);
    return this.save();
  } else {
    this.cheers.push(userId);
    return this.save();
  }
};

// Instance method to add comment
petSchema.methods.addComment = function(commentData) {
  this.comments.push(commentData);
  return this.save();
};

// Instance method to remove comment
petSchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(comment => !comment._id.equals(commentId));
  return this.save();
};

// Plugin for pagination
petSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Pet', petSchema);