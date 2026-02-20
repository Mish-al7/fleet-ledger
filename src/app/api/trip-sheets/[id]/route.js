import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import TripSheet from '@/models/TripSheet';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const company_id = session.user.company_id;

        const tripSheet = await TripSheet.findOne({ _id: id, company_id });
        if (!tripSheet) {
            return NextResponse.json({ error: 'Trip Sheet not found' }, { status: 404 });
        }

        return NextResponse.json(tripSheet);
    } catch (error) {
        console.error('Error fetching trip sheet:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const data = await request.json();
        const company_id = session.user.company_id;

        // Prevent updating trip_sheet_no and company_id
        delete data.trip_sheet_no;
        delete data.company_id;

        const tripSheet = await TripSheet.findOneAndUpdate(
            { _id: id, company_id },
            data,
            { new: true, runValidators: true }
        );

        if (!tripSheet) {
            return NextResponse.json({ error: 'Trip Sheet not found' }, { status: 404 });
        }

        return NextResponse.json(tripSheet);
    } catch (error) {
        console.error('Error updating trip sheet:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const company_id = session.user.company_id;

        const tripSheet = await TripSheet.findOneAndDelete({ _id: id, company_id });

        if (!tripSheet) {
            return NextResponse.json({ error: 'Trip Sheet not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Trip Sheet deleted' });
    } catch (error) {
        console.error('Error deleting trip sheet:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
