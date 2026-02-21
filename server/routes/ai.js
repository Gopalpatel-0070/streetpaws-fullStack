const express = require('express');
let GoogleGenAI;
try {
  const module = require('@google/genai');
  GoogleGenAI = module.GoogleGenAI;
} catch (e) {
  console.warn('Google GenAI module not properly loaded');
}

const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Initialize Google GenAI only if API key is available
let genAI = null;
// try {
//   if (process.env.GOOGLE_GENAI_API_KEY && GoogleGenAI) {
//     genAI = new GoogleGenAI(process.env.GOOGLE_GENAI_API_KEY);
//   }
// } catch (error) {
//   console.warn('Google GenAI initialization failed:', error.message);
// }

// @desc    Generate pet description using AI
// @route   POST /api/ai/generate-description
// @access  Private
router.post('/generate-description', protect, asyncHandler(async (req, res) => {
  // if (!genAI) {
  //   throw new AppError('AI service is not configured. Please set GOOGLE_GENAI_API_KEY in environment variables.', 503);
  // }
  throw new AppError('AI service is disabled.', 503);

  const { petType, traits, age, location } = req.body;

  if (!petType) {
    throw new AppError('Pet type is required', 400);
  }

  const prompt = `Generate a compelling and heartwarming description for a ${petType} available for adoption. ${
    age ? `The ${petType} is ${age} old.` : ''
  } ${
    traits ? `Key traits: ${traits}.` : ''
  } ${
    location ? `Located in: ${location}.` : ''
  }

  The description should be:
  - 2-3 sentences long
  - Emotional and engaging
  - Highlight the pet's personality and need for a home
  - Encourage potential adopters to reach out

  Make it sound like a real adoption listing.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text().trim();

    res.json({
      success: true,
      data: {
        description,
        generated: true
      }
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new AppError('Failed to generate description. Please try again.', 500);
  }
}));

// @desc    Generate pet name suggestions
// @route   POST /api/ai/suggest-names
// @access  Private
router.post('/suggest-names', protect, asyncHandler(async (req, res) => {
  // if (!genAI) {
  //   throw new AppError('AI service is not configured. Please set GOOGLE_GENAI_API_KEY in environment variables.', 503);
  // }
  throw new AppError('AI service is disabled.', 503);

  const { petType, traits, color } = req.body;

  if (!petType) {
    throw new AppError('Pet type is required', 400);
  }

  const prompt = `Suggest 5 creative and fitting names for a ${petType} available for adoption. ${
    traits ? `The ${petType} has these traits: ${traits}.` : ''
  } ${
    color ? `The ${petType} is ${color} colored.` : ''
  }

  Provide just the names, one per line, no additional text.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const namesText = response.text().trim();

    // Parse names from response
    const names = namesText.split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .slice(0, 5); // Limit to 5 names

    res.json({
      success: true,
      data: {
        names,
        generated: true
      }
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new AppError('Failed to generate name suggestions. Please try again.', 500);
  }
}));

// @desc    Analyze pet image (if you want to add image analysis)
// @route   POST /api/ai/analyze-image
// @access  Private
router.post('/analyze-image', protect, asyncHandler(async (req, res) => {
  // if (!genAI) {
  //   throw new AppError('AI service is not configured. Please set GOOGLE_GENAI_API_KEY in environment variables.', 503);
  // }
  throw new AppError('AI service is disabled.', 503);

  const { imageUrl } = req.body;

  if (!imageUrl) {
    throw new AppError('Image URL is required', 400);
  }

  // Note: For image analysis, you'd need to use a vision model
  // This is a placeholder for future implementation

  const prompt = `Analyze this pet image and provide insights about the pet's appearance, estimated age, and breed/type if possible. Image URL: ${imageUrl}`;

  try {
    // For now, using text-only model. In production, use vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text().trim();

    res.json({
      success: true,
      data: {
        analysis,
        generated: true
      }
    });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw new AppError('Failed to analyze image. Please try again.', 500);
  }
}));

module.exports = router;