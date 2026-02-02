import mongoose from 'mongoose';

const AdminExpenseSchema = new mongoose.Schema({
    expense_type: {
        type: String,
        enum: ['EMI', 'Insurance', 'Tax', 'FASTag', 'Other'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    frequency: {
        type: String,
        enum: ['One-time', 'Monthly', 'Quarterly', 'Yearly'],
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date
    },
    vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'Paused', 'Completed'],
        default: 'Active'
    },
    created_by: {
        type: String, // Storing Admin ID or Name
        required: true
    },
    last_posted_date: {
        type: Date,
        default: null
    },
    recurring_master_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminExpense',
        default: null
    }
}, {
    timestamps: true
});

export default mongoose.models.AdminExpense || mongoose.model('AdminExpense', AdminExpenseSchema);
