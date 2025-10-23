import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import { testConnection } from './config/database.js';
import hybridRoutes from './routes/hybrid.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbConnected ? 'connected' : 'disconnected',
    cacheEnabled: process.env.ENABLE_DB_CACHE === 'true',
  });
});

// API routes - Hybrid approach (DB cache + API)
app.use('/api', hybridRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// Test database connection on startup
async function startServer() {
  const dbConnected = await testConnection();
  if (dbConnected) {
    logger.info('✅ Database connection successful (Hybrid mode enabled)');
  } else {
    logger.warn('⚠️ Database connection failed (Running in API-only mode)');
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Cache enabled: ${process.env.ENABLE_DB_CACHE === 'true'}`);
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 API Mode: Hybrid (DB Cache + API)`);
    console.log(`💾 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
  });
}

// Start server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
