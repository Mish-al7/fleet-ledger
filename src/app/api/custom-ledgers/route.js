import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import CustomLedger from '@/models/CustomLedger';
import CustomLedgerEntry from '@/models/CustomLedgerEntry';
import mongoose from 'mongoose';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const company_id = new mongoose.Types.ObjectId(session.user.company_id);

        const ledgers = await CustomLedger.find({ company_id }).sort({ name: 1 });
        return NextResponse.json({ success: true, data: ledgers });
    } catch (error) {
        console.error('Error fetching custom ledgers:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        if (!data.name || data.name.trim() === '') {
            return NextResponse.json({ error: 'Ledger name is required' }, { status: 400 });
        }

        await dbConnect();
        const company_id = new mongoose.Types.ObjectId(session.user.company_id);

        // Check if a ledger with this name already exists for the company
        const existing = await CustomLedger.findOne({
            company_id,
            name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') }
        });

        if (existing) {
            return NextResponse.json({ error: 'A ledger with this name already exists' }, { status: 400 });
        }

        const newLedger = new CustomLedger({
            name: data.name.trim(),
            company_id,
            created_by: new mongoose.Types.ObjectId(session.user.id),
        });

        await newLedger.save();
        return NextResponse.json({ success: true, data: newLedger }, { status: 201 });
    } catch (error) {
        console.error('Error creating custom ledger:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
