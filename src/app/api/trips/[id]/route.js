import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';

// GET single trip
export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const company_id = session.user.company_id;
        await dbConnect();

        const trip = await Trip.findOne({ _id: id, company_id }).populate('vehicle_id driver_id');
        if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

        return NextResponse.json({ success: true, data: trip });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// PUT / UPDATE Trip
export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Ensure only admin can edit
        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const company_id = session.user.company_id;

        // Strip any client-sent company_id
        delete body.company_id;

        await dbConnect();

        const trip = await Trip.findOne({ _id: id, company_id });
        if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

        // Update fields
        Object.keys(body).forEach(key => {
            if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'company_id') {
                trip[key] = body[key];
            }
        });

        // Save to trigger pre-save hooks (calculations)
        await trip.save();

        return NextResponse.json({ success: true, data: trip });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// DELETE Trip
export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Ensure only admin can delete
        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const company_id = session.user.company_id;
        await dbConnect();

        const deletedTrip = await Trip.findOneAndDelete({ _id: id, company_id });

        if (!deletedTrip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: deletedTrip });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
