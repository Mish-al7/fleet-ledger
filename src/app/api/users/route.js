import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// GET: List all users in this company
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const company_id = session.user.company_id;

        const users = await User.find({ company_id })
            .select('-password')
            .populate('assignedVehicles', 'vehicle_no')
            .lean();

        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create user within this company
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();
        const company_id = session.user.company_id;

        // Strip any client-sent company_id
        delete body.company_id;

        const { name, email, password, role, assignedVehicles } = body;

        // Validate
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
        }

        // Check duplicate email within company
        const existing = await User.findOne({ email, company_id });
        if (existing) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'driver',
            assignedVehicles: assignedVehicles || [],
            company_id,
        });

        // Return user without password
        const userObj = user.toObject();
        delete userObj.password;

        return NextResponse.json({ success: true, data: userObj }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
