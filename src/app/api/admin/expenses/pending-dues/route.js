import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import AdminExpense from '@/models/AdminExpense';
import Vehicle from '@/models/Vehicle';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Find all Active Recurring Expenses
        const recurringExpenses = await AdminExpense.find({
            status: 'Active',
            frequency: { $ne: 'One-time' }
        }).populate('vehicle_id', 'vehicle_no');

        const now = new Date();
        // Find all existing completed instances for these recurring masters in one go
        const masterIds = recurringExpenses.map(e => e._id);
        const allExistingInstances = await AdminExpense.find({
            recurring_master_id: { $in: masterIds },
            status: 'Completed'
        }).select('start_date recurring_master_id').lean();

        // Group existing dates by masterId for efficient lookup
        const instancesByMaster = {};
        allExistingInstances.forEach(inst => {
            const mId = inst.recurring_master_id.toString();
            if (!instancesByMaster[mId]) instancesByMaster[mId] = new Set();
            instancesByMaster[mId].add(new Date(inst.start_date).toISOString().split('T')[0]);
        });

        const pendingDues = [];

        for (const expense of recurringExpenses) {
            // Calculate all dates that SHOULD have an instance from start_date to now
            const expectedDates = [];
            let current = new Date(expense.start_date);

            while (current <= now) {
                expectedDates.push(new Date(current));

                // Advance
                if (expense.frequency === 'Monthly') current.setMonth(current.getMonth() + 1);
                else if (expense.frequency === 'Quarterly') current.setMonth(current.getMonth() + 3);
                else if (expense.frequency === 'Yearly') current.setFullYear(current.getFullYear() + 1);
                else break;

                // Safety break
                if (expectedDates.length > 36) break; // Increased slightly for longer history
            }

            const existingDatesSet = instancesByMaster[expense._id.toString()] || new Set();

            // Identify Gaps
            for (const expectedDate of expectedDates) {
                const dateStr = expectedDate.toISOString().split('T')[0];
                if (!existingDatesSet.has(dateStr)) {
                    pendingDues.push({
                        masterId: expense._id,
                        expense_type: expense.expense_type,
                        description: expense.description,
                        amount: expense.amount,
                        vehicle_id: expense.vehicle_id?._id || null,
                        vehicle_no: expense.vehicle_id?.vehicle_no || 'Company Level',
                        frequency: expense.frequency,
                        dueDate: expectedDate.toISOString()
                    });
                }
            }
        }

        // Sort by date (newest first)
        pendingDues.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

        return NextResponse.json({ success: true, data: pendingDues });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
