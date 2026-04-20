import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Admin sees all notifications. We grab the 50 most recent.
        const notifications = await Notification.find({})
            .sort({ createdAt: -1 })
            .limit(50)
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
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        
        const body = await req.json();
        const { notificationIds } = body;
        
        if (!notificationIds || !Array.isArray(notificationIds)) {
            return NextResponse.json({ error: 'Invalid notification IDs' }, { status: 400 });
        }

        // Mark specified notifications as read
        await Notification.updateMany(
            { _id: { $in: notificationIds } },
            { $set: { read: true } }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PATCH /api/notifications error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
