import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { maintenanceMode, getMaintenanceStatus, blockLoginDuringMaintenance } from '../middleware/maintenance';

/**
 * Maintenance Mode Tests
 * Tests the maintenance mode middleware functionality
 */

describe('Maintenance Mode Middleware Tests', () => {
  let app: express.Application;
  let originalEnv: string | undefined;

  beforeAll(() => {
    // Save original environment variable
    originalEnv = process.env.MAINTENANCE_MODE;
  });

  afterAll(() => {
    // Restore original environment variable
    if (originalEnv !== undefined) {
      process.env.MAINTENANCE_MODE = originalEnv;
    } else {
      delete process.env.MAINTENANCE_MODE;
    }
  });

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    
    // Mock auth middleware BEFORE maintenance middleware
    app.use('/api/admin', (req: any, res, next) => {
      req.user = { role: 'ADMIN', id: 'admin-1', email: 'admin@test.com' };
      next();
    });
    
    app.use('/api/user', (req: any, res, next) => {
      req.user = { role: 'USER', id: 'user-1', email: 'user@test.com' };
      next();
    });
    
    // Set up maintenance middleware AFTER auth
    app.use(maintenanceMode);

    // Test routes
    app.get('/health', (req, res) => res.json({ status: 'ok' }));
    app.get('/maintenance', (req, res) => res.json({ page: 'maintenance' }));
    app.get('/api/maintenance/status', getMaintenanceStatus);
    app.get('/api/user/profile', (req, res) => res.json({ message: 'user profile' }));
    app.get('/api/admin/users', (req, res) => res.json({ message: 'admin users' }));
    app.post('/api/auth/login', (req, res) => res.json({ message: 'login success' }));
    app.get('/dashboard', (req, res) => res.json({ page: 'dashboard' }));
    app.get('/random-page', (req, res) => res.json({ page: 'random' }));
  });

  describe('Maintenance Mode Disabled', () => {
    beforeEach(() => {
      process.env.MAINTENANCE_MODE = 'false';
    });

    it('should allow all routes when maintenance mode is disabled', async () => {
      const responses = await Promise.all([
        request(app).get('/health'),
        request(app).get('/api/user/profile'),
        request(app).get('/api/admin/users'),
        request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'password' }),
        request(app).get('/dashboard'),
        request(app).get('/random-page')
      ]);

      responses.forEach(response => {
        expect(response.status).not.toBe(503);
        expect(response.status).not.toBe(302); // No redirects
      });
    });

    it('should return maintenance status as false', async () => {
      const response = await request(app).get('/api/maintenance/status');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.maintenance).toBe(false);
      expect(response.body.data.message).toBe('System operational');
    });
  });

  describe('Maintenance Mode Enabled', () => {
    beforeEach(() => {
      process.env.MAINTENANCE_MODE = 'true';
    });

    it('should allow health check during maintenance', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    it('should allow maintenance page during maintenance', async () => {
      const response = await request(app).get('/maintenance');
      expect(response.status).toBe(200);
      expect(response.body.page).toBe('maintenance');
    });

    it('should allow maintenance status endpoint', async () => {
      const response = await request(app).get('/api/maintenance/status');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.maintenance).toBe(true);
      expect(response.body.data.message).toBe('System upgrade in progress');
    });

    it('should block user API routes during maintenance', async () => {
      const response = await request(app).get('/api/user/profile');
      
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('System upgrade in progress. Please try again later.');
      expect(response.body.maintenance).toBe(true);
    });

    it('should allow admin API routes during maintenance', async () => {
      const response = await request(app).get('/api/admin/users');
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('admin users');
    });

    it('should block login during maintenance', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password' });
      
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('System upgrade in progress. Please try again later.');
      expect(response.body.maintenance).toBe(true);
    });

    it('should redirect web routes to maintenance page', async () => {
      const dashboardResponse = await request(app).get('/dashboard');
      const randomPageResponse = await request(app).get('/random-page');
      
      expect(dashboardResponse.status).toBe(302);
      expect(dashboardResponse.headers.location).toBe('/maintenance');
      
      expect(randomPageResponse.status).toBe(302);
      expect(randomPageResponse.headers.location).toBe('/maintenance');
    });

    it('should not redirect maintenance page to itself', async () => {
      const response = await request(app).get('/maintenance');
      
      expect(response.status).toBe(200);
      expect(response.body.page).toBe('maintenance');
    });
  });

  describe('Admin Access During Maintenance', () => {
    beforeEach(() => {
      process.env.MAINTENANCE_MODE = 'true';
    });

    it('should allow admin access to admin routes', async () => {
      const response = await request(app).get('/api/admin/users');
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('admin users');
    });

    it('should block non-admin access to admin routes during maintenance', async () => {
      // Create app with user (non-admin) auth
      const userApp = express();
      userApp.use(express.json());
      userApp.use(maintenanceMode);
      userApp.use('/api/admin', (req: any, res, next) => {
        req.user = { role: 'USER', id: 'user-1', email: 'user@test.com' };
        next();
      });
      userApp.get('/api/admin/users', (req, res) => res.json({ message: 'admin users' }));

      const response = await request(userApp).get('/api/admin/users');
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required during maintenance');
    });
  });

  describe('Environment Variable Handling', () => {
    it('should recognize MAINTENANCE_MODE=1 as enabled', async () => {
      process.env.MAINTENANCE_MODE = '1';
      
      const response = await request(app).get('/api/maintenance/status');
      
      expect(response.status).toBe(200);
      expect(response.body.data.maintenance).toBe(true);
    });

    it('should recognize MAINTENANCE_MODE=0 as disabled', async () => {
      process.env.MAINTENANCE_MODE = '0';
      
      const response = await request(app).get('/api/maintenance/status');
      
      expect(response.status).toBe(200);
      expect(response.body.data.maintenance).toBe(false);
    });

    it('should default to disabled when MAINTENANCE_MODE is undefined', async () => {
      delete process.env.MAINTENANCE_MODE;
      
      const response = await request(app).get('/api/maintenance/status');
      
      expect(response.status).toBe(200);
      expect(response.body.data.maintenance).toBe(false);
    });
  });

  describe('API Response Format', () => {
    beforeEach(() => {
      process.env.MAINTENANCE_MODE = 'true';
    });

    it('should return proper JSON error format for API routes', async () => {
      const response = await request(app).get('/api/user/profile');
      
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('maintenance', true);
      expect(response.body).toHaveProperty('retryAfter');
    });

    it('should return proper maintenance status format', async () => {
      const response = await request(app).get('/api/maintenance/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('maintenance');
      expect(response.body.data).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });
});