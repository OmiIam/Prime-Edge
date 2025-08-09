import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { initializeSocket } from './socket/socket';
import { userTransferRouter } from './routes/user-transfers';
import { adminTransferRouter } from './routes/admin-transfers';
import { authRouter } from './routes/auth';
import { PrismaClient } from '@prisma/client';

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
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