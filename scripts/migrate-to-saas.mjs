/**
 * Migration Script: Convert fleet-ledger to multi-tenant SaaS
 * 
 * This script:
 * 1. Creates a default Company document
 * 2. Assigns company_id to all existing records across all collections
 * 3. Drops old unique indexes that conflict with new compound indexes
 * 
 * Run with: node scripts/migrate-to-saas.mjs
 * 
 * Requires: MONGODB_URI in .env
 */

import mongoose from 'mongoose';
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

async function migrate() {
    console.log('🚀 Starting SaaS migration...\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Step 1: Create default company
    console.log('📦 Step 1: Creating default company...');
    const companiesCollection = db.collection('companies');

    let defaultCompany = await companiesCollection.findOne({ name: 'Default Company' });

    if (!defaultCompany) {
        const result = await companiesCollection.insertOne({
            name: 'Default Company',
            email: 'admin@defaultcompany.com',
            plan: 'pro',
            status: 'active',
            created_at: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        defaultCompany = { _id: result.insertedId };
        console.log(`   ✅ Created default company: ${result.insertedId}`);
    } else {
        console.log(`   ℹ️  Default company already exists: ${defaultCompany._id}`);
    }

    const companyId = defaultCompany._id;

    // Step 2: Migrate all collections
    console.log('\n📦 Step 2: Assigning company_id to existing records...\n');

    const collections = [
        'users',
        'vehicles',
        'trips',
        'bookings',
        'adminexpenses',
        'admincashledgers',
        'openingbalances',
        'tripsheets',
        'vehicleservicelogs',
    ];

    for (const collName of collections) {
        try {
            const coll = db.collection(collName);
            const count = await coll.countDocuments({ company_id: { $exists: false } });

            if (count > 0) {
                const result = await coll.updateMany(
                    { company_id: { $exists: false } },
                    { $set: { company_id: companyId } }
                );
                console.log(`   ✅ ${collName}: updated ${result.modifiedCount} documents`);
            } else {
                const total = await coll.countDocuments();
                if (total === 0) {
                    console.log(`   ⏩ ${collName}: empty collection, skipped`);
                } else {
                    console.log(`   ✅ ${collName}: all ${total} documents already have company_id`);
                }
            }
        } catch (err) {
            console.log(`   ⚠️  ${collName}: ${err.message}`);
        }
    }

    // Step 3: Drop conflicting old unique indexes
    console.log('\n📦 Step 3: Dropping old unique indexes (if they exist)...\n');

    const indexesToDrop = [
        { collection: 'vehicles', index: 'vehicle_no_1' },
        { collection: 'users', index: 'email_1' },
        { collection: 'bookings', index: 'booking_no_1' },
        { collection: 'tripsheets', index: 'trip_sheet_no_1' },
        { collection: 'openingbalances', index: 'vehicle_id_1_year_1' },
    ];

    for (const { collection, index } of indexesToDrop) {
        try {
            const coll = db.collection(collection);
            await coll.dropIndex(index);
            console.log(`   ✅ Dropped index ${index} from ${collection}`);
        } catch (err) {
            if (err.codeName === 'IndexNotFound' || err.message.includes('index not found')) {
                console.log(`   ⏩ ${collection}.${index}: not found, skipped`);
            } else {
                console.log(`   ⚠️  ${collection}.${index}: ${err.message}`);
            }
        }
    }

    console.log('\n🎉 Migration complete!\n');
    console.log(`   Default Company ID: ${companyId}`);
    console.log('   You can now start the application with multi-tenancy enabled.\n');

    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
