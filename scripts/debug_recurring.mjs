
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load env vars BEFORE importing anything else that depends on them
dotenv.config({ path: '.env' });
console.log('Environment Loaded. MONGODB_URI exists?', !!process.env.MONGODB_URI);

// Dynamic imports to ensure env is ready
const { default: dbConnect } = await import('../src/lib/dbConnect.js');
const { default: AdminExpense } = await import('../src/models/AdminExpense.js');
const { default: Vehicle } = await import('../src/models/Vehicle.js');

async function checkRecurring() {
    try {
        await dbConnect();

        console.log('\n--- Checking Active Recurring Expenses ---');
        const recurring = await AdminExpense.find({
            status: 'Active',
            frequency: { $ne: 'One-time' }
        }).populate('vehicle_id');

        if (recurring.length === 0) {
            console.log('No Active recurring expenses found.');
        } else {
            const now = new Date();
            for (const exp of recurring) {
                console.log(`\nID: ${exp._id}`);
                console.log(`Description: ${exp.description} (${exp.frequency})`);
                console.log(`Vehicle: ${exp.vehicle_id ? exp.vehicle_id.vehicle_no : 'Company Level'}`);
                console.log(`Start Date: ${new Date(exp.start_date).toLocaleDateString()}`);
                console.log(`Last Posted Date: ${exp.last_posted_date ? new Date(exp.last_posted_date).toLocaleDateString() : 'NEVER'}`);

                let nextDueDate;
                const baseDate = exp.last_posted_date ? new Date(exp.last_posted_date) : new Date(exp.start_date);

                if (exp.last_posted_date) {
                    nextDueDate = new Date(baseDate);
                    if (exp.frequency === 'Monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                    else if (exp.frequency === 'Quarterly') nextDueDate.setMonth(nextDueDate.getMonth() + 3);
                    else if (exp.frequency === 'Yearly') nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
                } else {
                    nextDueDate = new Date(exp.start_date);
                }

                console.log(`Calculated Next Due Date: ${nextDueDate.toLocaleDateString()}`);
                console.log(`Is Due? ${nextDueDate <= now ? 'YES' : 'NO'}`);
            }
        }

        console.log('\n--- Checking Recently Completed Expenses (Last 5) ---');
        const completed = await AdminExpense.find({ status: 'Completed' })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('vehicle_id');

        for (const exp of completed) {
            console.log(`Completed: ${exp.description} | ${exp.vehicle_id?.vehicle_no || 'NoVehicle'} | ${new Date(exp.start_date).toLocaleDateString()}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

checkRecurring();
