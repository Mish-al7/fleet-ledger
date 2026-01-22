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
        await dbConnect();

        // 1. Get Opening Balance & Vehicle Details
        const obDoc = await OpeningBalance.findOne({ vehicle_id: vehicleId });
        const startBalance = obDoc ? obDoc.opening_balance : 0;

        const vehicle = await Vehicle.findById(vehicleId).lean();

        // 2. Get Trips
        const trips = await Trip.find({ vehicle_id: vehicleId })
            .sort({ trip_date: 1 }) // Chronological order
            .populate('driver_id', 'name')
            .lean(); // Faster, plain JS objects

        // 3. Compute Running Balance
        let currentBalance = startBalance;

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
                vehicle: vehicle,
                ledger: ledger
            }
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
