import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Vehicle from '@/models/Vehicle';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const company_id = session.user.company_id;

        await dbConnect();

        // Match only vehicles for this company, and lookup latest next_service_date from logs
        const vehicles = await Vehicle.aggregate([
            { $match: { company_id: new (await import('mongoose')).default.Types.ObjectId(company_id) } },
            { $sort: { vehicle_no: 1 } },
            {
                $lookup: {
                    from: 'vehicleservicelogs',
                    let: { vId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$vehicle_id', '$$vId'] },
                                next_service_date: { $exists: true, $ne: null },
                                follow_up_completed: { $ne: true }
                            }
                        },
                        { $sort: { next_service_date: 1 } },
                        { $limit: 1 },
                        { $project: { next_service_date: 1 } }
                    ],
                    as: 'latest_log'
                }
            },
            {
                $addFields: {
                    next_service_date: { $arrayElemAt: ['$latest_log.next_service_date', 0] }
                }
            },
            { $project: { latest_log: 0 } }
        ]);

        return NextResponse.json({ success: true, data: vehicles });
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

        // Strip any client-sent company_id and inject from JWT
        delete body.company_id;

        const vehicle = await Vehicle.create({
            ...body,
            company_id: session.user.company_id,
        });
        return NextResponse.json({ success: true, data: vehicle }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
