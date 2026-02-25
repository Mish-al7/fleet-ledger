import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import OpeningBalance from '@/models/OpeningBalance';
import Vehicle from '@/models/Vehicle';
import AdminExpense from '@/models/AdminExpense';

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        // Strict: Admin access only for ledger
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { vehicleId } = await params;
        const { searchParams } = new URL(req.url);
        const selectedYear = parseInt(searchParams.get('year')) || new Date().getFullYear();

        await dbConnect();

        // 1. Resolve Opening Balance (Read-Only Logic)
        // 1. Resolve Opening Balance (Read-Only Logic)
        // Step 1: Check for exact year ONLY (Strict Mode)
        const obDoc = await OpeningBalance.findOne({ vehicle_id: vehicleId, year: selectedYear });

        const startBalance = obDoc ? obDoc.opening_balance : 0;
        const obYear = selectedYear;

        const vehicle = await Vehicle.findById(vehicleId).lean();

        // 2. Get ALL Trips (Running balance is global and continuous)
        const trips = await Trip.find({ vehicle_id: vehicleId })
            .sort({ trip_date: 1, createdAt: 1 }) // Chronological order for calculation
            .populate('driver_id', 'name')
            .lean();

        // 2.1 Get Admin Expenses (One-time/Completed only)
        // We only show 'Completed' items to avoid showing the "Recurring Template"
        // OR items that are 'One-time' and 'Active' if they are effective immediately? 
        // Based on plan: Only 'Completed' items are posted.
        const adminExpenses = await AdminExpense.find({
            vehicle_id: vehicleId,
            status: 'Completed'
        }).lean();

        // 2.2 Merge and Sort
        const allEntries = [
            ...trips.map(t => ({ ...t, type: 'trip', date: t.trip_date })),
            ...adminExpenses.map(e => ({
                _id: e._id,
                trip_date: e.start_date, // Map to trip_date for consistency in frontend if needed, or use date
                date: e.start_date,
                description: `Admin Expense – ${e.expense_type} – ${e.description}`,
                expense_type: e.expense_type,
                income: 0,
                total_expenses: e.amount,
                type: 'admin_expense',
                is_admin_expense: true
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        // 3. Compute Running Balance (Strictly from trips)
        let currentBalance = 0; // Disconnected from Opening Balance

        const ledger = allEntries.map(entry => {
            currentBalance = currentBalance + (entry.income || 0) - (entry.total_expenses || 0);

            return {
                ...entry,
                running_balance: currentBalance
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                opening_balance: startBalance,
                opening_balance_year: obYear,
                selected_year: selectedYear,
                vehicle: vehicle,
                ledger: ledger // Contains ALL trips with continuous balance
            }
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
