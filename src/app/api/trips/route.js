import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import Booking from '@/models/Booking';

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

        // Clean up bookingId if empty string
        if (body.bookingId === "") {
            body.bookingId = null;
        }

        // Check for duplicate booking
        if (body.bookingId) {
            const existingTrip = await Trip.findOne({ 
                bookingId: body.bookingId, 
                company_id: session.user.company_id 
            });
            if (existingTrip) {
                return NextResponse.json({ error: 'A trip has already been created for this booking.' }, { status: 400 });
            }

            // Check if return date reached (drivers can only finalize after the trip ends)
            const booking = await Booking.findById(body.bookingId);
            if (booking && role === 'driver') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const returnDate = new Date(booking.journey_return_date);
                returnDate.setHours(0, 0, 0, 0);

                if (today < returnDate) {
                    return NextResponse.json({ 
                        error: `Trip entry is only available from the end date (${returnDate.toLocaleDateString()}) onwards.` 
                    }, { status: 400 });
                }
            }
        }

        // Create Trip with company_id from JWT
        const trip = await Trip.create({
            ...body,
            company_id: session.user.company_id,
        });

        // Update booking status if bookingId exists
        if (body.bookingId) {
            await Booking.findByIdAndUpdate(
                body.bookingId,
                { status: 'completed' }
            );
        }

        return NextResponse.json({ success: true, data: trip }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
