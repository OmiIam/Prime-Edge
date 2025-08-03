import { Express } from 'express'
import { createServer, Server } from 'http'
import { authRouter } from './auth'
import { adminRouter } from './admin'
import { userRouter } from './user'
import settingsRouter from './settings'
import documentsRouter from './documents'
import statementsRouter from './statements'
import { testDatabaseConnection } from '../prisma'

export async function registerRoutes(app: Express): Promise<Server> {
  // Test database connection on startup
  const dbConnected = await testDatabaseConnection()
  
  if (!dbConnected) {
    console.log('⚠️  Running in demo mode - database unavailable')
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected'
    })
  })

  // Mount route modules
  app.use('/api/auth', authRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/user', userRouter)
  app.use('/api/settings', settingsRouter)
  app.use('/api/documents', documentsRouter)
  app.use('/api/statements', statementsRouter)

  // Create HTTP server
  const httpServer = createServer(app)
  return httpServer
}