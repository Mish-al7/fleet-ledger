import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Get month filter from query params
        const { searchParams } = new URL(req.url);
        const monthFilter = searchParams.get('month');

        // Build match stage if month filter provided
        const matchStage = monthFilter ? { $match: { month: monthFilter } } : null;

        // Aggregation Pipeline
        const pipeline = [
            ...(matchStage ? [matchStage] : []),
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
        ];

        const summary = await Trip.aggregate(pipeline);

        // Also fetch all distinct months available for filtering
        const allMonths = await Trip.distinct('month');
        const availableMonths = allMonths.sort().reverse();

        return NextResponse.json({
            success: true,
            data: summary,
            availableMonths
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
