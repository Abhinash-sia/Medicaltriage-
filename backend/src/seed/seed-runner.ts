/**
 * STANDALONE SEED RUNNER CLI
 * 
 * Command-line runner to initialize the deterministic synthetic dataset.
 * Refuses execution in production environment.
 * 
 * Usage:
 *   npm run seed:test-data
 */

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { SeedService } from './seed.service.js';

async function run(): Promise<void> {
  if (process.env.NODE_ENV === 'production' || env.NODE_ENV === 'production') {
    console.error('ERROR: Synthetic data seeding is forbidden in production environment.');
    process.exit(1);
  }

  const mongoUri = env.MONGODB_URI || 'mongodb://localhost:27017/medical_triage';
  console.log(`Connecting to database: ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri);
    console.log('Database connected successfully.');

    console.log('\n--- SEEDING DETERMINISTIC SYNTHETIC DATASET ---');
    const summary = await SeedService.seed();

    console.log('\n======================================================');
    console.log('       SYNTHETIC DATASET SEEDED SUCCESSFULLY          ');
    console.log('======================================================');
    console.log(` Facilities:           ${summary.facilities}`);
    console.log(` Users:                ${summary.users}`);
    console.log(` Cases:                ${summary.cases}`);
    console.log(` Safety Evaluations:   ${summary.safetyEvaluations}`);
    console.log(` Triage Notes:         ${summary.triageNotes}`);
    console.log(` Reviews:              ${summary.reviews}`);
    console.log(` Referrals:            ${summary.referrals}`);
    console.log(` Notifications:        ${summary.notifications}`);
    console.log(` Audit Logs:           ${summary.auditLogs}`);
    console.log(` Voice Inputs (STT):   ${summary.voiceInputs}`);
    console.log(` Medical Reports (OCR):${summary.reports}`);
    console.log(` Visual Inputs:        ${summary.visualInputs}`);
    console.log(` Translations:         ${summary.translations}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Failed to seed synthetic dataset:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

run();
