import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Trip from '../src/models/Trip.js';
import Vehicle from '../src/models/Vehicle.js';
import OpeningBalance from '../src/models/OpeningBalance.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

async function setup() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // 1. Delete all existing data
        console.log('Deleting all existing data...');
        await User.deleteMany({});
        await Trip.deleteMany({});
        await Vehicle.deleteMany({});
        await OpeningBalance.deleteMany({});
        console.log('Data cleared.');

        // 2. Create Admin Account
        console.log('Creating Admin account...');
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@fleetledger.com',
            password: adminPassword,
            role: 'admin'
        });
        console.log('Admin account created: admin@fleetledger.com / admin123');

        // 3. Create Sample Vehicle
        console.log('Creating Sample Vehicle...');
        const vehicle = await Vehicle.create({
            vehicle_no: 'SAMPLE-01',
            model: 'Sample Model'
        });
        console.log('Vehicle created: SAMPLE-01');

        // 4. Create Driver Account
        console.log('Creating Driver account...');
        const driverPassword = await bcrypt.hash('driver123', 10);
        const driver = await User.create({
            name: 'Default Driver',
            email: 'driver@fleetledger.com',
            password: driverPassword,
            role: 'driver',
            assignedVehicles: [vehicle._id]
        });
        console.log('Driver account created: driver@fleetledger.com / driver123');

        console.log('Setup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
}

setup();
