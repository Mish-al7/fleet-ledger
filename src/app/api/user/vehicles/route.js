import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Vehicle from '@/models/Vehicle';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Return all active vehicles (drivers can select any vehicle)
        const vehicles = await Vehicle.find({ status: 'active' }).select('vehicle_no _id').sort({ vehicle_no: 1 });

        return NextResponse.json({ success: true, data: vehicles });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
