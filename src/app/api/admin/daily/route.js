import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import Booking from '@/models/Booking';
import Vehicle from '@/models/Vehicle';
import User from '@/models/User';

// GET: Fetch summary and lists for the daily admin dashboard
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get('date');

        let targetDate = new Date();
        if (dateParam) {
            targetDate = new Date(dateParam);
            if (isNaN(targetDate.getTime())) {
                return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
            }
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const dateQuery = {
            $gte: startOfDay,
            $lte: endOfDay
        };

        // 1. Trips today
        const tripsToday = await Trip.find({
            trip_date: dateQuery
        })
            .populate('vehicle_id', 'vehicle_no nickname')
            .populate('driver_id', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const totalTripIncome = tripsToday.reduce((acc, trip) => acc + (trip.income || 0), 0);
        const totalTripExpense = tripsToday.reduce((acc, trip) => acc + (trip.total_expenses || 0), 0);

        // 2. Bookings created today
        const bookingsCreatedToday = await Booking.find({
            createdAt: dateQuery
        })
            .sort({ createdAt: -1 })
            .lean();

        // 3. Net Movement Calculation (Trip only as requested)
        const netMovementForTheDay = totalTripIncome - totalTripExpense;

        // 4. Group trips by vehicle for running balance calculation
        const tripsByVehicle = {};
        tripsToday.forEach(trip => {
            const vId = trip.vehicle_id?._id?.toString() || 'unknown';
            if (!tripsByVehicle[vId]) tripsByVehicle[vId] = [];
            tripsByVehicle[vId].push({
                ...trip,
                profit: (trip.income || 0) - (trip.total_expenses || 0)
            });
        });

        const enhancedTrips = [];

        for (const [vId, vehicleTrips] of Object.entries(tripsByVehicle)) {
            if (vId === 'unknown') {
                enhancedTrips.push(...vehicleTrips);
                continue;
            }

            // Get historical totals for this vehicle BEFORE today
            const prevTrips = await Trip.find({
                vehicle_id: vId,
                trip_date: { $lt: startOfDay }
            }).select('income total_expenses');

            const historyIncome = prevTrips.reduce((acc, t) => acc + (t.income || 0), 0);
            const historyExpense = prevTrips.reduce((acc, t) => acc + (t.total_expenses || 0), 0);
            
            let runningBal = historyIncome - historyExpense;

            // Sort today's trips for this vehicle chronologically
            const sortedToday = [...vehicleTrips].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            const withBalance = sortedToday.map(t => {
                runningBal += (t.profit || 0);
                return { ...t, running_balance: runningBal };
            });

            enhancedTrips.push(...withBalance);
        }

        const finalTrips = enhancedTrips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalTripIncome,
                    totalTripExpense,
                    totalAdminExpensesPosted: 0,
                    netMovementForTheDay
                },
                lists: {
                    tripsToday: finalTrips,
                    adminExpensesPostedToday: [],
                    bookingsCreatedToday,
                    vehicleLedgerEntriesToday: finalTrips
                },
                selectedDate: startOfDay.toISOString().split('T')[0]
            }
        });

    } catch (error) {
        console.error('Admin Daily Dashboard GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
