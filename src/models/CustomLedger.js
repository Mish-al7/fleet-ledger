import mongoose from 'mongoose';

const CustomLedgerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Ledger name is required'],
        trim: true,
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

// Compound index to ensure uniqueness of ledger names per company
CustomLedgerSchema.index({ company_id: 1, name: 1 }, { unique: true });

export default mongoose.models.CustomLedger || mongoose.model('CustomLedger', CustomLedgerSchema);
