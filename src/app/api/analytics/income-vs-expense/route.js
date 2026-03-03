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

        const company_id = new mongoose.Types.ObjectId(session.user.company_id);
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const match = { company_id };
        if (from || to) {
            match.trip_date = {};
            if (from) match.trip_date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                match.trip_date.$lte = toDate;
            }
        }

        const data = await Trip.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$month',
                    income: { $sum: '$income' },
                    expense: { $sum: '$total_expenses' },
                },
            },
            {
                $project: {
                    _id: 0,
                    month: '$_id',
                    income: 1,
                    expense: 1,
                },
            },
            { $sort: { month: 1 } },
        ]);

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('[analytics/income-vs-expense]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
