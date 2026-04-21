import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const company_id = session.user.company_id;

        // Requirement: Notify driver when booking date (end date) comes
        if (session.user.role === 'driver') {
            const Booking = (await import('@/models/Booking')).default;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Find approved bookings for this driver that have reached their return date
            const dueBookings = await Booking.find({
                company_id,
                driver_id: session.user.id,
                status: 'approved',
                journey_return_date: { $lte: new Date() }
            }).lean();

            for (const booking of dueBookings) {
                // Check if a 'booking_due' notification already exists for this booking
                const existingNotif = await Notification.findOne({
                    company_id,
                    recipient: session.user.id,
                    related_id: booking._id,
                    type: 'booking_due'
                });

                if (!existingNotif) {
                    await Notification.create({
                        company_id,
                        recipient: session.user.id,
                        title: 'Trip Entry Due',
                        message: `The trip ${booking.booking_no} to ${booking.trip_destination} has ended. Please enter the final trip details.`,
                        type: 'booking_due',
                        related_id: booking._id
                    });
                }
            }
        }

        // Build query based on role
        const query = {
            company_id,
            read: false,
        };

        if (session.user.role === 'admin') {
            // Admins see general notifications (null recipient) and those specifically for them
            query.$or = [{ recipient: null }, { recipient: session.user.id }];
        } else {
            // Drivers and other roles only see notifications explicitly addressed to them
            query.recipient = session.user.id;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50) // Keep it reasonable
            .lean();

        return NextResponse.json({ success: true, data: notifications });
    } catch (error) {
        console.error('GET /api/notifications error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        
        const body = await req.json();
        const { notificationIds } = body; // Array of IDs to mark as read

        if (!notificationIds || !Array.isArray(notificationIds)) {
             return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        await Notification.updateMany(
            { _id: { $in: notificationIds }, company_id: session.user.company_id },
            { $set: { read: true } }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PATCH /api/notifications error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
