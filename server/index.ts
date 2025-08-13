import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { initializeSocket } from './socket/socket';
import { userTransferRouter } from './routes/user-transfers';
import { adminTransferRouter } from './routes/admin-transfers';
import { authRouter } from './routes/auth';
import { PrismaClient } from '@prisma/client';
import { maintenanceMode, getMaintenanceStatus } from './middleware/maintenance';

const app = express();
const httpServer = createServer(app);

// Initialize Prisma client
export const prisma = new PrismaClient();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://www.primeedgefinancebank.com',
    'https://primeedgefinancebank.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// Maintenance mode middleware (must be before auth middleware)
app.use(maintenanceMode);

// Maintenance status endpoint
app.get('/api/maintenance/status', getMaintenanceStatus);

// Maintenance page route
app.get('/maintenance', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>System Maintenance - PrimeEdge</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; background: white; padding: 60px 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; font-size: 2.5rem; margin-bottom: 20px; }
        p { color: #6b7280; font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px; }
        .icon { font-size: 4rem; margin-bottom: 30px; }
        .back-link { color: #3b82f6; text-decoration: none; font-weight: 500; }
        .back-link:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🚧</div>
        <h1>System Upgrade in Progress</h1>
        <p>We're currently performing system maintenance to improve your experience. During this time, login and account access are temporarily unavailable.</p>
        <p>We apologize for any inconvenience and appreciate your patience. Please check back shortly.</p>
        <br>
        <a href="/" class="back-link">← Return to homepage</a>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      maintenance: process.env.MAINTENANCE_MODE === 'true'
    }
  });
});

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/user', userTransferRouter);
app.use('/api/admin', adminTransferRouter);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    data: null
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    data: null
  });
});

// Initialize Socket.IO
const socketService = initializeSocket(httpServer);

const PORT = process.env.PORT || 5173;

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO server ready for real-time updates`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('📦 Shutting down gracefully...');
  
  // Close Socket.IO
  socketService.close();
  
  // Close HTTP server
  httpServer.close(() => {
    console.log('🔌 HTTP server closed');
  });
  
  // Disconnect Prisma
  await prisma.$disconnect();
  console.log('🗄️ Database disconnected');
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('📦 SIGTERM received, shutting down gracefully...');
  
  socketService.close();
  httpServer.close(() => {
    console.log('🔌 HTTP server closed');
  });
  
  await prisma.$disconnect();
  console.log('🗄️ Database disconnected');
  
  process.exit(0);
});

export { socketService };