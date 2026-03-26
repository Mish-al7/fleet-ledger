import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Vehicle from '@/models/Vehicle';
import User from '@/models/User';

// GET: Fetch vehicles available to the user (within their company)
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const company_id = session.user.company_id;

        // Return vehicles within this company
        const vehicles = await Vehicle.find({ company_id, status: 'active' })
            .select('vehicle_no status nickname')
            .sort({ vehicle_no: 1 })
            .lean();

        return NextResponse.json({ success: true, data: vehicles });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
