import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';

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

        // Strip any client-sent company_id
        delete body.company_id;

        // Inject driver_id from session if not provided (safety)
        if (!body.driver_id) {
            body.driver_id = session.user.id;
        }

        // Create Trip with company_id from JWT
        const trip = await Trip.create({
            ...body,
            company_id: session.user.company_id,
        });

        return NextResponse.json({ success: true, data: trip }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
