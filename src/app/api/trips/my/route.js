import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role, id } = session.user;
        if (role !== 'driver') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();

        // Fetch user's recent trips
        const trips = await Trip.find({ driver_id: id })
            .populate('vehicle_id', 'vehicle_no')
            .sort({ trip_date: -1, createdAt: -1 })
            .limit(5); // Get the 5 most recent trips

        return NextResponse.json({ success: true, data: trips });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
