import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import AdminCashLedger from '@/models/AdminCashLedger';
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
            match.date = {};
            if (from) match.date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                match.date.$lte = toDate;
            }
        }

        const data = await AdminCashLedger.aggregate([
            { $match: match },
            {
                $project: {
                    _id: 1,
                    date: {
                        $dateToString: { format: '%Y-%m-%d', date: '$date' },
                    },
                    description: 1,
                    type: 1,
                    amount: 1,
                    running_balance: 1,
                },
            },
            { $sort: { date: 1, createdAt: 1 } },
        ]);

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('[reports/ledger-movement]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
