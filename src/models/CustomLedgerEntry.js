import mongoose from 'mongoose';

const CustomLedgerEntrySchema = new mongoose.Schema({
    ledger_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomLedger',
        required: [true, 'Ledger ID is required'],
        index: true,
    },
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
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required'],
        index: true,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

// Index for efficient chronological queries within a specific ledger
CustomLedgerEntrySchema.index({ ledger_id: 1, date: 1, createdAt: 1 });

export default mongoose.models.CustomLedgerEntry || mongoose.model('CustomLedgerEntry', CustomLedgerEntrySchema);
