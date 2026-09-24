import mongoose, { Schema, Model } from 'mongoose';
import { IUserDocument, UserRole } from './user.types.js';

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: { unique: true, sparse: true },
    },
    phone: {
      type: String,
      trim: true,
      index: { unique: true, sparse: true },
    },
    passwordHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: [true, 'User role is required'],
      default: UserRole.PATIENT,
      index: true,
    },
    facilityId: {
      type: String,
      trim: true,
      index: true,
    },
    preferredLanguage: {
      type: String,
      default: 'en',
      trim: true,
    },
    ageMonths: {
      type: Number,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Mongoose model pattern safe for repeated hot-reload / test imports
export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
