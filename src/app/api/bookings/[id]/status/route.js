import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';

// PATCH - Admin approve/reject booking
export async function PATCH(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can approve/reject
        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can approve or reject bookings' }, { status: 403 });
        }

        await dbConnect();

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        // Validate status
        if (!status || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status. Must be "approved" or "rejected"' }, { status: 400 });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Can only change status of pending bookings
        if (booking.status !== 'pending') {
            return NextResponse.json({
                error: `Cannot change status of ${booking.status} booking`
            }, { status: 400 });
        }

        // If approving, re-check availability to prevent race conditions
        if (status === 'approved') {
            const availability = await Booking.checkVehicleAvailability(
                booking.vehicle_id,
                booking.journey_start_date,
                booking.journey_return_date,
                booking.trip_start_time,
                booking.trip_end_time,
                booking._id // Exclude current booking from check
            );

            if (!availability.available) {
                return NextResponse.json({
                    error: 'Cannot approve: Vehicle is no longer available for selected date & time',
                    conflicts: availability.conflicts
                }, { status: 409 });
            }
        }

        // Update status
        booking.status = status;
        await booking.save();

        const updatedBooking = await Booking.findById(id)
            .populate('vehicle_id', 'vehicle_no')
            .populate('created_by', 'name email');

        return NextResponse.json({ success: true, data: updatedBooking });
    } catch (error) {
        console.error('PATCH /api/bookings/[id]/status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
