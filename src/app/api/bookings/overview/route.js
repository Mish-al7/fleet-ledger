import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'driver') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const sortField = searchParams.get('sortField') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

        const companyId = session.user.companyId || session.user.company_id;

        // Build query for company-wide bookings
        const query = {};
        if (companyId) {
            query.company_id = companyId;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        // Only select non-sensitive fields
        const bookings = await Booking.find(query)
            .select('booking_no booking_date journey_start_date journey_return_date trip_start_time trip_end_time vehicle_id vehicle_no status created_by createdAt updatedAt')
            .populate('vehicle_id', 'vehicle_no')
            .populate('created_by', 'name email role')
            .sort({ [sortField]: sortOrder })
            .lean();

        return NextResponse.json({ success: true, data: bookings });
    } catch (error) {
        console.error('GET /api/bookings/overview error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
