import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Trip from '../src/models/Trip.js';
import Vehicle from '../src/models/Vehicle.js';
import Booking from '../src/models/Booking.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verify() {
    try {
        await mongoose.connect(MONGODB_URI);

        const counts = {
            Users: await User.countDocuments({}),
            Trips: await Trip.countDocuments({}),
            Vehicles: await Vehicle.countDocuments({}),
            Bookings: await Booking.countDocuments({})
        };

        console.log('--- Database Verification ---');
        console.log(`Users: ${counts.Users} (Expected: 1)`);
        console.log(`Trips: ${counts.Trips} (Expected: 0)`);
        console.log(`Vehicles: ${counts.Vehicles} (Expected: 0)`);
        console.log(`Bookings: ${counts.Bookings} (Expected: 0)`);

        const admin = await User.findOne({ email: 'admin@fleetledger.com' });
        console.log(`Admin user found: ${admin ? '✅ YES' : '❌ NO'}`);

        process.exit(0);
    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    }
}

verify();
