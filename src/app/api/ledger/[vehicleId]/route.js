import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import AdminExpense from '@/models/AdminExpense';
import OpeningBalance from '@/models/OpeningBalance';
import Vehicle from '@/models/Vehicle';

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { vehicleId } = await params;
        const company_id = session.user.company_id;
        const { searchParams } = new URL(req.url);
        const year = searchParams.get('year') || new Date().getFullYear();

        // Verify vehicle belongs to company
        const vehicle = await Vehicle.findOne({ _id: vehicleId, company_id });
        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        // Fetch opening balance (scoped to company)
        const openingBalanceDoc = await OpeningBalance.findOne({
            vehicle_id: vehicleId,
            year: parseInt(year),
            company_id
        });
        const openingBalance = openingBalanceDoc?.opening_balance || 0;

        // Fetch trips (scoped to company)
        const trips = await Trip.find({
            vehicle_id: vehicleId,
            company_id,
            month: { $regex: `^${year}` }
        }).populate('driver_id', 'name').sort({ trip_date: 1, createdAt: 1 }).lean();

        // Fetch admin expenses (scoped to company)
        const startOfYear = new Date(`${year}-01-01`);
        const endOfYear = new Date(`${parseInt(year) + 1}-01-01`);

        const expenses = await AdminExpense.find({
            company_id,
            $or: [
                { vehicle_id: vehicleId },
                { vehicle_id: null }
            ],
            start_date: { $gte: startOfYear, $lt: endOfYear },
            status: 'Completed'
        }).sort({ start_date: 1 }).lean();

        // Build ledger entries matching the frontend's expected format
        const ledger = [];

        for (const trip of trips) {
            ledger.push({
                _id: trip._id,
                trip_date: trip.trip_date,
                month: trip.month,
                trip_route: trip.trip_route,
                driver_id: trip.driver_id,
                actual_driver_name: trip.actual_driver_name,
                income: trip.income || 0,
                total_expenses: trip.total_expenses || 0,
                // Expense breakdown
                fuel: trip.fuel || 0,
                fasttag: trip.fasttag || 0,
                driver_allowance: trip.driver_allowance || 0,
                service: trip.service || 0,
                adblue: trip.adblue || 0,
                grease: trip.grease || 0,
                air: trip.air || 0,
                deposit_to_kdr_bank: trip.deposit_to_kdr_bank || 0,
                other_expense: trip.other_expense || 0,
                notes: trip.notes,
                is_admin_expense: false,
                running_balance: 0, // calculated below
            });
        }

        for (const expense of expenses) {
            ledger.push({
                _id: expense._id,
                trip_date: expense.start_date,
                month: (() => {
                    const d = new Date(expense.start_date);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                })(),
                trip_route: `Admin Exp: ${expense.expense_type}`,
                actual_driver_name: 'Admin',
                notes: expense.description,
                income: 0,
                total_expenses: expense.amount || 0,
                is_admin_expense: true,
                is_company_level: !expense.vehicle_id,
                running_balance: 0,
            });
        }

        // Sort by date
        ledger.sort((a, b) => new Date(a.trip_date) - new Date(b.trip_date));

        // Calculate running balance
        let balance = openingBalance;
        for (const entry of ledger) {
            balance += (entry.income - entry.total_expenses);
            entry.running_balance = balance;
        }

        return NextResponse.json({
            success: true,
            data: {
                vehicle,
                opening_balance: openingBalance,
                selected_year: parseInt(year),
                ledger,
                closingBalance: balance,
            }
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
