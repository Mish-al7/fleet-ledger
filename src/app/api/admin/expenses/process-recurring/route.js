import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import AdminExpense from '@/models/AdminExpense';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await req.json();
        const { selectedDues } = body; // Array of { masterId, dueDate }

        if (!selectedDues || !Array.isArray(selectedDues)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        let processedCount = 0;

        for (const due of selectedDues) {
            const expense = await AdminExpense.findById(due.masterId);
            if (!expense || expense.status !== 'Active') continue;

            const dueDate = new Date(due.dueDate);

            // Create Post Instance
            await AdminExpense.create({
                expense_type: expense.expense_type,
                description: `${expense.description} (Recurring)`,
                amount: expense.amount,
                frequency: 'One-time',
                start_date: dueDate,
                vehicle_id: expense.vehicle_id,
                status: 'Completed',
                created_by: session.user.id,
                last_posted_date: new Date(),
                recurring_master_id: expense._id // Link back to master
            });

            // Update Master's last_posted_date
            // We set it to the max of current last_posted_date and this dueDate to avoid regression
            const currentLastPosted = expense.last_posted_date ? new Date(expense.last_posted_date) : new Date(0);

            if (dueDate > currentLastPosted) {
                expense.last_posted_date = dueDate;
                await expense.save();
            }

            processedCount++;
        }

        return NextResponse.json({ success: true, processed: processedCount });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
