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

        const companyId = session.user.company_id;
        // build base query - only add company_id if it exists in session
        // this allows support for current single-tenant mode while being ready for multi-tenancy
        const baseQuery = companyId ? { company_id: companyId } : {};

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get('date');

        // Parse date (default to today if missing)
        let targetDate = new Date();
        if (dateParam) {
            targetDate = new Date(dateParam);
            // Verify date is valid
            if (isNaN(targetDate.getTime())) {
                return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
            }
        }

        // Create start and end of the day in local timezone context or standard UTC depending on how you store 
        // We will query starting 00:00:00 and ending 23:59:59
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Date Query object
        const dateQuery = {
            $gte: startOfDay,
            $lte: endOfDay
        };

        // 1. Trips matching company_id and trip_date
        const tripsToday = await Trip.find({
            ...baseQuery,
            trip_date: dateQuery
        })
            .populate('vehicle_id', 'vehicle_no nickname')
            .populate('driver_id', 'name')
            .sort({ createdAt: -1 })
            .lean();
        const totalTripIncome = tripsToday.reduce((acc, trip) => acc + (trip.income || 0), 0);
        const totalTripExpense = tripsToday.reduce((acc, trip) => acc + (trip.total_expenses || 0), 0);

        const totalAdminExpensesPosted = 0; // AdminExpense model removed from main branch

        // 3. Bookings created today
        const bookingsCreatedToday = await Booking.find({
            ...baseQuery,
            createdAt: dateQuery
        })
            .sort({ createdAt: -1 })
            .lean();

        // 4. Net Movement Calculation
        const netMovementForTheDay = totalTripIncome - totalTripExpense - totalAdminExpensesPosted;

        // 5. Enhance Trips with Profit and Calculate Running Balances
        // Group trips by vehicle to calculate running balance efficiently
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

        // For each vehicle, calculate the balance path
        for (const [vId, vehicleTrips] of Object.entries(tripsByVehicle)) {
            if (vId === 'unknown') {
                enhancedTrips.push(...vehicleTrips);
                continue;
            }

            // 1. Get history balance (all trips and vehicle admin expenses before today)
            const prevTrips = await Trip.find({
                ...baseQuery,
                vehicle_id: vId,
                trip_date: { $lt: startOfDay }
            }).select('income total_expenses');

            const historyAdminExpense = 0; // AdminExpense removed

            let runningBal = historyIncome - historyExpense - historyAdminExpense;

            // 2. Sort today's trips chronologically to apply running balance
            // (The API returned them descending by default, we sort 1 for calculation)
            const sortedToday = [...vehicleTrips].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            const withBalance = sortedToday.map(t => {
                runningBal += (t.profit || 0);
                return { ...t, running_balance: runningBal };
            });

            enhancedTrips.push(...withBalance);
        }

        // Sort back to descending for the list
        const finalTrips = enhancedTrips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalTripIncome,
                    totalTripExpense,
                    totalAdminExpensesPosted,
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
