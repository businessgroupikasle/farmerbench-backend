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
import { apiSecurityHeaders, isAllowedOrigin, runStartupSecurityChecks, uploadResponseHeaders } from './config/security';
import { SERVABLE_UPLOAD_EXTENSIONS } from './middlewares/upload.middleware';

runStartupSecurityChecks();

const app = express();
const httpServer = http.createServer(app);

// Resolve req.ip from X-Forwarded-For only when the request arrives from a trusted
// reverse proxy (see TRUST_PROXY in config/env.ts). Prevents rate-limit bypass via
// spoofed X-Forwarded-For headers sent directly by clients.
app.set('trust proxy', env.trustProxy);
app.disable('x-powered-by');

// One-time production warning: if requests reach the API from a local/private
// address without X-Forwarded-For, the reverse proxy is not forwarding the client
// IP and all visitors would share one rate-limit bucket.
let proxyHeaderWarningShown = false;
const PRIVATE_ADDRESS = /^(::1$|::ffff:127\.|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::ffff:10\.|::ffff:192\.168\.|::ffff:172\.(1[6-9]|2\d|3[01])\.|f[cd])/i;
app.use((req, _res, next) => {
  if (
    !proxyHeaderWarningShown &&
    env.NODE_ENV === 'production' &&
    req.path !== '/api/health' &&
    !req.headers['x-forwarded-for'] &&
    PRIVATE_ADDRESS.test(req.socket.remoteAddress || '')
  ) {
    proxyHeaderWarningShown = true;
    console.warn(
      '⚠️ [security] Request received from a private/loopback address without X-Forwarded-For. ' +
        'If the API is behind Nginx, add: proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;'
    );
  }
  next();
});

// Initialize Socket.IO on the HTTP server instance (authenticated admin room for PII events)
initSocketIO(httpServer);

// Security & Parsing Middlewares
app.use(apiSecurityHeaders);
app.use(
  cors({
    // Only CORS_ORIGIN / FRONTEND_URL origins (plus local origins in development).
    origin: (requestOrigin, callback) => callback(null, isAllowedOrigin(requestOrigin)),
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

// Only image files are ever served from /uploads, as inert images (no HTML/SVG/script).
app.use(
  '/uploads',
  (req, res, next) => {
    try {
      const segments = decodeURIComponent(req.path).replace(/\\/g, '/').split('/');
      if (segments.some(segment => segment.toLowerCase() === 'private-bookings')) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }
    } catch { return res.status(400).json({ success: false, message: 'Invalid file path' }); }
    const ext = path.extname(req.path).toLowerCase();
    if (!SERVABLE_UPLOAD_EXTENSIONS.has(ext)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    return next();
  },
  express.static(uploadsDir, {
    dotfiles: 'deny',
    index: false,
    redirect: false,
    setHeaders: (res) => uploadResponseHeaders(res),
  })
);

// Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running',
        socket: 'active',
        uploads: 'served',
      },
    });
  } catch (error: any) {
    // Details stay in server logs; clients only learn that the database is unavailable.
    console.error('Health check: database unavailable:', error?.message || error);
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
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
