import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, updatePreferences } from './auth.controller.js';
import { authenticateJwt } from './auth.middleware.js';

export const authRouter = Router();

// Stricter rate limiting on authentication login attempts against brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_TOO_MANY_ATTEMPTS',
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    },
  },
});

authRouter.post('/register', register);
authRouter.post('/login', loginLimiter, login);
authRouter.get('/me', authenticateJwt, getMe);
authRouter.patch('/preferences', authenticateJwt, updatePreferences);

