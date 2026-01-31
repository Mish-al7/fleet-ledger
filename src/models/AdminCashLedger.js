import mongoose from 'mongoose';

const AdminCashLedgerSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
    },
    type: {
        type: String,
        required: [true, 'Type is required'],
        enum: ['income', 'expense'],
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be positive'],
    },
    running_balance: {
        type: Number,
        required: true,
        default: 0,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

// Index for efficient date-based queries
AdminCashLedgerSchema.index({ date: 1, createdAt: 1 });

export default mongoose.models.AdminCashLedger || mongoose.model('AdminCashLedger', AdminCashLedgerSchema);
