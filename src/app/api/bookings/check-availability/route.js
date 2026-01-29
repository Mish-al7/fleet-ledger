import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';

// POST - Check vehicle availability for given date/time range
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await req.json();
        const { vehicle_id, journey_start_date, journey_return_date, trip_start_time, trip_end_time, exclude_booking_id } = body;

        // Validate required fields
        if (!vehicle_id || !journey_start_date || !journey_return_date || !trip_start_time || !trip_end_time) {
            return NextResponse.json({
                error: 'vehicle_id, journey_start_date, journey_return_date, trip_start_time, and trip_end_time are required'
            }, { status: 400 });
        }

        const availability = await Booking.checkVehicleAvailability(
            vehicle_id,
            journey_start_date,
            journey_return_date,
            trip_start_time,
            trip_end_time,
            exclude_booking_id || null
        );

        return NextResponse.json({
            success: true,
            available: availability.available,
            conflicts: availability.conflicts
        });
    } catch (error) {
        console.error('POST /api/bookings/check-availability error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
