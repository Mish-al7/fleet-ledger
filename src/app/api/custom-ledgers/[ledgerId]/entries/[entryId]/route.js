import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import CustomLedger from '@/models/CustomLedger';
import CustomLedgerEntry from '@/models/CustomLedgerEntry';
import mongoose from 'mongoose';

// Reusable function to recalculate running balances for a specific ledger
async function recalculateRunningBalances(ledger_id) {
    const entries = await CustomLedgerEntry.find({ ledger_id })
        .sort({ date: 1, createdAt: 1 })
        .lean();

    if (entries.length === 0) return 0;

    let balance = 0;
    const bulkOps = [];

    for (const entry of entries) {
        if (entry.type === 'income') {
            balance += entry.amount;
        } else if (entry.type === 'expense') {
            balance -= entry.amount;
        }

        if (entry.running_balance !== balance) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: entry._id },
                    update: { $set: { running_balance: balance } }
                }
            });
        }
    }

    if (bulkOps.length > 0) {
        await CustomLedgerEntry.bulkWrite(bulkOps);
    }

    return balance;
}

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { date, description, type, amount } = data;
        const { ledgerId, entryId } = await params;

        if (!date || !description || !type || amount === undefined) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        if (amount <= 0) {
            return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
        }

        await dbConnect();
        const company_id = new mongoose.Types.ObjectId(session.user.company_id);

        const entry = await CustomLedgerEntry.findOne({ _id: entryId, ledger_id: ledgerId, company_id });
        if (!entry) {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }

        Object.assign(entry, {
            date: new Date(date),
            description,
            type,
            amount: Number(amount)
        });

        await entry.save();

        await recalculateRunningBalances(ledgerId);

        return NextResponse.json({ success: true, data: entry });
    } catch (error) {
        console.error('Error updating custom ledger entry:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { ledgerId, entryId } = await params;
        const company_id = new mongoose.Types.ObjectId(session.user.company_id);

        const entry = await CustomLedgerEntry.findOneAndDelete({ _id: entryId, ledger_id: ledgerId, company_id });
        if (!entry) {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }

        await recalculateRunningBalances(ledgerId);

        return NextResponse.json({ success: true, message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting custom ledger entry:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
