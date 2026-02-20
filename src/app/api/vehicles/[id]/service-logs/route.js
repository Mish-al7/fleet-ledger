import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import VehicleServiceLog from '@/models/VehicleServiceLog';
import Vehicle from '@/models/Vehicle';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params; // vehicleId
        const company_id = session.user.company_id;

        // Verify vehicle belongs to company
        const vehicle = await Vehicle.findOne({ _id: id, company_id });
        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        const logs = await VehicleServiceLog.find({ vehicle_id: id, company_id }).sort({ service_date: -1 });

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching service logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params; // vehicleId
        const data = await request.json();
        const company_id = session.user.company_id;

        // Strip any client-sent company_id
        delete data.company_id;

        // Ensure vehicle exists and belongs to company
        const vehicle = await Vehicle.findOne({ _id: id, company_id });
        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        // Add vehicle details
        data.vehicle_id = id;
        data.vehicle_no = vehicle.vehicle_no;
        data.created_by = session.user.id;
        data.company_id = company_id;

        // Calculate total cost manually
        data.total_cost = (parseFloat(data.parts_cost) || 0) + (parseFloat(data.labour_cost) || 0);

        const log = await VehicleServiceLog.create(data);

        return NextResponse.json(log, { status: 201 });
    } catch (error) {
        console.error('Error creating service log:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
