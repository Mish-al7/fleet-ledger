import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import AdminExpense from '@/models/AdminExpense';
import mongoose from 'mongoose';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const company_id = new mongoose.Types.ObjectId(session.user.company_id);
        const { searchParams } = new URL(req.url);

        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const vehicle_id = searchParams.get('vehicle_id');
        const driver_id = searchParams.get('driver_id');

        // Build trip match — $type:'date' guards against null/string trip_date fields
        const tripMatch = { company_id, trip_date: { $type: 'date' } };
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

        // Aggregate trips by date; filter null _id so no null key leaks into dateMap
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
                },
            },
            { $sort: { date: 1 } },
        ]);

        // Build admin expense match — same null guard on start_date
        const expenseMatch = { company_id, start_date: { $type: 'date' } };
        if (from || to) {
            expenseMatch.start_date = { $type: 'date' };
            if (from) expenseMatch.start_date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                expenseMatch.start_date.$lte = toDate;
            }
        }
        if (vehicle_id) expenseMatch.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);

        const adminExpenseRows = await AdminExpense.aggregate([
            { $match: expenseMatch },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$start_date' } },
                    admin_expenses: { $sum: '$amount' },
                },
            },
            { $match: { _id: { $ne: null } } },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    admin_expenses: 1,
                },
            },
            { $sort: { date: 1 } },
        ]);

        // Merge into a unified date map — skip any row that somehow has a falsy date
        const dateMap = {};
        for (const row of tripRows) {
            if (!row.date) continue;
            dateMap[row.date] = {
                date: row.date,
                income: row.income,
                trip_expenses: row.trip_expenses,
                admin_expenses: 0,
                trip_count: row.trip_count,
            };
        }
        for (const row of adminExpenseRows) {
            if (!row.date) continue;
            if (dateMap[row.date]) {
                dateMap[row.date].admin_expenses = row.admin_expenses;
            } else {
                dateMap[row.date] = {
                    date: row.date,
                    income: 0,
                    trip_expenses: 0,
                    admin_expenses: row.admin_expenses,
                    trip_count: 0,
                };
            }
        }

        const rows = Object.values(dateMap)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(row => ({
                ...row,
                total_expenses: row.trip_expenses + row.admin_expenses,
                net_profit: row.income - (row.trip_expenses + row.admin_expenses),
            }));

        // Summary totals
        const totals = rows.reduce(
            (acc, r) => ({
                income: acc.income + r.income,
                trip_expenses: acc.trip_expenses + r.trip_expenses,
                admin_expenses: acc.admin_expenses + r.admin_expenses,
                total_expenses: acc.total_expenses + r.total_expenses,
                net_profit: acc.net_profit + r.net_profit,
                trip_count: acc.trip_count + r.trip_count,
            }),
            { income: 0, trip_expenses: 0, admin_expenses: 0, total_expenses: 0, net_profit: 0, trip_count: 0 }
        );

        return NextResponse.json({ success: true, data: rows, totals });
    } catch (err) {
        console.error('[reports/profit-loss]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
