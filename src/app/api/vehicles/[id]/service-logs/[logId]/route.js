import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import VehicleServiceLog from '@/models/VehicleServiceLog';
import { authOptions } from '@/lib/auth';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { logId } = await params;
        const data = await request.json();
        const company_id = session.user.company_id;

        // Strip any client-sent company_id
        delete data.company_id;

        // Prevent changing vehicle_id or vehicle_no
        delete data.vehicle_id;
        delete data.vehicle_no;

        // Calculate total cost if parts or labour are provided
        if (data.parts_cost !== undefined || data.labour_cost !== undefined) {
            data.total_cost = (parseFloat(data.parts_cost) || 0) + (parseFloat(data.labour_cost) || 0);
        }

        // Verify ownership and update
        const log = await VehicleServiceLog.findOneAndUpdate(
            { _id: logId, company_id },
            data,
            { new: true, runValidators: true }
        );

        if (!log) {
            return NextResponse.json({ error: 'Service Log not found' }, { status: 404 });
        }

        return NextResponse.json(log);
    } catch (error) {
        console.error('Error updating service log:', error);
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
        const { logId } = await params;
        const company_id = session.user.company_id;

        const log = await VehicleServiceLog.findOneAndDelete({ _id: logId, company_id });

        if (!log) {
            return NextResponse.json({ error: 'Service Log not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Service Log deleted' });
    } catch (error) {
        console.error('Error deleting service log:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
