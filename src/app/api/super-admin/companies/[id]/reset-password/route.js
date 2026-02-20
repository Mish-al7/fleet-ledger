import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// POST: Reset a company admin's password
export async function POST(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const { newPassword } = body;
        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Find admin user(s) for this company
        const adminUser = await User.findOne({ company_id: id, role: 'admin' });
        if (!adminUser) {
            return NextResponse.json({ error: 'No admin user found for this company' }, { status: 404 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        adminUser.password = hashedPassword;
        await adminUser.save();

        return NextResponse.json({ success: true, message: 'Admin password reset successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
