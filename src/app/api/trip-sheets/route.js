import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import TripSheet from '@/models/TripSheet';
import { authOptions } from '@/lib/auth'; // Adjust path if needed, usually in lib/auth or app/api/auth/[...nextauth]/route.js
// If authOptions is not exported from lib/auth, I might need to find where it is.
// Checking previous file listing, there is lib/auth.js. I'll assume it's there.

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const vehicleReg = searchParams.get('vehicleReg');
        const guestName = searchParams.get('guestName');

        let query = {};

        if (startDate && endDate) {
            query.trip_sheet_date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (vehicleReg) {
            query.vehicle_reg_no = { $regex: vehicleReg, $options: 'i' };
        }

        if (guestName) {
            query.guest_name = { $regex: guestName, $options: 'i' };
        }

        const tripSheets = await TripSheet.find(query).sort({ createdAt: -1 });

        return NextResponse.json(tripSheets);
    } catch (error) {
        console.error('Error fetching trip sheets:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await request.json();

        // Auto-generate Trip Sheet No
        // Format: TS-1001
        const lastSheet = await TripSheet.findOne({}, { trip_sheet_no: 1 }).sort({ createdAt: -1 });
        let nextNo = 1001;
        if (lastSheet && lastSheet.trip_sheet_no) {
            const lastNum = parseInt(lastSheet.trip_sheet_no.split('-')[1]);
            if (!isNaN(lastNum)) {
                nextNo = lastNum + 1;
            }
        }
        data.trip_sheet_no = `TS-${nextNo}`;
        data.created_by = session.user.id; // Assuming session has user id

        const tripSheet = await TripSheet.create(data);

        return NextResponse.json(tripSheet, { status: 201 });
    } catch (error) {
        console.error('Error creating trip sheet:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
