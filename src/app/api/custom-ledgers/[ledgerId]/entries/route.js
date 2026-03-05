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

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { ledgerId } = await params;
        const company_id = new mongoose.Types.ObjectId(session.user.company_id);

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Check if ledger belongs to company
        const ledger = await CustomLedger.findOne({ _id: ledgerId, company_id });
        if (!ledger) {
            return NextResponse.json({ error: 'Ledger not found or unauthorized' }, { status: 404 });
        }

        // Build query
        const query = { ledger_id: ledgerId, company_id };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate + 'T23:59:59.999Z')
            };
        }

        const entries = await CustomLedgerEntry.find(query)
            .sort({ date: -1, createdAt: -1 })
            .lean();

        // Calculate latest balance across ALL time for this ledger to show at top
        const latestEntry = await CustomLedgerEntry.findOne({ ledger_id: ledgerId, company_id })
            .sort({ date: -1, createdAt: -1 })
            .lean();

        const currentBalance = latestEntry ? latestEntry.running_balance : 0;

        return NextResponse.json({
            success: true,
            data: {
                entries,
                currentBalance,
                ledger
            }
        });
    } catch (error) {
        console.error('Error fetching custom ledger entries:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { date, description, type, amount } = data;

        if (!date || !description || !type || amount === undefined) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        if (amount <= 0) {
            return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
        }

        if (!['income', 'expense'].includes(type)) {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        await dbConnect();
        const { ledgerId } = await params;
        const company_id = new mongoose.Types.ObjectId(session.user.company_id);

        const ledger = await CustomLedger.findOne({ _id: ledgerId, company_id });
        if (!ledger) {
            return NextResponse.json({ error: 'Ledger not found or unauthorized' }, { status: 404 });
        }

        const newEntry = new CustomLedgerEntry({
            ledger_id: ledgerId,
            date: new Date(date),
            description,
            type,
            amount: Number(amount),
            company_id,
            created_by: new mongoose.Types.ObjectId(session.user.id),
        });

        await newEntry.save();

        // Always recalculate running balances for this specific ledger
        const currentBalance = await recalculateRunningBalances(ledgerId);

        return NextResponse.json({
            success: true,
            data: newEntry,
            currentBalance
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating custom ledger entry:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
