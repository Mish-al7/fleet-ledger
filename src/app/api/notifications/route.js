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

        // Fetch notifications for the company where recipient is either null (all admins) or matches the user
        const query = {
            company_id,
            read: false,
            $or: [{ recipient: null }, { recipient: session.user.id }]
        };

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
