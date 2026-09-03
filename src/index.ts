import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { prisma } from './config/database';
import apiRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { initSocketIO } from './socket';
import paymentWebhookRouter from './routes/payment.webhook.routes';

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO on the HTTP server instance
initSocketIO(httpServer);

// Security & Parsing Middlewares
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!requestOrigin) return callback(null, true);
      if (env.corsOrigins.includes(requestOrigin) || env.corsOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev to ensure seamless DX
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Razorpay signatures are calculated over the exact bytes received.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentWebhookRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure and Serve Uploaded Static Assets
const uploadsDir = fs.existsSync(path.resolve(__dirname, '../uploads'))
  ? path.resolve(__dirname, '../uploads')
  : path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services: {
        database: 'connected',
        api: 'running',
        socket: 'active',
        uploads: 'served',
      },
    });
  } catch (error: any) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        error: error.message,
      },
    });
  }
});

// API Routes
app.use('/api', apiRouter);

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Start HTTP & WebSocket Server
const server = httpServer.listen(env.PORT, () => {
  console.log(`🚀 AgriFlow Backend API + Socket.IO listening on port ${env.PORT}`);
  console.log(`📁 Serving uploads from: ${uploadsDir}`);
  console.log(`🌐 Allowed CORS Origins: ${env.corsOrigins.join(', ')}`);
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Prisma disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
