import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import AdminCashLedger from '@/models/AdminCashLedger';

// GET: Fetch all entries with optional date filtering
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);

        // Admin-only access
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build query with optional date filtering
        let query = {};
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                // Include the entire end date (set to end of day)
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                query.date.$lte = endDateTime;
            }
        }

        // Fetch entries sorted by date ascending (ledger style)
        const entries = await AdminCashLedger.find(query)
            .sort({ date: 1, createdAt: 1 })
            .populate('createdBy', 'name')
            .lean();

        // Get current balance (latest entry's running balance)
        const currentBalance = entries.length > 0
            ? entries[entries.length - 1].running_balance
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                entries,
                currentBalance
            }
        });

    } catch (error) {
        console.error('Admin Cash Ledger GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// POST: Create new entry with running balance calculation
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        // Admin-only access
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await req.json();
        const { date, description, type, amount } = body;

        // Validation
        if (!date || !description || !type || amount === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: date, description, type, amount' },
                { status: 400 }
            );
        }

        if (!['income', 'expense'].includes(type)) {
            return NextResponse.json(
                { error: 'Type must be either "income" or "expense"' },
                { status: 400 }
            );
        }

        if (amount < 0) {
            return NextResponse.json(
                { error: 'Amount must be positive' },
                { status: 400 }
            );
        }

        const newDate = new Date(date);

        // Find the entry immediately before the new one
        const previousEntry = await AdminCashLedger.findOne({
            $or: [
                { date: { $lt: newDate } },
                { date: newDate, createdAt: { $lt: new Date() } } // This helps but createdAt isn't set yet. relying on date is safer for "before"
            ]
        }).sort({ date: -1, createdAt: -1 });

        const previousBalance = previousEntry ? previousEntry.running_balance : 0;
        let runningBalance;

        if (type === 'income') {
            runningBalance = previousBalance + parseFloat(amount);
        } else {
            runningBalance = previousBalance - parseFloat(amount);
        }

        // Create new entry
        const newEntry = await AdminCashLedger.create({
            date: newDate,
            description,
            type,
            amount: parseFloat(amount),
            running_balance: runningBalance,
            createdBy: session.user.id
        });

        // Check if there are any entries AFTER this one (backdated insertion)
        const subsequentEntries = await AdminCashLedger.find({
            $or: [
                { date: { $gt: newDate } },
                { date: newDate, _id: { $ne: newEntry._id }, createdAt: { $gt: newEntry.createdAt } } // It's hard to rely on createdAt for same-millisecond comparison if any, but _id helps
            ]
        }).sort({ date: 1, createdAt: 1 });

        if (subsequentEntries.length > 0) {
            // We inserted a backdated entry, we must recalculate everything after it
            let currentBalance = runningBalance;
            let updatedCount = 0;

            for (const entry of subsequentEntries) {
                if (entry.type === 'income') {
                    currentBalance += entry.amount;
                } else {
                    currentBalance -= entry.amount;
                }

                // Only update if changed to avoid unnecessary writes, though for safety we can just write
                if (Math.abs(entry.running_balance - currentBalance) > 0.001) {
                    entry.running_balance = currentBalance;
                    await entry.save();
                    updatedCount++;
                }
            }

            // Return with a warning or info that recalculation happened? 
            // The frontend might want to know to refresh the list if they are looking at it.
            // But standard behavior is just success.
        }

        // Populate createdBy for response
        await newEntry.populate('createdBy', 'name');

        return NextResponse.json({
            success: true,
            data: newEntry,
            warning: subsequentEntries.length > 0 ? 'Backdated entry added. Subsequent balances have been recalculated.' : null
        }, { status: 201 });

    } catch (error) {
        console.error('Admin Cash Ledger POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
