import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Trip from '../src/models/Trip.js';
import Vehicle from '../src/models/Vehicle.js';

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Using the same pipeline as the API
        const summary = await Trip.aggregate([
            {
                $group: {
                    _id: {
                        month: "$month",
                        vehicle_id: "$vehicle_id"
                    },
                    total_income: { $sum: "$income" },
                    total_expenses: { $sum: "$total_expenses" },
                    trip_count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "_id.vehicle_id",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            { $unwind: "$vehicle" },
            {
                $project: {
                    _id: 0,
                    month: "$_id.month",
                    vehicle_id: "$_id.vehicle_id",
                    vehicle_no: "$vehicle.vehicle_no",
                    total_income: 1,
                    total_expenses: 1,
                    trip_count: 1,
                    profit: { $subtract: ["$total_income", "$total_expenses"] }
                }
            },
            { $sort: { month: -1, vehicle_no: 1 } }
        ]);

        console.log('✅ Summary Aggregation Result:');
        console.table(summary);

        if (summary.length > 0) {
            const first = summary[0];
            if (first.profit !== (first.total_income - first.total_expenses)) {
                throw new Error('Profit calculation mismatch');
            }
        }

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
