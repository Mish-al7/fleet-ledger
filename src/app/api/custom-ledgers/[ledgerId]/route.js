import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import CustomLedger from '@/models/CustomLedger';
import CustomLedgerEntry from '@/models/CustomLedgerEntry';
import mongoose from 'mongoose';

export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { ledgerId } = await params;
        const company_id = new mongoose.Types.ObjectId(session.user.company_id);

        const ledger = await CustomLedger.findOne({ _id: ledgerId, company_id });
        if (!ledger) {
            return NextResponse.json({ error: 'Ledger not found or unauthorized' }, { status: 404 });
        }

        // Delete all entries associated with this ledger
        await CustomLedgerEntry.deleteMany({ ledger_id: ledgerId, company_id });

        // Delete the ledger itself
        await CustomLedger.findByIdAndDelete(ledgerId);

        return NextResponse.json({ success: true, message: 'Ledger deleted successfully' });
    } catch (error) {
        console.error('Error deleting custom ledger:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
