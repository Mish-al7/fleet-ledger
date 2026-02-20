import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import TripSheet from '@/models/TripSheet';

// GET: List trip sheets
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const company_id = session.user.company_id;
        const tripSheets = await TripSheet.find({ company_id })
            .populate('created_by', 'name')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: tripSheets });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create trip sheet
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await req.json();
        const company_id = session.user.company_id;

        // Strip any client-sent company_id
        delete body.company_id;

        // Auto-generate trip_sheet_no (scoped to company)
        const count = await TripSheet.countDocuments({ company_id });
        const trip_sheet_no = `TS-${String(count + 1).padStart(4, '0')}`;

        const tripSheet = await TripSheet.create({
            ...body,
            trip_sheet_no,
            created_by: session.user.id,
            company_id,
        });

        return NextResponse.json({ success: true, data: tripSheet }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
