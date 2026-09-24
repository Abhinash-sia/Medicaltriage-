import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from './notification.controller.js';
import { authenticateJwt } from '../auth/auth.middleware.js';

export const notificationRouter = Router();

notificationRouter.use(authenticateJwt);

notificationRouter.get('/', getNotifications);
notificationRouter.get('/unread-count', getUnreadCount);
notificationRouter.post('/read-all', markAllAsRead);
notificationRouter.post('/:notificationId/read', markAsRead);
