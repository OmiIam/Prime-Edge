/**
 * Server Entry Point
 * Express server with Socket.IO integration for real-time transfer notifications
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { userRouter } from './routes/user';
import { adminRouter } from './routes/admin';
import { initializeSocketService } from './services/socketService';

// Initialize Express app and Prisma client
const app = express();
const prisma = new PrismaClient();

// Configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Middleware Configuration
 */

// CORS configuration for cross-origin requests
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path}`);
  
  // Log request body for debugging (exclude sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
    console.log('Request body:', sanitizedBody);
  }
  
  next();
});

/**
 * Health Check Endpoint
 */
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      data: {
        status: 'operational',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        database: 'connected'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      data: {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        database: 'disconnected'
      }
    });
  }
});

/**
 * API Routes Registration
 */
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);

/**
 * Error Handling Middleware
 */

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    data: null
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  const statusCode = error.status || error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    data: NODE_ENV === 'development' ? {
      stack: error.stack,
      details: error
    } : null
  });
});

/**
 * Server Initialization
 */
async function startServer(): Promise<void> {
  try {
    // Test database connection
    console.log('🔗 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Create HTTP server for both Express and Socket.IO
    const httpServer = createServer(app);

    // Initialize Socket.IO service
    console.log('🔌 Initializing Socket.IO service...');
    const socketService = initializeSocketService(httpServer);
    console.log('✅ Socket.IO service initialized');

    // Start server
    httpServer.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket URL: ws://localhost:${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      
      // Log available endpoints
      console.log('\n📋 Available API Endpoints:');
      console.log('   GET  /health - Health check');
      console.log('   POST /api/user/transfer - Create transfer');
      console.log('   GET  /api/user/transfer-updates - Get transfer updates');
      console.log('   GET  /api/user/transactions - Get transaction history');
      console.log('   GET  /api/admin/pending-transfers - Get pending transfers (Admin)');
      console.log('   POST /api/admin/transfers/:id/review - Approve/reject transfer (Admin)');
      console.log('   GET  /api/admin/transfer-stats - Get transfer statistics (Admin)');
      
      console.log('\n🔌 WebSocket Events:');
      console.log('   📡 transfer_pending - Emitted when transfer is created');
      console.log('   📣 transfer_update - Emitted when transfer is approved/rejected');
      console.log('   🏓 ping/pong - Connection health monitoring');
    });

    /**
     * Graceful Shutdown Handlers
     */
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
      
      try {
        // Close HTTP server
        console.log('🔄 Closing HTTP server...');
        await new Promise<void>((resolve) => {
          httpServer.close(() => {
            console.log('✅ HTTP server closed');
            resolve();
          });
        });

        // Shutdown Socket.IO service
        console.log('🔄 Shutting down Socket.IO service...');
        await socketService.shutdown();

        // Disconnect from database
        console.log('🔄 Disconnecting from database...');
        await prisma.$disconnect();
        console.log('✅ Database disconnected');

        console.log('✅ Graceful shutdown completed');
        process.exit(0);

      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Register shutdown handlers
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export { app, startServer };