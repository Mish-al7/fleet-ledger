import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import all models
import User from '../src/models/User.js';
import Vehicle from '../src/models/Vehicle.js';
import Trip from '../src/models/Trip.js';
import OpeningBalance from '../src/models/OpeningBalance.js';
import AdminCashLedger from '../src/models/AdminCashLedger.js';
import AdminExpense from '../src/models/AdminExpense.js';
import Booking from '../src/models/Booking.js';
import TripSheet from '../src/models/TripSheet.js';
import VehicleServiceLog from '../src/models/VehicleServiceLog.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

async function resetProductionDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log(`Target Database: ${MONGODB_URI}`);
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        // 1. Delete all existing data
        console.log('\n🗑️  Cleaning all collections...');

        await Promise.all([
            User.deleteMany({}),
            Vehicle.deleteMany({}),
            Trip.deleteMany({}),
            OpeningBalance.deleteMany({}),
            AdminCashLedger.deleteMany({}),
            AdminExpense.deleteMany({}),
            Booking.deleteMany({}),
            TripSheet.deleteMany({}),
            VehicleServiceLog.deleteMany({})
        ]);

        console.log('✅ All data cleared.');

        // 2. Create Admin Account
        console.log('\n👤 Creating Default Admin account...');
        const adminPassword = await bcrypt.hash('123@hub102', 10);

        const admin = await User.create({
            name: 'System Admin',
            email: 'user@hub102.com',
            password: adminPassword,
            role: 'admin'
        });

        console.log('✅ Admin account created successfully.');

        console.log('\n🎉 Database Reset Complete!');
        console.log('---------------------------------------------------');
        console.log('Login Credentials:');
        console.log('Email:    user@hub102.com');
        console.log('Password: 123@hub102');
        console.log('---------------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during reset:', error);
        process.exit(1);
    }
}

// Run the function
resetProductionDatabase();
