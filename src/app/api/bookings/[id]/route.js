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

        const booking = await Booking.findById(id)
            .populate('vehicle_id', 'vehicle_no')
            .populate('created_by', 'name email')
            .lean();

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Drivers can only view their own bookings
        if (session.user.role === 'driver' && booking.created_by._id.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ success: true, data: booking });
    } catch (error) {
        console.error('GET /api/bookings/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
