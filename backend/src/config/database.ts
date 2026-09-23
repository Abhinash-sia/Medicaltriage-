import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err: err.message }, 'MongoDB connection error occurred');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected');
    });

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown MongoDB connection error';
    logger.error({ error: message }, 'Failed to connect to MongoDB');
    // Allow non-fatal boot in test mode or handles in caller
    if (env.NODE_ENV === 'production') {
      throw error;
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
