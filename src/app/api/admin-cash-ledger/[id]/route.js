import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import AdminCashLedger from '@/models/AdminCashLedger';

// DELETE: Remove a specific entry
export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);

        // Admin-only access
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;

        // Find the entry before deleting to get its date/time for recalculation
        const entryToDelete = await AdminCashLedger.findById(id);

        if (!entryToDelete) {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }

        const deletedDate = entryToDelete.date;
        const deletedCreatedAt = entryToDelete.createdAt;

        // Delete the entry
        await AdminCashLedger.findByIdAndDelete(id);

        // Recalculate all subsequent entries
        const subsequentEntries = await AdminCashLedger.find({
            $or: [
                { date: { $gt: deletedDate } },
                { date: deletedDate, createdAt: { $gt: deletedCreatedAt } }
            ]
        }).sort({ date: 1, createdAt: 1 });

        // Get the balance from the entry before the deleted one
        const previousEntry = await AdminCashLedger.findOne({
            $or: [
                { date: { $lt: deletedDate } },
                { date: deletedDate, createdAt: { $lt: deletedCreatedAt } }
            ]
        }).sort({ date: -1, createdAt: -1 });

        let currentBalance = previousEntry ? previousEntry.running_balance : 0;

        // Recalculate balances for all subsequent entries
        for (const entry of subsequentEntries) {
            if (entry.type === 'income') {
                currentBalance = currentBalance + entry.amount;
            } else {
                currentBalance = currentBalance - entry.amount;
            }
            entry.running_balance = currentBalance;
            await entry.save();
        }

        return NextResponse.json({
            success: true,
            message: 'Entry deleted and all balances recalculated successfully'
        });

    } catch (error) {
        console.error('Admin Cash Ledger DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// PUT: Update a specific entry
export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);

        // Admin-only access
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;
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

        // Find the entry to update
        const existingEntry = await AdminCashLedger.findById(id);

        if (!existingEntry) {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }

        // Update the entry
        existingEntry.date = new Date(date);
        existingEntry.description = description;
        existingEntry.type = type;
        existingEntry.amount = parseFloat(amount);

        // Recalculate running balance for this entry
        const previousEntry = await AdminCashLedger.findOne({
            $or: [
                { date: { $lt: existingEntry.date } },
                { date: existingEntry.date, createdAt: { $lt: existingEntry.createdAt } }
            ]
        }).sort({ date: -1, createdAt: -1 });

        const previousBalance = previousEntry ? previousEntry.running_balance : 0;

        if (existingEntry.type === 'income') {
            existingEntry.running_balance = previousBalance + existingEntry.amount;
        } else {
            existingEntry.running_balance = previousBalance - existingEntry.amount;
        }

        await existingEntry.save();

        // Recalculate all subsequent entries
        const subsequentEntries = await AdminCashLedger.find({
            $or: [
                { date: { $gt: existingEntry.date } },
                { date: existingEntry.date, createdAt: { $gt: existingEntry.createdAt } }
            ]
        }).sort({ date: 1, createdAt: 1 });

        let currentBalance = existingEntry.running_balance;

        for (const entry of subsequentEntries) {
            if (entry.type === 'income') {
                currentBalance = currentBalance + entry.amount;
            } else {
                currentBalance = currentBalance - entry.amount;
            }
            entry.running_balance = currentBalance;
            await entry.save();
        }

        await existingEntry.populate('createdBy', 'name');

        return NextResponse.json({
            success: true,
            data: existingEntry,
            message: 'Entry updated and all balances recalculated successfully'
        });

    } catch (error) {
        console.error('Admin Cash Ledger PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
