import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import OpeningBalance from '@/models/OpeningBalance';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const year = searchParams.get('year');
        const filter = year ? { year: parseInt(year) } : {};

        await dbConnect();
        const balances = await OpeningBalance.find(filter).populate('vehicle_id', 'vehicle_no');
        return NextResponse.json({ success: true, data: balances });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
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

        if (!body.year) {
            return NextResponse.json({ error: 'Year is required' }, { status: 400 });
        }

        // Upsert logic: if exists for vehicle + year, update it.
        const balance = await OpeningBalance.findOneAndUpdate(
            { vehicle_id: body.vehicle_id, year: body.year },
            { opening_balance: body.opening_balance },
            { new: true, upsert: true, runValidators: true }
        );

        return NextResponse.json({ success: true, data: balance });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
