import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Trip from '../src/models/Trip.js';
import TripSheet from '../src/models/TripSheet.js';
import Booking from '../src/models/Booking.js';
import AdminCashLedger from '../src/models/AdminCashLedger.js';
import VehicleServiceLog from '../src/models/VehicleServiceLog.js';
import OpeningBalance from '../src/models/OpeningBalance.js';
import Vehicle from '../src/models/Vehicle.js';
import Settings from '../src/models/Settings.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

if (!MONGODB_URI.includes('Bishara')) {
    console.error('❌ Safety check failed: MONGODB_URI does not contain "Bishara". Refusing to run on potentially wrong database.');
    console.error(`Current URI: ${MONGODB_URI}`);
    process.exit(1);
}

async function clean() {
    try {
        console.log('🔗 Connecting to MongoDB (Bishara)...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        // 1. Delete all transactional, vehicle and setting data
        const models = [
            { name: 'Trip', model: Trip },
            { name: 'TripSheet', model: TripSheet },
            { name: 'Booking', model: Booking },
            { name: 'AdminCashLedger', model: AdminCashLedger },
            { name: 'VehicleServiceLog', model: VehicleServiceLog },
            { name: 'OpeningBalance', model: OpeningBalance },
            { name: 'Vehicle', model: Vehicle },
            { name: 'Settings', model: Settings }
        ];

        for (const item of models) {
            console.log(`🧹 Clearing ${item.name} collection...`);
            const result = await item.model.deleteMany({});
            console.log(`✅ Cleared ${item.name}: ${result.deletedCount} documents removed.`);
        }

        // 2. Clear all users and create a fresh admin
        console.log('🧹 Clearing User collection...');
        await User.deleteMany({});
        console.log('✅ User collection cleared.');

        console.log('👤 Creating fresh Admin account...');
        const adminPassword = await bcrypt.hash('Bishara123', 10);
        const admin = await User.create({
            name: 'System Admin',
            email: 'bishara@hub102.com',
            password: adminPassword,
            role: 'admin'
        });
        console.log('✅ Admin account created:');
        console.log(`   Email: ${admin.email}`);
        console.log('   Password: Bishara123');

        console.log('\n✨ Database cleanup and initialization completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

clean();
