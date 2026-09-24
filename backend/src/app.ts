import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { intakeRouter } from './modules/intake/intake.routes.js';
import { reviewerRouter } from './modules/reviewer/reviewer.routes.js';
import reportRouter from './modules/reports/report.routes.js';
import visualInputRouter from './modules/vision/visual-input.routes.js';
import voiceInputRouter from './modules/voice/voice-input.routes.js';
import translationRouter from './modules/translation/translation.routes.js';

export const createApp = (): Express => {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      credentials: true,
    })
  );

  // Rate Limiter (Skipped in test environment)
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test' || process.env.VITEST === 'true',
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again later.',
      },
    },
  });
  app.use('/api', generalLimiter);

  // Request parsing & correlation ID middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // Routes
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/intake', intakeRouter);
  app.use('/api/reviewer', reviewerRouter);
  app.use('/api', reportRouter);
  app.use('/api', visualInputRouter);
  app.use('/api', voiceInputRouter);
  app.use('/api', translationRouter);

  // Error & 404 Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
