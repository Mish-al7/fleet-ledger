import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function updateCredentials() {
    try {
        await mongoose.connect(MONGODB_URI);

        const adminPassword = await bcrypt.hash('Bishara123', 10);

        // Find the existing admin or create a new one if not found
        const result = await User.findOneAndUpdate(
            { role: 'admin' },
            {
                email: 'bishara@hub102.com',
                password: adminPassword,
                name: 'Bishara Admin'
            },
            { upsert: true, new: true }
        );

        console.log('✅ Admin credentials updated successfully.');
        console.log(`   Email: ${result.email}`);
        console.log('   Password: Bishara123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating credentials:', error);
        process.exit(1);
    }
}

updateCredentials();
