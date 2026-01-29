import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

async function fixIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('openingbalances');

        // 1. List valid indexes BEFORE
        console.log('\n--- Indexes BEFORE ---');
        const indexesBefore = await collection.indexes();
        console.log(indexesBefore);

        // 2. Drop the specific incorrect index
        const indexName = 'vehicle_id_1';
        const indexExists = indexesBefore.some(idx => idx.name === indexName);

        if (indexExists) {
            console.log(`\nFound incorrect index: ${indexName}. Dropping it...`);
            await collection.dropIndex(indexName);
            console.log('Index dropped successfully.');
        } else {
            console.log(`\nIndex ${indexName} not found. It might have been already removed.`);
        }

        // 3. List valid indexes AFTER
        console.log('\n--- Indexes AFTER ---');
        const indexesAfter = await collection.indexes();
        console.log(indexesAfter);

        // Check if correct index exists
        const correctIndexName = 'vehicle_id_1_year_1'; // Standard Mongo naming for { vehicle_id: 1, year: 1 }
        // Note: The exact name might differ if it was created with a custom name, but usually it's field_1_field_1
        const correctIndexExists = indexesAfter.some(idx => {
            // Check if keys match exactly
            const keys = Object.keys(idx.key);
            return keys.length === 2 && keys[0] === 'vehicle_id' && keys[1] === 'year';
        });

        if (correctIndexExists) {
            console.log(`\n✅ Verified: Correct compound index (vehicle_id + year) exists.`);
        } else {
            console.log(`\n⚠️ Warning: Correct compound index (vehicle_id + year) does NOT exist yet. The app should create it on startup or restart.`);
        }

        console.log('\nMigration complete.');
        process.exit(0);

    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
}

fixIndex();
