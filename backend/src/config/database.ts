import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

let listenersAttached = false;
let isConnecting = false;

const attachListeners = (): void => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established successfully');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err: err.message }, 'MongoDB connection error occurred');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection disconnected');
  });
};

export const connectDatabase = async (retries = 3, delayMs = 2500): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  attachListeners();

  if (isConnecting) return;
  isConnecting = true;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
      });
      isConnecting = false;
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown MongoDB connection error';
      logger.error(
        { error: message, attempt, maxRetries: retries },
        `Failed to connect to MongoDB (attempt ${attempt}/${retries})`
      );

      if (attempt < retries) {
        logger.info(`Retrying MongoDB connection in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        isConnecting = false;
        if (env.NODE_ENV === 'production') {
          throw error;
        }
      }
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('MongoDB connection closed cleanly');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error closing MongoDB connection';
    logger.error({ error: message }, 'Failed to close MongoDB connection');
  }
};

