import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import mongoose from 'mongoose';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const vehicle_id = searchParams.get('vehicle_id');
        const driver_id = searchParams.get('driver_id');

        const tripMatch = {};
        if (from || to) {
            tripMatch.trip_date = { $type: 'date' };
            if (from) tripMatch.trip_date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                tripMatch.trip_date.$lte = toDate;
            }
        }
        if (vehicle_id) tripMatch.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);
        if (driver_id) tripMatch.driver_id = new mongoose.Types.ObjectId(driver_id);

        const data = await Trip.aggregate([
            { $match: tripMatch },
            {
                $group: {
                    _id: '$vehicle_id',
                    income: { $sum: '$income' },
                    total_expenses: { $sum: '$total_expenses' },
                    trip_count: { $sum: 1 },
                    fuel: { $sum: '$fuel' },
                    fasttag: { $sum: '$fasttag' },
                    driver_allowance: { $sum: '$driver_allowance' },
                    service: { $sum: '$service' },
                    other_expense: { $sum: '$other_expense' },
                },
            },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'vehicle',
                },
            },
            { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    vehicle_id: '$_id',
                    vehicle_no: { $ifNull: ['$vehicle.vehicle_no', 'Unknown'] },
                    nickname: '$vehicle.nickname',
                    income: 1,
                    total_expenses: 1,
                    net_profit: { $subtract: ['$income', '$total_expenses'] },
                    profit_margin: {
                        $cond: [
                            { $gt: ['$income', 0] },
                            {
                                $multiply: [
                                    { $divide: [{ $subtract: ['$income', '$total_expenses'] }, '$income'] },
                                    100,
                                ],
                            },
                            0,
                        ],
                    },
                    trip_count: 1,
                },
            },
            { $sort: { net_profit: -1 } },
        ]);

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('[reports/vehicle-profitability]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
