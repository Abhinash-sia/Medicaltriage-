import mongoose, { Schema, Model } from 'mongoose';
import { IAuditLogDocument, AuditEventType } from './audit-log.types.js';

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: {
      type: String,
      required: [true, 'Actor ID is required'],
      index: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditEventType),
      required: [true, 'Audit event type action is required'],
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
    },
    resourceId: {
      type: String,
      required: true,
      trim: true,
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      default: null,
      index: true,
    },
    requestId: {
      type: String,
      default: null,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      default: 'BACKEND_API',
    },
    outcome: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for resource audit tracing and timeline queries
AuditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
