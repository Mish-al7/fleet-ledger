import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import Vehicle from '@/models/Vehicle';
import Trip from '@/models/Trip';
import VehicleServiceLog from '@/models/VehicleServiceLog';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        return NextResponse.json(vehicle);
    } catch (error) {
        console.error('Error fetching vehicle:', error);
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

        // Check if vehicle_no exists (if changing)
        if (data.vehicle_no) {
            const existing = await Vehicle.findOne({
                vehicle_no: data.vehicle_no,
                _id: { $ne: id }
            });
            if (existing) {
                return NextResponse.json({ error: 'Vehicle number already exists' }, { status: 400 });
            }
        }

        const vehicle = await Vehicle.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });

        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        return NextResponse.json(vehicle);
    } catch (error) {
        console.error('Error updating vehicle:', error);
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

        // Check for dependencies
        const tripCount = await Trip.countDocuments({ vehicle_id: id });
        if (tripCount > 0) {
            return NextResponse.json({
                error: `Cannot delete vehicle. It has ${tripCount} associated existing trips.`
            }, { status: 400 });
        }

        const serviceLogCount = await VehicleServiceLog.countDocuments({ vehicle_id: id });
        if (serviceLogCount > 0) {
            return NextResponse.json({
                error: `Cannot delete vehicle. It has ${serviceLogCount} service logs.`
            }, { status: 400 });
        }

        const vehicle = await Vehicle.findByIdAndDelete(id);

        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
