import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import OpeningBalance from '@/models/OpeningBalance';
import Vehicle from '@/models/Vehicle';

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
        // Step 1: Check for exact year
        let obDoc = await OpeningBalance.findOne({ vehicle_id: vehicleId, year: selectedYear });

        // Step 2: Fallback to most recent previous year if not found
        if (!obDoc) {
            obDoc = await OpeningBalance.findOne({
                vehicle_id: vehicleId,
                year: { $lt: selectedYear }
            }).sort({ year: -1 });
        }

        // Step 3: Final fallback to legacy (no year field) if still not found
        if (!obDoc) {
            obDoc = await OpeningBalance.findOne({
                vehicle_id: vehicleId,
                year: { $exists: false }
            });
        }

        const startBalance = obDoc ? obDoc.opening_balance : 0;
        const obYear = (obDoc && obDoc.year) ? obDoc.year : (obDoc ? 'Legacy' : selectedYear);

        const vehicle = await Vehicle.findById(vehicleId).lean();

        // 2. Get ALL Trips (Running balance is global and continuous)
        const trips = await Trip.find({ vehicle_id: vehicleId })
            .sort({ trip_date: 1 }) // Chronological order for calculation
            .populate('driver_id', 'name')
            .lean();

        // 3. Compute Running Balance (Strictly from trips)
        let currentBalance = 0; // Disconnected from Opening Balance

        const ledger = trips.map(trip => {
            currentBalance = currentBalance + (trip.income || 0) - (trip.total_expenses || 0);

            return {
                ...trip,
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
