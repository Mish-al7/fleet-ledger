import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Trip from '@/models/Trip';
import TripSheet from '@/models/TripSheet';
import Booking from '@/models/Booking';
import bcrypt from 'bcryptjs';

// PATCH - Update User (Driver) details
export async function PATCH(req, props) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { id } = params;
        const body = await req.json();

        // Prevent changing role via this endpoint
        if (body.role) {
            delete body.role;
        }

        // Handle password update if provided
        if (body.password) {
            body.password = await bcrypt.hash(body.password, 10);
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        console.error('PATCH /api/users/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Delete User (Driver)
export async function DELETE(req, props) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = params;

        // Check for linked Trips for this driver
        const linkedTrips = await Trip.countDocuments({ driver_id: id });
        const linkedTripSheets = await TripSheet.countDocuments({ driver_id: id });

        // Ensure no created trips/bookings block standard admins if necessary, 
        // but primarily we care if they are assigned as a driver.
        const createdTrips = await Trip.countDocuments({ created_by: id });
        const createdBookings = await Booking.countDocuments({ created_by: id });

        if (linkedTrips > 0 || linkedTripSheets > 0 || createdTrips > 0 || createdBookings > 0) {
            return NextResponse.json({
                error: 'Cannot delete driver with linked records (Trips/Bookings). Please deactivate the driver instead.',
                needsDeactivation: true
            }, { status: 409 });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Driver deleted successfully' });
    } catch (error) {
        console.error('DELETE /api/users/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
