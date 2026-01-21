import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Vehicle from '../src/models/Vehicle.js';
import User from '../src/models/User.js';
import Trip from '../src/models/Trip.js';
import OpeningBalance from '../src/models/OpeningBalance.js';

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Vehicle.deleteMany({});
        await Trip.deleteMany({});
        await OpeningBalance.deleteMany({});
        console.log('✅ Cleared existing data');

        // Create Admin
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@fleet.com',
            password: adminPassword,
            role: 'admin'
        });
        console.log('✅ Created Admin (email: admin@fleet.com, password: admin123)');

        // Create Vehicles
        const vehicle1 = await Vehicle.create({
            vehicle_no: 'KA-01-AB-1234',
            status: 'active'
        });

        const vehicle2 = await Vehicle.create({
            vehicle_no: 'KA-02-CD-5678',
            status: 'active'
        });
        console.log('✅ Created 2 vehicles');

        // Create Driver
        const driverPassword = await bcrypt.hash('driver123', 10);
        const driver = await User.create({
            name: 'Driver User',
            email: 'driver@fleet.com',
            password: driverPassword,
            role: 'driver',
            assignedVehicles: [vehicle1._id]
        });
        console.log('✅ Created Driver (email: driver@fleet.com, password: driver123)');
        console.log(`   Assigned to: ${vehicle1.vehicle_no}`);

        // Set Opening Balances
        await OpeningBalance.create({
            vehicle_id: vehicle1._id,
            opening_balance: 10000
        });

        await OpeningBalance.create({
            vehicle_id: vehicle2._id,
            opening_balance: 5000
        });
        console.log('✅ Set opening balances');

        // Create sample trips
        await Trip.create({
            trip_date: new Date('2025-01-15'),
            vehicle_id: vehicle1._id,
            driver_id: driver._id,
            trip_route: 'Bangalore to Chennai',
            income: 15000,
            fuel: 3000,
            fasttag: 500,
            driver_allowance: 1000,
            service: 0,
            deposit_to_kdr_bank: 5000,
            other_expense: 200
        });

        await Trip.create({
            trip_date: new Date('2025-01-20'),
            vehicle_id: vehicle1._id,
            driver_id: driver._id,
            trip_route: 'Chennai to Bangalore',
            income: 14000,
            fuel: 2800,
            fasttag: 500,
            driver_allowance: 1000,
            service: 500,
            deposit_to_kdr_bank: 4000,
            other_expense: 100
        });

        await Trip.create({
            trip_date: new Date('2025-02-05'),
            vehicle_id: vehicle1._id,
            driver_id: driver._id,
            trip_route: 'Bangalore to Hyderabad',
            income: 12000,
            fuel: 2500,
            fasttag: 400,
            driver_allowance: 1000,
            service: 0,
            deposit_to_kdr_bank: 3500,
            other_expense: 150
        });

        console.log('✅ Created 3 sample trips');
        console.log('\n🎉 Seeding complete!');
        console.log('\nLogin Credentials:');
        console.log('  Admin: admin@fleet.com / admin123');
        console.log('  Driver: driver@fleet.com / driver123');

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
