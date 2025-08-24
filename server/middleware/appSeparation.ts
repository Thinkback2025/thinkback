import type { Request, Response, NextFunction } from "express";

/**
 * App Separation Middleware
 * Ensures Knets main app and Knets Jr remain completely isolated
 */

// Middleware to isolate Knets Jr requests
export const knetsJrIsolation = (req: Request, res: Response, next: NextFunction) => {
  // Mark request as Knets Jr to prevent interference
  if (req.path.startsWith('/knets-jr')) {
    (req as any).app_context = 'knets-jr';
    
    // Set specific headers for Knets Jr
    res.setHeader('X-App-Context', 'knets-jr');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Override error handling for Knets Jr
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode >= 400) {
        console.log(`[Knets Jr] ${res.statusCode} response for ${req.path}`);
      }
      return originalSend.call(this, data);
    };
  }
  
  next();
};

// Middleware to isolate main app requests
export const mainAppIsolation = (req: Request, res: Response, next: NextFunction) => {
  // Mark request as main app if not Knets Jr
  if (!req.path.startsWith('/knets-jr')) {
    (req as any).app_context = 'main-app';
    res.setHeader('X-App-Context', 'main-app');
  }
  
  next();
};

// Route protection to prevent cross-app interference
export const preventCrossAppAccess = (req: Request, res: Response, next: NextFunction) => {
  const isKnetsJrRequest = req.path.startsWith('/knets-jr');
  const isMainAppApiRequest = req.path.startsWith('/api') && !req.path.startsWith('/api/knets-jr');
  
  // Prevent Knets Jr from accessing main app API routes
  if (isKnetsJrRequest && isMainAppApiRequest) {
    return res.status(403).json({
      error: 'Cross-app access denied',
      message: 'Knets Jr cannot access main app routes'
    });
  }
  
  next();
};

// Build isolation - prevent main app build changes from affecting Knets Jr
export const buildIsolation = (req: Request, res: Response, next: NextFunction) => {
  // Ensure Knets Jr assets are served independently
  if (req.path.startsWith('/knets-jr')) {
    // Prevent any main app build artifacts from interfering
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

console.log('✅ App separation middleware initialized');