
// Mongoose test script
import mongoose from 'mongoose';
import Vehicle from '../src/models/Vehicle.js';
// We don't need dotenv if we run with node --env-file=.env

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet-ledger';

async function runTest() {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('Warning: MONGODB_URI not set in environment. Using default.');
        }
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const vehicleNo = 'TEST-NICK-' + Math.floor(Math.random() * 10000);
        const nickname = 'Test Nickname';

        // 1. Create
        console.log('Creating vehicle...');
        const vehicle = await Vehicle.create({
            vehicle_no: vehicleNo,
            nickname: nickname,
            status: 'active'
        });

        console.log('Vehicle created:', vehicle);

        if (vehicle.nickname !== nickname) {
            throw new Error('Nickname mismatch on create');
        }

        // 2. Read
        console.log('Fetching vehicle...');
        const fetched = await Vehicle.findById(vehicle._id);
        console.log('Fetched vehicle:', fetched);

        if (fetched.nickname !== nickname) {
            throw new Error('Nickname mismatch on fetch');
        }

        // 3. Update
        console.log('Updating nickname...');
        const newNick = 'Updated Nickname';
        const updated = await Vehicle.findByIdAndUpdate(vehicle._id, { nickname: newNick }, { new: true });
        console.log('Updated vehicle:', updated);

        if (updated.nickname !== newNick) {
            throw new Error('Nickname mismatch on update');
        }

        // 4. Cleanup
        console.log('Deleting test vehicle...');
        await Vehicle.findByIdAndDelete(vehicle._id);
        console.log('Test passed!');

    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
