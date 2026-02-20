import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
}

async function createSuperAdmin() {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const email = 'super@admin.com';
    const password = 'admin123';

    // Check if already exists
    const existing = await usersCollection.findOne({ email, role: 'super_admin' });
    if (existing) {
        console.log('ℹ️  Super admin already exists');
        console.log(`   Email: ${email}`);
        await mongoose.disconnect();
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await usersCollection.insertOne({
        name: 'Super Admin',
        email,
        password: hashedPassword,
        role: 'super_admin',
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    console.log('✅ Super admin created!');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n   Log in at /auth/signin, then go to /super-admin/companies');

    await mongoose.disconnect();
}

createSuperAdmin().catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
