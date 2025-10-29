import express from "express";
import type { Express } from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Create Express app
const app: Express = express();
const httpServer = createServer(app);

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get("/api/health", async (_req, res) => {
  const health = {
    status: "healthy",
    version: "3.2.0-integration",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: "ok" },
      websocket: { status: "ok", connections: 0 },
      stripe: { status: "not_configured" },
      openai: { status: "not_configured" }
    }
  };
  
  res.status(200).json(health);
});

// Basic auth endpoint for testing
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication for integration testing
  if (email && password) {
    res.json({
      user: { id: "test-user", email },
      token: "mock-jwt-token-for-integration-testing",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  } else {
    res.status(400).json({ error: "Email and password required" });
  }
});

// Protected route example
app.get("/api/user/profile", (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  res.json({
    user: {
      id: "test-user",
      email: "test@example.com",
      name: "Test User",
      role: "admin"
    }
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const port = process.env.PORT || 4000;
httpServer.listen(Number(port), "0.0.0.0", () => {
  console.log(`🚀 NeonHub Integration API server started on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});

export default app;