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

        // Build trip match
        const tripMatch = { trip_date: { $type: 'date' } };
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

        const tripRows = await Trip.aggregate([
            { $match: tripMatch },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$trip_date' } },
                    income: { $sum: '$income' },
                    trip_expenses: { $sum: '$total_expenses' },
                    trip_count: { $sum: 1 },
                },
            },
            { $match: { _id: { $ne: null } } },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    income: 1,
                    trip_expenses: 1,
                    trip_count: 1,
                    admin_expenses: { $literal: 0 },
                    total_expenses: '$trip_expenses',
                    net_profit: { $subtract: ['$income', '$total_expenses'] }
                },
            },
            { $sort: { date: 1 } },
        ]);

        // Summary totals
        const totals = tripRows.reduce(
            (acc, r) => ({
                income: acc.income + r.income,
                trip_expenses: acc.trip_expenses + r.trip_expenses,
                admin_expenses: 0,
                total_expenses: acc.total_expenses + r.total_expenses,
                net_profit: acc.net_profit + r.net_profit,
                trip_count: acc.trip_count + r.trip_count,
            }),
            { income: 0, trip_expenses: 0, admin_expenses: 0, total_expenses: 0, net_profit: 0, trip_count: 0 }
        );

        return NextResponse.json({ success: true, data: tripRows, totals });
    } catch (err) {
        console.error('[reports/profit-loss]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
