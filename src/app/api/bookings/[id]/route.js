import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';

// GET - Get single booking details
export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;

        const query = { _id: id };
        const companyId = session.user.companyId || session.user.company_id;
        if (companyId) {
            query.company_id = companyId;
        }

        const booking = await Booking.findOne(query)
            .populate('vehicle_id', 'vehicle_no')
            .populate('created_by', 'name email')
            .lean();

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Drivers view rules
        if (session.user.role === 'driver' && booking.created_by._id.toString() !== session.user.id) {
            // It's not their booking, return the sanitized overview version instead of 403
            const sanitizedBooking = {
                _id: booking._id,
                booking_no: booking.booking_no,
                booking_date: booking.booking_date,
                journey_start_date: booking.journey_start_date,
                journey_return_date: booking.journey_return_date,
                trip_start_time: booking.trip_start_time,
                trip_end_time: booking.trip_end_time,
                vehicle_id: booking.vehicle_id,
                vehicle_no: booking.vehicle_no,
                status: booking.status,
                created_by: booking.created_by,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt
            };
            return NextResponse.json({ success: true, data: sanitizedBooking });
        }

        return NextResponse.json({ success: true, data: booking });
    } catch (error) {
        console.error('GET /api/bookings/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH - Update booking
export async function PATCH(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;
        const body = await req.json();

        const query = { _id: id };
        const companyId = session.user.companyId || session.user.company_id;
        if (companyId) {
            query.company_id = companyId;
        }

        // Check if booking exists
        const existingBooking = await Booking.findOne(query);
        if (!existingBooking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Only admin or creator (if pending) can update
        const canUpdate = session.user.role === 'admin' ||
            (session.user.role === 'driver' && existingBooking.created_by.toString() === session.user.id && existingBooking.status === 'pending');

        if (!canUpdate) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // If dates or vehicle changed, check availability
        if (body.vehicle_id || body.journey_start_date || body.journey_return_date || body.trip_start_time || body.trip_end_time) {
            // Use existing values if not provided in body
            const vehicleId = body.vehicle_id || existingBooking.vehicle_id;
            const startDate = body.journey_start_date || existingBooking.journey_start_date;
            const endDate = body.journey_return_date || existingBooking.journey_return_date;
            const startTime = body.trip_start_time || existingBooking.trip_start_time;
            const endTime = body.trip_end_time || existingBooking.trip_end_time;

            const availability = await Booking.checkVehicleAvailability(
                vehicleId,
                startDate,
                endDate,
                startTime,
                endTime,
                id // Exclude current booking
            );

            if (!availability.available) {
                return NextResponse.json({
                    error: 'Vehicle not available for selected changes',
                    conflicts: availability.conflicts
                }, { status: 409 });
            }
        }

        // Update booking
        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            { ...body },
            { new: true, runValidators: true }
        ).populate('vehicle_id', 'vehicle_no').populate('created_by', 'name email');

        return NextResponse.json({ success: true, data: updatedBooking });

    } catch (error) {
        console.error('PATCH /api/bookings/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Delete booking
export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;

        const query = { _id: id };
        const companyId = session.user.companyId || session.user.company_id;
        if (companyId) {
            query.company_id = companyId;
        }

        const booking = await Booking.findOne(query);
        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Only admin or creator (if pending) can delete
        const canDelete = session.user.role === 'admin' ||
            (session.user.role === 'driver' && booking.created_by.toString() === session.user.id && booking.status === 'pending');

        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Booking.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('DELETE /api/bookings/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
