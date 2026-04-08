import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Invoice from '@/models/Invoice';
import Booking from '@/models/Booking';
import Vehicle from '@/models/Vehicle';
import User from '@/models/User';
import Company from '@/models/Company';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.company_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get('booking_id');

        await dbConnect();

        const query = { company_id: session.user.company_id };
        if (bookingId) {
            query.booking_id = bookingId;
        }

        const invoices = await Invoice.find(query)
            .populate('vehicle_id', 'vehicle_no')
            .populate('booking_id', 'booking_no')
            .populate('created_by', 'name')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: invoices });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.company_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Basic validation
        if (data.drop_km <= data.pick_km) {
            return NextResponse.json({ error: 'Drop KM must be greater than Pick KM' }, { status: 400 });
        }

        if (new Date(data.end_time) <= new Date(data.start_time)) {
            return NextResponse.json({ error: 'End time must be after Start time' }, { status: 400 });
        }

        await dbConnect();

        // Verification logic for tenant isolation
        if (data.vehicle_id) {
            const vehicle = await Vehicle.findOne({ _id: data.vehicle_id, company_id: session.user.company_id });
            if (!vehicle) {
                return NextResponse.json({ error: 'Vehicle not found or unauthorized' }, { status: 400 });
            }
        }

        // We can do standard validation rules or trust frontend calculations 
        // Better to re-calculate on the backend to be safe.
        const pick_km = Number(data.pick_km);
        const drop_km = Number(data.drop_km);
        const base_km = Number(data.base_km);
        const base_hours = Number(data.base_hours);
        const base_price = Number(data.base_price);
        const extra_hour_rate = Number(data.extra_hour_rate);
        const extra_km_rate = Number(data.extra_km_rate);

        const startTimeDate = new Date(data.start_time);
        const endTimeDate = new Date(data.end_time);

        const total_km = drop_km - pick_km;
        const extra_km = Math.max(0, total_km - base_km);

        // Time logic: difference in milliseconds converted to hours
        const diffMs = endTimeDate.getTime() - startTimeDate.getTime();
        const total_hours = diffMs / (1000 * 60 * 60);
        // Rounding logic for hours, we could ceil it or keep precise. We'll use Math.ceil for extra hours typically, 
        // but we'll stick to Math.round(total_hours*100)/100 to avoid diverging too much unless specified.
        // Actually, precise decimals might be preferred. Let's keep precision.
        const extra_hours = Math.max(0, total_hours - base_hours);

        const calculated_amount = base_price + (extra_hours * extra_hour_rate) + (extra_km * extra_km_rate);
        const final_amount = data.override_amount !== undefined && data.override_amount !== null
            ? Number(data.override_amount)
            : calculated_amount;

        const newInvoiceData = {
            ...data,
            company_id: session.user.company_id,
            created_by: session.user.id,
            invoice_no: await Invoice.generateInvoiceNo(session.user.company_id),
            total_km,
            extra_km,
            total_hours,
            extra_hours,
            calculated_amount,
            final_amount
        };

        // Handle optional ObjectId fields that might be empty strings from frontend
        if (!newInvoiceData.booking_id) {
            delete newInvoiceData.booking_id;
        }

        const invoice = await Invoice.create(newInvoiceData);

        return NextResponse.json({ success: true, data: invoice }, { status: 201 });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
