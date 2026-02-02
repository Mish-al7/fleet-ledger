import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import AdminExpense from '@/models/AdminExpense';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const vehicleId = searchParams.get('vehicle_id');
        const frequency = searchParams.get('frequency');

        let query = {};
        if (vehicleId) query.vehicle_id = vehicleId;
        if (vehicleId === 'null') query.vehicle_id = null; // Clean filter for company-level
        if (frequency) query.frequency = frequency;

        const expenses = await AdminExpense.find(query)
            .sort({ createdAt: -1 })
            .populate('vehicle_id', 'vehicle_no')
            .lean();

        return NextResponse.json({ success: true, data: expenses });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await req.json();
        const { expense_type, description, amount, frequency, start_date, vehicle_id } = body;

        // Validation
        if (!expense_type || !description || !amount || !frequency || !start_date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Logic for One-time expenses
        let status = 'Active';
        let last_posted = null;

        if (frequency === 'One-time') {
            status = 'Completed'; // Immediate posting for One-time
            last_posted = new Date();
        }

        const expense = await AdminExpense.create({
            ...body,
            status,
            vehicle_id: vehicle_id || null, // Ensure explicit null if empty
            created_by: session.user.id,
            last_posted_date: last_posted
        });

        return NextResponse.json({ success: true, data: expense });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
