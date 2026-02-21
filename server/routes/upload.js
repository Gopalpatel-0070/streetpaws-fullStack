const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Determine environment: in Vercel serverless we cannot write to package dir
const uploadsDir = path.join(__dirname, '../uploads');
const isServerless = !!process.env.VERCEL;

// Configure multer storage: use disk storage locally, memory storage in serverless
let storage;
if (isServerless) {
  storage = multer.memoryStorage();
} else {
  // Ensure uploads directory exists (only in non-serverless environments)
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (err) {
    // Fail gracefully; disk storage won't be available
    console.warn('Failed to ensure uploads directory:', err.message);
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// @desc    Upload pet image
// @route   POST /api/upload/image
// @access  Private
router.post('/image', protect, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload an image file', 400);
  }

  // If running in serverless, files are kept only in memory for the request
  if (isServerless) {
    // Instruct client to upload directly to cloud storage in production
    return res.status(503).json({
      success: false,
      message: 'File uploads are disabled in serverless environment. Please upload directly to cloud storage.'
    });
  }

  // Non-serverless: return local uploads URL
  const imageUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: imageUrl
    }
  });
}));

// @desc    Delete uploaded image
// @route   DELETE /api/upload/image/:filename
// @access  Private
router.delete('/image/:filename', protect, asyncHandler(async (req, res) => {
  if (isServerless) {
    throw new AppError('File deletion not supported in serverless environment', 503);
  }

  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    throw new AppError('File not found', 404);
  }

  fs.unlinkSync(filePath);

  res.json({ success: true, data: {} });
}));

// @desc    Get uploaded images list (for admin)
// @route   GET /api/upload/images
// @access  Private (Admin only)
router.get('/images', protect, asyncHandler(async (req, res) => {
  if (isServerless) {
    throw new AppError('Listing uploaded files is not supported in serverless environment', 503);
  }

  fs.readdir(uploadsDir, (err, files) => {
    if (err) throw new AppError('Unable to read uploads directory', 500);

    const images = files.map(filename => ({
      filename,
      url: `/uploads/${filename}`,
      path: path.join(uploadsDir, filename)
    }));

    res.json({ success: true, data: images });
  });
}));

module.exports = router;