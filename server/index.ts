import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { disconnectDatabase } from "./prisma";
import { initializeSocketService } from "./socket/socket";

const app = express();

// CORS middleware to allow Vercel frontend to communicate with Railway backend
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173', // Local development
    'http://localhost:3000', // Alternative local port
    'https://www.primeedgefinancebank.com', // Your custom domain
    'https://primeedgefinancebank.com', // Your custom domain without www
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin as string)) {
    res.setHeader('Access-Control-Allow-Origin', origin as string);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create HTTP server for both Express and Socket.IO
  const httpServer = createServer(app);
  
  // Initialize Socket.IO service with HTTP server
  let socketService: any = null;
  try {
    socketService = initializeSocketService(httpServer);
    log('✅ Socket.IO service initialized successfully');
  } catch (error) {
    log('❌ Failed to initialize Socket.IO service:', error.message);
  }

  // Register API routes (this sets up the express routes but returns the server)
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5173 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5173', 10);
  const host = process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0';
  
  httpServer.listen(port, host, () => {
    log(`🚀 Server running at http://${host}:${port}`);
    log(`📱 Frontend: http://${host}:${port}`);
    log(`🔧 Admin: http://${host}:${port}/admin`);
    if (socketService) {
      log(`🔌 WebSocket server ready for real-time updates`);
    }
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    log(`Received ${signal}, shutting down gracefully...`);
    
    // Shutdown Socket.IO service first
    if (socketService) {
      try {
        await socketService.shutdown();
        log('✅ Socket.IO service shut down');
      } catch (error) {
        log('❌ Error shutting down Socket.IO service:', error.message);
      }
    }
    
    // Disconnect database
    try {
      await disconnectDatabase();
      log('✅ Database disconnected');
    } catch (error) {
      log('❌ Error disconnecting database:', error.message);
    }
    
    // Close HTTP server
    httpServer.close(() => {
      log('✅ HTTP server closed');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      log('❌ Forced shutdown due to timeout');
      process.exit(1);
    }, 10000); // 10 second timeout
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
})();
