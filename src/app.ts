import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './config/logger';
import { generalLimiter } from './middlewares/rateLimiter';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import importRoutes from './routes/importRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import investmentRoutes from './routes/investmentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import simulationRoutes from './routes/simulationRoutes';
import contactRoutes from './routes/contactRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import wompiRoutes from './routes/wompiRoutes';
import payoutRoutes from './routes/payoutRoutes';
import verificationRoutes from './routes/verificationRoutes';

const app: Application = express();

// Security middleware - enhanced for production
app.use(helmet({
  contentSecurityPolicy: ENV.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.wompi.co"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://sandbox.wompi.co", "https://production.wompi.co", ENV.CLIENT_URL],
      frameSrc: ["'self'", "https://checkout.wompi.co"],
    }
  } : false, // Disable CSP in development for easier debugging
  crossOriginEmbedderPolicy: false, // Required for loading external resources
  hsts: ENV.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
}));

// CORS configuration
const isProduction = ENV.NODE_ENV === 'production';
const allowedOrigins: string[] = [ENV.CLIENT_URL];

// Add development origins only in non-production
if (!isProduction) {
  allowedOrigins.push(
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177'
  );
}

// Add additional origins from env (comma-separated)
if (process.env.CORS_ORIGINS) {
  const additionalOrigins = process.env.CORS_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...additionalOrigins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Rate limiting - apply to all API routes except webhooks
app.use('/api', generalLimiter);

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/import', importRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments/wompi', wompiRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/verification', verificationRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
