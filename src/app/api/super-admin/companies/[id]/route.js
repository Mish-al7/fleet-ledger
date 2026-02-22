import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Company from '@/models/Company';
import User from '@/models/User';
import Vehicle from '@/models/Vehicle';
import Trip from '@/models/Trip';

// GET: Company detail with usage metrics
export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;

        const company = await Company.findById(id).lean();
        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Get usage metrics
        const [userCount, vehicleCount, tripCount, driverCount] = await Promise.all([
            User.countDocuments({ company_id: id }),
            Vehicle.countDocuments({ company_id: id }),
            Trip.countDocuments({ company_id: id }),
            User.countDocuments({ company_id: id, role: 'driver' }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                ...company,
                metrics: { userCount, vehicleCount, tripCount, driverCount },
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update company plan or status
export async function PATCH(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Only allow updating plan and status
        const updates = {};
        if (body.plan) updates.plan = body.plan;
        if (body.status) updates.status = body.status;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const company = await Company.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: company });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
