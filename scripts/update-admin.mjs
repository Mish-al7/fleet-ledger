import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

const [, , newEmail, newPassword] = process.argv;

if (!newEmail || !newPassword) {
    console.error('Usage: node scripts/update-admin.mjs <new_email> <new_password>');
    process.exit(1);
}

async function updateAdmin() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Find existing admin or create one
        // tailored for the 'admin' role
        const result = await User.findOneAndUpdate(
            { role: 'admin' },
            {
                email: newEmail,
                password: hashedPassword,
                name: 'Admin User' // Ensure name is set
            },
            { new: true, upsert: true } // Create if not exists
        );

        console.log(`✅ Admin updated successfully!`);
        console.log(`   Email: ${result.email}`);
        console.log(`   Role: ${result.role}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to update admin:', err);
        process.exit(1);
    }
}

updateAdmin();
