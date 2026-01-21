import dotenv from 'dotenv';
dotenv.config(); // defaults to .env
import mongoose from 'mongoose';

// We need to import the models manually since we are not using the Next.js runtime import
// And we need to define them or require them. 
// Since my models use `export default`, I cannot require them directly in CommonJS easily if they are ES modules.
// But my models are written with `export default`. Node.js doesn't support ES modules by default without .mjs or attributes.
// To fix this without changing models, I will use `import()` in an async IIFE or change this script to .mjs.
// I'll make this script `scripts/test-schemas.mjs`.

async function run() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) throw new Error('No MONGODB_URI');

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Dynamically import models
        const { default: Vehicle } = await import('../src/models/Vehicle.js');
        const { default: User } = await import('../src/models/User.js');
        const { default: Trip } = await import('../src/models/Trip.js');
        const { default: OpeningBalance } = await import('../src/models/OpeningBalance.js');

        // 1. Clear Data
        await Vehicle.deleteMany({});
        await User.deleteMany({});
        await Trip.deleteMany({});
        await OpeningBalance.deleteMany({});
        console.log('✅ Cleared old data');

        // 2. Create Vehicle
        const vehicle = await Vehicle.create({
            vehicle_no: 'KA-01-AB-1234',
            status: 'active'
        });
        console.log('✅ Created Vehicle:', vehicle.vehicle_no);

        // 3. Create Users
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@fleet.com',
            password: 'hashedpassword123',
            role: 'admin'
        });
        console.log('✅ Created Admin:', admin.email);

        const driver = await User.create({
            name: 'Driver User',
            email: 'driver@fleet.com',
            password: 'hashedpassword123',
            role: 'driver',
            assignedVehicles: [vehicle._id]
        });
        console.log('✅ Created Driver:', driver.email);

        // 4. Create Trip (Check Auto Calc)
        const trip = await Trip.create({
            trip_date: new Date('2025-01-15T10:00:00Z'), // Should be month 2025-01
            vehicle_id: vehicle._id,
            driver_id: driver._id,
            trip_route: 'Bangalore to Mysore',
            income: 5000,
            fuel: 1000,
            fasttag: 200,
            driver_allowance: 300,
            service: 0,
            deposit_to_kdr_bank: 0,
            other_expense: 100
            // total_expenses should be 1000+200+300+0+0+100 = 1600
        });

        if (trip.month === '2025-01' && trip.total_expenses === 1600) {
            console.log('✅ Trip Auto-Calc Verified (Month & Expenses)');
        } else {
            console.error('❌ Trip Auto-Calc Failed:', trip);
            process.exit(1);
        }

        console.log('✅ All Tests Passed');
        process.exit(0);

    } catch (err) {
        console.error('❌ Test Failed:', err);
        process.exit(1);
    }
}

run();
