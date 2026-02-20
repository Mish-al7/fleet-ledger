import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Company from '@/models/Company';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// GET: List all companies
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();

        const companies = await Company.find()
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: companies });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new company + its admin user
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();
        const body = await req.json();

        const { name, email, plan, adminName, adminEmail, adminPassword } = body;

        if (!name || !email) {
            return NextResponse.json({ error: 'Company name and email are required' }, { status: 400 });
        }

        if (!adminEmail || !adminPassword) {
            return NextResponse.json({ error: 'Admin email and password are required' }, { status: 400 });
        }

        // Create company
        const company = await Company.create({
            name,
            email,
            plan: plan || 'basic',
            status: 'active',
        });

        // Create admin user for this company
        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        await User.create({
            name: adminName || name,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            company_id: company._id,
        });

        return NextResponse.json({ success: true, data: company }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
