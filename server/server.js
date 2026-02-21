const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const aiRoutes = require('./routes/ai');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// In serverless environments (Vercel) avoid creating a long-lived HTTP server
// and Socket.IO instance at module import time. Vercel invokes the exported
// `app` per request; creating servers or writing logs to disk can fail.
let server;
let io;
if (!process.env.VERCEL) {
  server = http.createServer(app);
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });
}

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'streetpaws-backend' },
  transports: [],
});

// Add file transports only when not running in Vercel (serverless) to avoid
// filesystem write errors. Use console transport in serverless/production.
if (!process.env.VERCEL) {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
} else {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// In non-production local development also log to console
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:3001",
      "https://streetpaws-frontend.vercel.app",
      "https://streetpaw.vercel.app",
      "http://localhost:3001",
      "http://localhost:3000"
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads (only when uploads directory exists and not serverless)
const uploadsStaticPath = path.join(__dirname, 'uploads');
if (!process.env.VERCEL && fs.existsSync(uploadsStaticPath)) {
  app.use('/uploads', express.static(uploadsStaticPath));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

// Swagger documentation
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StreetPaws API',
      version: '1.0.0',
      description: 'API for StreetPaws pet adoption platform',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route: redirect to frontend if configured, otherwise show basic API info
app.get('/', (req, res) => {
  const clientUrl = process.env.CLIENT_URL;
  if (clientUrl) {
    return res.redirect(clientUrl);
  }
  return res.status(200).json({ success: true, message: 'StreetPaws API', docs: '/api-docs' });
});

// Socket.io for real-time features (only when initialized)
if (io) {
  io.on('connection', (socket) => {
    logger.info('New client connected', { socketId: socket.id });

    socket.on('join-pet', (petId) => {
      socket.join(`pet-${petId}`);
    });

    socket.on('leave-pet', (petId) => {
      socket.leave(`pet-${petId}`);
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });
  });
}

// Make io accessible in routes
app.set('io', io);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection with caching for serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Timeouts: fail fast if MongoDB is unreachable
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    };

    const uri = process.env.MONGO_URI;
    if (!uri) {
      const err = new Error('MONGO_URI is not set in environment');
      logger.error(err.message);
      throw err;
    }

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      logger.info('MongoDB Connected');
      return mongoose;
    }).catch((error) => {
      logger.error('Database connection error:', error && error.message ? error.message : error);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    logger.error('DB connection failed in middleware:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });
};

// Only start server if not in Vercel/serverless environment
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = app;