import { Request, Response, NextFunction } from 'express';

/**
 * Maintenance Mode Middleware
 * Blocks all non-admin API access when MAINTENANCE_MODE is enabled
 */

interface MaintenanceRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

// Routes that should always be accessible during maintenance
const ALLOWED_ROUTES = [
  '/health',
  '/maintenance',
  '/api/maintenance/status'
];

// Admin-only routes that remain accessible during maintenance
const ADMIN_ROUTES = [
  '/api/admin',
  '/api/auth/me' // Allow checking current user status
];

/**
 * Check if maintenance mode is enabled
 */
export function isMaintenanceModeEnabled(): boolean {
  return process.env.MAINTENANCE_MODE === 'true' || process.env.MAINTENANCE_MODE === '1';
}

/**
 * Check if a route is allowed during maintenance
 */
function isRouteAllowed(path: string): boolean {
  return ALLOWED_ROUTES.some(route => path.startsWith(route));
}

/**
 * Check if a route requires admin access during maintenance
 */
function isAdminRoute(path: string): boolean {
  return ADMIN_ROUTES.some(route => path.startsWith(route));
}

/**
 * Check if user is admin
 */
function isUserAdmin(user?: { role: string }): boolean {
  return user?.role === 'ADMIN';
}

/**
 * Main maintenance mode middleware
 */
export function maintenanceMode(req: MaintenanceRequest, res: Response, next: NextFunction) {
  // Skip if maintenance mode is disabled
  if (!isMaintenanceModeEnabled()) {
    return next();
  }

  const path = req.path;
  const isApiRequest = path.startsWith('/api');

  // Always allow certain routes
  if (isRouteAllowed(path)) {
    return next();
  }

  // For admin routes, check if user is admin
  if (isAdminRoute(path)) {
    if (isUserAdmin(req.user)) {
      return next();
    }
    
    // Block non-admin access to admin routes
    if (isApiRequest) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required during maintenance',
        maintenance: true
      });
    }
    
    return res.redirect('/maintenance');
  }

  // Block all other routes during maintenance
  if (isApiRequest) {
    return res.status(503).json({
      success: false,
      message: 'System upgrade in progress. Please try again later.',
      maintenance: true,
      retryAfter: '1 hour' // Estimate
    });
  }

  // For web routes, redirect to maintenance page
  if (path !== '/maintenance') {
    return res.redirect('/maintenance');
  }

  next();
}

/**
 * Maintenance status endpoint
 */
export function getMaintenanceStatus(req: Request, res: Response) {
  const isEnabled = isMaintenanceModeEnabled();
  
  res.json({
    success: true,
    data: {
      maintenance: isEnabled,
      message: isEnabled 
        ? 'System upgrade in progress' 
        : 'System operational',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Middleware specifically for blocking login during maintenance
 */
export function blockLoginDuringMaintenance(req: Request, res: Response, next: NextFunction) {
  if (isMaintenanceModeEnabled()) {
    return res.status(503).json({
      success: false,
      message: 'Logins are disabled during system maintenance. Please try again later.',
      maintenance: true
    });
  }
  
  next();
}