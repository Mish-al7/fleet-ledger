import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Invoice from '@/models/Invoice';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Fetch single invoice
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.company_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        const invoice = await Invoice.findOne({
            _id: id,
            company_id: session.user.company_id
        })
        .populate('vehicle_id', 'vehicle_no')
        .populate('booking_id', 'booking_no customer_name journey_start_date journey_return_date')
        .populate('created_by', 'name')
        .lean();

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: invoice });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update invoice
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.company_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const data = await request.json();

        await dbConnect();

        const invoice = await Invoice.findOne({
            _id: id,
            company_id: session.user.company_id
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Basic validation
        if (data.drop_km <= data.pick_km) {
            return NextResponse.json({ error: 'Drop KM must be greater than Pick KM' }, { status: 400 });
        }
        if (new Date(data.end_time) <= new Date(data.start_time)) {
            return NextResponse.json({ error: 'End time must be after Start time' }, { status: 400 });
        }

        // Recalculate
        const pick_km = Number(data.pick_km);
        const drop_km = Number(data.drop_km);
        const base_km = Number(data.base_km);
        const base_hours = Number(data.base_hours);
        const base_price = Number(data.base_price);
        const extra_hour_rate = Number(data.extra_hour_rate);
        const extra_km_rate = Number(data.extra_km_rate);

        const total_km = drop_km - pick_km;
        const extra_km = Math.max(0, total_km - base_km);
        const diffMs = new Date(data.end_time).getTime() - new Date(data.start_time).getTime();
        const total_hours = diffMs / (1000 * 60 * 60);
        const extra_hours = Math.max(0, total_hours - base_hours);

        const calculated_amount = base_price + (extra_hours * extra_hour_rate) + (extra_km * extra_km_rate);
        const final_amount = data.override_amount !== undefined && data.override_amount !== null 
            ? Number(data.override_amount) 
            : calculated_amount;

        // Update fields
        const updateData = {
            ...data,
            total_km,
            extra_km,
            total_hours,
            extra_hours,
            calculated_amount,
            final_amount
        };

        // Handle empty booking_id
        if (!updateData.booking_id) {
            updateData.booking_id = null;
        }

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).populate('vehicle_id', 'vehicle_no');

        return NextResponse.json({ success: true, data: updatedInvoice });
    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete invoice
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.company_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        const deletedInvoice = await Invoice.findOneAndDelete({
            _id: id,
            company_id: session.user.company_id
        });

        if (!deletedInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
