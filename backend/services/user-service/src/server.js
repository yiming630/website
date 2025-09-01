const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: '../../../.env' });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { initializePool, checkHealth } = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 4001;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database pool
initializePool();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await checkHealth();
    res.status(200).json({
      status: dbHealthy ? 'healthy' : 'degraded',
      service: 'user-service',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'user-service',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'User Service - Translation Platform',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth',
      users: '/users'
    }
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`🚀 User Service running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;