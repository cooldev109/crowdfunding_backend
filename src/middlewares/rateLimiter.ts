import rateLimit from 'express-rate-limit';

// Check if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

// General API rate limiter (more lenient in development)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100, // 1000 in dev, 100 in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDev ? () => true : undefined, // Skip rate limiting entirely in dev
});

// Strict rate limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 10, // 100 in dev, 10 in production
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Password reset rate limiter (very strict)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Investment rate limiter (prevent rapid investment attempts)
export const investmentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 investment attempts per minute
  message: {
    success: false,
    message: 'Too many investment attempts, please wait a moment before trying again',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment webhook rate limiter (more lenient for webhooks)
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // allow 100 webhook requests per minute
  message: {
    success: false,
    message: 'Too many webhook requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create custom rate limiter with dynamic options
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
