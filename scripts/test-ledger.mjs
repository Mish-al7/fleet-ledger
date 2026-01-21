import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Trip from '../src/models/Trip.js';
import OpeningBalance from '../src/models/OpeningBalance.js';
import Vehicle from '../src/models/Vehicle.js';
import User from '../src/models/User.js';

// Mocking the Logic from the API for testing purposes
async function getLedger(vehicleId) {
    const obDoc = await OpeningBalance.findOne({ vehicle_id: vehicleId });
    const startBalance = obDoc ? obDoc.opening_balance : 0;

    const trips = await Trip.find({ vehicle_id: vehicleId })
        .sort({ trip_date: 1 })
        .lean();

    let currentBalance = startBalance;
    const ledger = trips.map(trip => {
        currentBalance = currentBalance + (trip.income || 0) - (trip.total_expenses || 0);
        return {
            ...trip,
            running_balance: currentBalance
        };
    });

    return { opening_balance: startBalance, ledger };
}

async function run() {
    try {
        if (!process.env.MONGODB_URI) throw new Error('No MONGODB_URI');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Cleanup
        await Trip.deleteMany({});
        await OpeningBalance.deleteMany({});
        await Vehicle.deleteMany({});

        // 2. Setup
        const vehicle = await Vehicle.create({ vehicle_no: 'KA-TEST-9999', status: 'active' });
        const admin = await User.findOne({ role: 'admin' }) || await User.create({ name: 'Admin', email: 'admin@test.com', password: 'hash', role: 'admin' });
        const driver = await User.findOne({ role: 'driver' }) || await User.create({ name: 'Driver', email: 'driver@test.com', password: 'hash', role: 'driver' });

        console.log('✅ Setup Complete');

        // 3. Set Opening Balance to 1000
        await OpeningBalance.create({ vehicle_id: vehicle._id, opening_balance: 1000 });
        console.log('✅ Opening Balance Set: 1000');

        // 4. Create Trip 1: Income 5000, Exp 1000. => Bal 1000 + 5000 - 1000 = 5000
        await Trip.create({
            trip_date: '2025-01-01',
            vehicle_id: vehicle._id,
            driver_id: driver._id,
            trip_route: 'Route 1',
            income: 5000,
            fuel: 1000,
            // total_expenses = 1000
        });

        // 5. Create Trip 2: Income 0, Exp 200. => Bal 5000 + 0 - 200 = 4800
        await Trip.create({
            trip_date: '2025-01-02',
            vehicle_id: vehicle._id,
            driver_id: driver._id,
            trip_route: 'Route 2',
            income: 0,
            fasttag: 200,
        });

        // 6. Verify Ledger
        const result = await getLedger(vehicle._id);

        const finalBalance = result.ledger[result.ledger.length - 1].running_balance;

        if (finalBalance === 4800) {
            console.log(`✅ Ledger Calculation Verified. Final Balance: ${finalBalance}`);
        } else {
            console.error(`❌ Ledger Failed. Expected 4800, got ${finalBalance}`);
            console.log(JSON.stringify(result, null, 2));
            process.exit(1);
        }

        process.exit(0);

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

run();
