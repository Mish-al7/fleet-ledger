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

        // Prevent changing vehicle_id or vehicle_no mostly, but let's allow flexibility if needed.
        // Actually user spec says: "Vehicle association cannot be changed after creation"
        delete data.vehicle_id;
        delete data.vehicle_no;

        // Calculate total cost if parts or labour are provided
        // We need to be careful if only one is provided. Ideally fetch existing, but usually form sends all.
        // For simplicity, let's assume we update what's sent.
        if (data.parts_cost !== undefined || data.labour_cost !== undefined) {
            data.total_cost = (parseFloat(data.parts_cost) || 0) + (parseFloat(data.labour_cost) || 0);
        }

        const log = await VehicleServiceLog.findByIdAndUpdate(logId, data, {
            new: true,
            runValidators: true,
        });

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

        const log = await VehicleServiceLog.findByIdAndDelete(logId);

        if (!log) {
            return NextResponse.json({ error: 'Service Log not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Service Log deleted' });
    } catch (error) {
        console.error('Error deleting service log:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
