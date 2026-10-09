import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../modules/users/user.model.js';
import { UserRole } from '../modules/users/user.types.js';
import { hashPassword } from '../modules/auth/auth.utils.js';
import { bootstrapInitialAdmin } from '../modules/admin/admin.bootstrap.js';

export interface EssentialAccountDefinition {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  facilityId: string;
  preferredLanguage: string;
  ageMonths?: number;
}

export const ESSENTIAL_DEMO_ACCOUNTS: EssentialAccountDefinition[] = [
  {
    name: 'Dr. Arun Sharma',
    email: 'doctor.demo.001@example.test',
    phone: '+919000000020',
    role: UserRole.DOCTOR,
    password: 'Password123!',
    facilityId: 'FAC-DH-CUTTACK',
    preferredLanguage: 'en',
  },
  {
    name: 'Priya Das',
    email: 'nurse.demo.001@example.test',
    phone: '+919000000010',
    role: UserRole.NURSE,
    password: 'Password123!',
    facilityId: 'FAC-DH-CUTTACK',
    preferredLanguage: 'en',
  },
  {
    name: 'Anita Verma',
    email: 'patient.demo.001@example.test',
    phone: '+919000000001',
    role: UserRole.PATIENT,
    password: 'Password123!',
    facilityId: 'FAC-DH-CUTTACK',
    preferredLanguage: 'hi',
    ageMonths: 420,
  },
  {
    name: 'Biren Mohapatra',
    email: 'patient.demo.002@example.test',
    phone: '+919000000002',
    role: UserRole.PATIENT,
    password: 'Password123!',
    facilityId: 'FAC-DH-CUTTACK',
    preferredLanguage: 'or',
    ageMonths: 624,
  },
];

export async function seedEssentialAccounts(): Promise<void> {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  // 1. Ensure root admin is present and verified
  await bootstrapInitialAdmin();

  // 2. Upsert the 4 demo accounts
  console.log('Seeding essential demo accounts (1 doctor, 1 nurse, 2 patients)...');

  for (const acc of ESSENTIAL_DEMO_ACCOUNTS) {
    const passwordHash = await hashPassword(acc.password);
    const updated = await User.findOneAndUpdate(
      { email: acc.email.toLowerCase().trim() },
      {
        $set: {
          name: acc.name,
          email: acc.email.toLowerCase().trim(),
          phone: acc.phone,
          passwordHash,
          role: acc.role,
          facilityId: acc.facilityId,
          preferredLanguage: acc.preferredLanguage,
          ageMonths: acc.ageMonths ?? null,
          isActive: true,
          isDeleted: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(` ✓ [${acc.role}] ${acc.name} (${acc.email}) -> ID: ${updated._id}`);
  }

  console.log('\n--- ALL DEMO ACCOUNTS READY ---');
  console.log('1. Doctor:    doctor.demo.001@example.test / Password123!');
  console.log('2. Nurse:     nurse.demo.001@example.test  / Password123!');
  console.log('3. Patient 1: patient.demo.001@example.test / Password123!');
  console.log('4. Patient 2: patient.demo.002@example.test / Password123!');
  console.log(`5. Admin:     ${env.INITIAL_ADMIN_EMAIL} / ${env.INITIAL_ADMIN_PASSWORD}`);
  console.log('-------------------------------\n');
}

// Execute directly if run as a CLI script
if (process.argv[1]?.endsWith('seed-essential-accounts.ts')) {
  seedEssentialAccounts()
    .then(async () => {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB. Seed script completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to seed essential accounts:', err);
      process.exit(1);
    });
}
