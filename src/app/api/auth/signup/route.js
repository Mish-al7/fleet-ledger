import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Company from '@/models/Company';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/utils/resend';

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();

        const { name, email, adminName, adminEmail, adminPassword } = body;

        // Basic validation
        if (!name || !email || !adminEmail || !adminPassword) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if company email already exists
        const existingCompany = await Company.findOne({ email: email.toLowerCase() });
        if (existingCompany) {
            return NextResponse.json(
                { error: 'A company with this email already exists' },
                { status: 400 }
            );
        }

        // Check if user email already exists (globally for this check, though model allows per company)
        // For signup, we usually want global unique email for the primary admin email
        const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 400 }
            );
        }

        // Create company (defaults to pending_approval)
        const company = await Company.create({
            name,
            email: email.toLowerCase(),
            plan: 'basic',
            status: 'pending_approval',
        });

        // Create admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        await User.create({
            name: adminName || name,
            email: adminEmail.toLowerCase(),
            password: hashedPassword,
            role: 'admin',
            company_id: company._id,
        });

        // Send welcome email (asynchronously, don't block the response)
        sendWelcomeEmail(adminEmail.toLowerCase(), adminName || name)
            .catch(err => console.error('Failed to send welcome email:', err));

        return NextResponse.json(
            { success: true, message: 'Registration successful. Waiting for admin approval.' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup Error:', error);
        return NextResponse.json(
            { error: 'An error occurred during registration' },
            { status: 500 }
        );
    }
}
