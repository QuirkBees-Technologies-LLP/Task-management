/**
 * SuperAdmin Seed Script
 * 
 * ONE-TIME script to create a SuperAdmin user for local/dev testing.
 * 
 * Usage:
 *   npm run seed:superadmin
 * 
 * Environment variables required:
 *   SUPERADMIN_EMAIL - Email for the SuperAdmin account
 *   SUPERADMIN_PASSWORD - Password for the SuperAdmin account
 * 
 * This script:
 * - Creates a user with isSystemAdmin: true
 * - Hashes password with bcrypt
 * - Skips if SuperAdmin already exists
 * - Does NOT auto-run on app start
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local first, then .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

let envFilesLoaded = false;

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
    console.log('📄 Loaded .env.local');
    envFilesLoaded = true;
}

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('📄 Loaded .env');
    envFilesLoaded = true;
}

if (!envFilesLoaded) {
    console.log('⚠️  Warning: No .env or .env.local file found');
    console.log('   Environment variables will be read from system environment');
}

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;

async function seedSuperAdmin() {
    // Validate environment variables
    if (!MONGODB_URI) {
        console.error('❌ Error: MONGODB_URI is not set in environment variables');
        process.exit(1);
    }

    if (!DATABASE_NAME) {
        console.error('❌ Error: DATABASE_NAME is not set in environment variables');
        process.exit(1);
    }

    if (!SUPERADMIN_EMAIL) {
        console.error('❌ Error: SUPERADMIN_EMAIL is not set in environment variables');
        console.error('   Please add the following to your .env or .env.local file:');
        console.error('   SUPERADMIN_EMAIL=your-email@example.com');
        console.error(`   File location: ${envLocalPath} or ${envPath}`);
        process.exit(1);
    }

    if (!SUPERADMIN_PASSWORD) {
        console.error('❌ Error: SUPERADMIN_PASSWORD is not set in environment variables');
        console.error('   Please add the following to your .env or .env.local file:');
        console.error('   SUPERADMIN_PASSWORD=your-secure-password');
        console.error(`   File location: ${envLocalPath} or ${envPath}`);
        process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(SUPERADMIN_EMAIL)) {
        console.error('❌ Error: SUPERADMIN_EMAIL is not a valid email address');
        process.exit(1);
    }

    // Validate password length
    if (SUPERADMIN_PASSWORD.length < 6) {
        console.error('❌ Error: SUPERADMIN_PASSWORD must be at least 6 characters');
        process.exit(1);
    }

    let client: MongoClient | null = null;

    try {
        console.log('🔌 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(DATABASE_NAME);
        const usersCollection = db.collection('users');

        // Check if SuperAdmin already exists
        console.log(`🔍 Checking if SuperAdmin with email "${SUPERADMIN_EMAIL}" already exists...`);
        const existingSuperAdmin = await usersCollection.findOne({
            email: SUPERADMIN_EMAIL,
            isSystemAdmin: true,
        });

        if (existingSuperAdmin) {
            console.log('⚠️  SuperAdmin already exists with this email');
            console.log(`   User ID: ${existingSuperAdmin._id}`);
            console.log('   Skipping creation...');
            return;
        }

        // Hash the password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

        // Create SuperAdmin user
        console.log('👤 Creating SuperAdmin user...');
        const result = await usersCollection.insertOne({
            email: SUPERADMIN_EMAIL,
            password: hashedPassword,
            isSystemAdmin: true,
            // NO org_id - SuperAdmin is system-level
            firstName: 'Super',
            lastName: 'Admin',
            role: 'Admin', // Role for compatibility, but isSystemAdmin is the key
            createdAt: new Date(),
            updatedAt: new Date(),
            emailVerified: true, // Assume verified for seed
            isTemporaryPassword: false,
        });

        console.log('✅ SuperAdmin user created successfully!');
        console.log(`   User ID: ${result.insertedId}`);
        console.log(`   Email: ${SUPERADMIN_EMAIL}`);
        console.log('');
        console.log('📝 You can now log in using:');
        console.log(`   POST /api/superadmin/auth/login`);
        console.log(`   Email: ${SUPERADMIN_EMAIL}`);
        console.log(`   Password: [your SUPERADMIN_PASSWORD]`);
        console.log('');
        console.log('⚠️  Remember to remove SUPERADMIN_PASSWORD from .env after testing!');

    } catch (error: any) {
        console.error('❌ Error seeding SuperAdmin:', error.message);
        if (error.code === 11000) {
            console.error('   Duplicate key error - SuperAdmin may already exist');
        }
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 MongoDB connection closed');
        }
    }
}

// Run the seed script
seedSuperAdmin()
    .then(() => {
        console.log('✨ Seed script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

