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

        const oldDate = new Date(existingEntry.date);
        const newDate = new Date(date);
        const oldAmount = existingEntry.amount;
        const newAmount = parseFloat(amount);
        const oldType = existingEntry.type;
        const newType = type;

        // Update the entry
        existingEntry.date = newDate;
        existingEntry.description = description;
        existingEntry.type = newType;
        existingEntry.amount = newAmount;

        // We will save it after recalculation loop or right now?
        // If we save it now, we might mess up the "find previous" if we are not careful.
        // But we need it saved to be included in the "subsequent" query properly or we handle it manually.
        // Easier to save it, but we need to identify the "start point" for recalculation.

        // The recalculation must start from the EARLIER of the two dates (oldDate or newDate).
        // Anything before that is unaffected.

        let recalcStartDate = oldDate < newDate ? oldDate : newDate;

        await existingEntry.save();

        // Find the entry strictly BEFORE the recalcStartDate to establish initial balance
        // Note: multiple entries can have same date.
        // If we moved the entry, it's now at newDate.
        // If we moved it Forward (old < new), we need to fill the gap at oldDate.
        // If we moved it Backward (new < old), we need to inserting it at newDate pushes everything.

        // To be safe and robust:
        // 1. Find the first entry at or after recalcStartDate.
        // 2. Find the entry immediately BEFORE that one to get starting balance.
        // 3. Iterate through ALL entries from recalcStartDate onwards.

        const firstAffectedEntry = await AdminCashLedger.findOne({
            date: { $gte: recalcStartDate }
        }).sort({ date: 1, createdAt: 1 });

        if (firstAffectedEntry) {
            // Find balance before this one
            const previousEntry = await AdminCashLedger.findOne({
                $or: [
                    { date: { $lt: firstAffectedEntry.date } },
                    { date: firstAffectedEntry.date, createdAt: { $lt: firstAffectedEntry.createdAt } }
                ]
            }).sort({ date: -1, createdAt: -1 });

            let currentBalance = previousEntry ? previousEntry.running_balance : 0;

            // Fetch all entries from firstAffectedEntry onwards
            const entriesToRecalc = await AdminCashLedger.find({
                $or: [
                    { date: { $gt: firstAffectedEntry.date } },
                    { date: firstAffectedEntry.date, createdAt: { $gte: firstAffectedEntry.createdAt } } // Include the firstAffected itself
                ]
            }).sort({ date: 1, createdAt: 1 });

            for (const entry of entriesToRecalc) {
                if (entry.type === 'income') {
                    currentBalance += entry.amount;
                } else {
                    currentBalance -= entry.amount;
                }

                // Update if needed
                if (Math.abs(entry.running_balance - currentBalance) > 0.001) {
                    entry.running_balance = currentBalance;
                    // Mongoose might track this change
                    await entry.save();
                }
            }
        }

        // Re-fetch to return latest state
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
