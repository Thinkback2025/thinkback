import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Only serve static assets in production mode
if (process.env.NODE_ENV === "production") {
  const distPath = "/home/runner/workspace/dist/public";
  app.use('/assets', express.static(path.join(distPath, 'assets')));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  // Serve Knets Jr PWA BEFORE any other middleware to prevent interference
  app.get('/knets-jr', async (req, res) => {
    console.log('🔍 NEW Knets Jr route hit at', new Date().toISOString());
    
    // Serve simple test content first to verify route works
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache', 
      'Expires': '0',
      'Content-Type': 'text/html; charset=utf-8'
    });
    
    // Use absolute path to serve the actual Knets Jr PWA file from server/public/
    const filePath = '/home/runner/workspace/server/public/knets-jr.html';
    console.log('📁 Serving file from:', filePath);
    
    try {
      const fs = await import('fs');
      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      console.log('📄 File size:', fileContent.length, 'characters');
      console.log('🔍 File starts with:', fileContent.substring(0, 100));
      
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(fileContent);
      console.log('✅ Knets Jr PWA served successfully');
    } catch (err) {
      console.error('❌ Error reading file:', err);
      res.status(500).send('Error serving Knets Jr app: ' + err.message);
    }
  });

  // Asset handling is now at the very top of the server setup
  
  // Serve manifest and other root files manually (production only)
  if (process.env.NODE_ENV === "production") {
    const distPath = "/home/runner/workspace/dist/public";
    app.get('/manifest.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.sendFile(`${distPath}/manifest.json`);
    });

    // Serve icons and other static files at root level
    app.get('/vite.svg', (req, res) => {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.sendFile(`${distPath}/vite.svg`);
    });
  }

  // Setup development or production mode FIRST, before routes
  if (process.env.NODE_ENV === "production") {
    console.log("🏭 Production mode: setting up static serving");
    serveStatic(app);
  } else {
    console.log("🔧 Development mode: setting up routes BEFORE Vite middleware");
  }

  // Setup routes and Vite middleware
  let server;
  if (process.env.NODE_ENV !== "production") {
    // Create server first
    const { createServer } = await import("http");
    server = createServer(app);
    
    // Register routes FIRST so they can handle API requests
    await registerRoutes(app);
    console.log("✅ API routes registered first");
    
    // Setup Vite middleware AFTER routes
    await setupVite(app, server);
    console.log("✅ Vite middleware setup complete");
  } else {
    console.log("🏭 Production mode: registering routes for API access");
    server = await registerRoutes(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server!.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
    console.log(`🌐 App accessible at http://localhost:${port}`);
    console.log(`🔗 External access mapped from port 80 to ${port}`);
    
    // Log the actual external URL for APK configuration
    const replitUrl = process.env.REPLIT_URL || `https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.replit.app`;
    console.log(`📱 Android APK should use: ${replitUrl}`);
  });
})();
