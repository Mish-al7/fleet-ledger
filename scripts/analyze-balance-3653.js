import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');
let MONGODB_URI = null;

if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf-8');
    const uriMatch = envContent.match(/^(?:export\s+)?MONGODB_URI=(.+)$/m);
    if (uriMatch) MONGODB_URI = uriMatch[1].trim();
}

if (!MONGODB_URI && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const uriMatch = envContent.match(/^MONGODB_URI=(.+)$/m);
    if (uriMatch) MONGODB_URI = uriMatch[1].trim();
}

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
}

const VehicleSchema = new mongoose.Schema({
    vehicle_no: { type: String, required: true },
}, { timestamps: true });

const TripSchema = new mongoose.Schema({
    trip_date: Date,
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    trip_route: String,
    income: { type: Number, default: 0 },
    fuel: { type: Number, default: 0 },
    fasttag: { type: Number, default: 0 },
    driver_allowance: { type: Number, default: 0 },
    service: { type: Number, default: 0 },
    deposit_to_kdr_bank: { type: Number, default: 0 },
    other_expense: { type: Number, default: 0 },
    total_expenses: { type: Number, default: 0 },
}, { timestamps: true });

const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
const Trip = mongoose.models.Trip || mongoose.model('Trip', TripSchema);

async function analyzeBalances() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);

        const vehicleNo = 'KL-58-AJ-3653';
        console.log(`Analyzing balances for ${vehicleNo}...`);

        const vehicle = await Vehicle.findOne({ vehicle_no: vehicleNo });
        if (!vehicle) {
            console.error('Vehicle not found!');
            return;
        }

        // Fetch all trips
        const trips = await Trip.find({ vehicle_id: vehicle._id }).sort({ trip_date: 1 });

        console.log(`Found ${trips.length} total trips.`);

        let totalBalance = 0;
        let balance2026 = 0;
        let balancePre2026 = 0;

        for (const t of trips) {
            const year = new Date(t.trip_date).getFullYear();
            const net = (t.income || 0) - (t.total_expenses || 0);

            totalBalance += net;

            if (year === 2026) {
                balance2026 += net;
            } else if (year < 2026) {
                balancePre2026 += net;
            }
        }

        console.log(`\nAnalysis:`);
        console.log(`Total Cumulative Balance (All Time): ${totalBalance}`);
        console.log(`2026 Balance (Header "Running"): ${balance2026}`);
        console.log(`Pre-2026 Balance (Difference): ${balancePre2026}`);

        console.log(`\nCheck: 2026 Balance (${balance2026}) + Pre-2026 (${balancePre2026}) = ${balance2026 + balancePre2026}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

analyzeBalances();
