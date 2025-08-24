import type { Request, Response, NextFunction } from "express";

/**
 * Error Isolation Middleware
 * Ensures errors in one app don't crash the other
 */

// Error handler specifically for Knets Jr
export const knetsJrErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if ((req as any).app_context === 'knets-jr') {
    console.error('[Knets Jr Error - Isolated]:', {
      error: err.message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // Don't expose internal errors to child app users
    res.status(500).json({
      error: 'Knets Jr service temporarily unavailable',
      app: 'knets-jr',
      retryAfter: 30 // seconds
    });
    return;
  }
  
  next(err);
};

// Error handler for main app
export const mainAppErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if ((req as any).app_context === 'main-app') {
    console.error('[Main App Error - Isolated]:', {
      error: err.message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // Handle main app errors without affecting Knets Jr
    res.status(500).json({
      error: 'Service temporarily unavailable',
      app: 'knets-main'
    });
    return;
  }
  
  next(err);
};

// Global error boundary to prevent complete app crashes
export const globalErrorBoundary = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log critical errors but keep both apps running
  console.error('[Global Error Boundary]:', {
    error: err.message,
    stack: err.stack?.split('\n')[0],
    app_context: (req as any).app_context || 'unknown',
    path: req.path
  });
  
  // Fallback response if other handlers didn't catch it
  if (!res.headersSent) {
    res.status(500).json({
      error: 'System temporarily unavailable',
      app: (req as any).app_context || 'unknown',
      isolation: 'active'
    });
  }
};

console.log('✅ Error isolation middleware initialized');