import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Vehicle from '@/models/Vehicle';

// GET - List bookings (driver: own only, admin: all)
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const vehicleId = searchParams.get('vehicle_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        // Build query
        const query = {};

        // Drivers can only see their own bookings
        if (session.user.role === 'driver') {
            query.created_by = session.user.id;
        }

        // Apply filters
        if (status && status !== 'all') {
            query.status = status;
        }
        if (vehicleId) {
            query.vehicle_id = vehicleId;
        }
        if (startDate && endDate) {
            query.journey_start_date = { $gte: new Date(startDate) };
            query.journey_return_date = { $lte: new Date(endDate) };
        }

        const bookings = await Booking.find(query)
            .populate('vehicle_id', 'vehicle_no')
            .populate('created_by', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: bookings });
    } catch (error) {
        console.error('GET /api/bookings error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create new booking
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role } = session.user;
        if (role !== 'admin' && role !== 'driver') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();

        const body = await req.json();

        // Validate required fields
        const requiredFields = ['customer_name', 'customer_phone', 'pickup_location', 'trip_destination',
            'journey_start_date', 'journey_return_date', 'trip_start_time', 'trip_end_time', 'vehicle_id'];

        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json({ error: `${field.replace(/_/g, ' ')} is required` }, { status: 400 });
            }
        }

        // Get vehicle details
        const vehicle = await Vehicle.findById(body.vehicle_id);
        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        // Check vehicle availability (overlap detection)
        const availability = await Booking.checkVehicleAvailability(
            body.vehicle_id,
            body.journey_start_date,
            body.journey_return_date,
            body.trip_start_time,
            body.trip_end_time
        );

        if (!availability.available) {
            return NextResponse.json({
                error: 'Vehicle already booked for selected date & time',
                conflicts: availability.conflicts
            }, { status: 409 });
        }

        // Generate booking number
        const booking_no = await Booking.generateBookingNo();

        // Create booking
        const booking = await Booking.create({
            ...body,
            booking_no,
            booking_date: new Date(),
            created_by: session.user.id,
            vehicle_no: vehicle.vehicle_no,
            status: 'pending',
        });

        // Populate response
        const populatedBooking = await Booking.findById(booking._id)
            .populate('vehicle_id', 'vehicle_no')
            .populate('created_by', 'name email');

        return NextResponse.json({ success: true, data: populatedBooking }, { status: 201 });
    } catch (error) {
        console.error('POST /api/bookings error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
