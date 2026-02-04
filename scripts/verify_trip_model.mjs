import mongoose from 'mongoose';
import Trip from '../src/models/Trip.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' }); // Or .env depending on your setup

async function verifyTripModel() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create a dummy trip with new fields
        const tripData = {
            trip_date: new Date(),
            vehicle_id: new mongoose.Types.ObjectId(), // Dummy ID
            driver_id: new mongoose.Types.ObjectId(), // Dummy ID
            trip_route: 'Test Route',
            income: 1000,
            fuel: 100,
            fasttag: 50,
            driver_allowance: 200, // Allowance (Driver Bata)
            service: 150, // Workshop Service
            adblue: 30,
            grease: 20,
            air: 10,
            deposit_to_kdr_bank: 0,
            other_expense: 0,
            notes: 'Test trip for verification'
        };

        const expectedTotalExpenses = 100 + 50 + 200 + 150 + 30 + 20 + 10; // = 560

        // We can't actually save this because of foreign key constraints (vehicle_id/driver_id),
        // but we can validate it.
        const trip = new Trip(tripData);

        // Trigger validation (which runs pre-validate hook)
        await trip.validate();

        console.log('Total Expenses Calculated:', trip.total_expenses);

        if (trip.total_expenses === expectedTotalExpenses) {
            console.log('SUCCESS: Total expenses calculation includes new fields correctly.');
        } else {
            console.error(`FAILURE: Expected ${expectedTotalExpenses}, got ${trip.total_expenses}`);
        }

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyTripModel();
