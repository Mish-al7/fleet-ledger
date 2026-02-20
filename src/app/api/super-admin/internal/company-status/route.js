import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Company from '@/models/Company';

// Internal endpoint for middleware suspension check
// Secured via x-internal-key header (must match NEXTAUTH_SECRET)
export async function GET(req) {
    const internalKey = req.headers.get('x-internal-key');

    if (internalKey !== process.env.NEXTAUTH_SECRET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    try {
        await dbConnect();
        const company = await Company.findById(id).select('status').lean();

        if (!company) {
            return NextResponse.json({ status: 'not_found' });
        }

        return NextResponse.json({ status: company.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
