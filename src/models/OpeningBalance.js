import mongoose from 'mongoose';

const OpeningBalanceSchema = new mongoose.Schema({
    vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    opening_balance: {
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
}, {
    timestamps: true,
});

// One opening balance per vehicle per year per company
OpeningBalanceSchema.index({ vehicle_id: 1, year: 1, company_id: 1 }, { unique: true });

// Help with hot-reloading schema changes in development
if (mongoose.models.OpeningBalance) {
    delete mongoose.models.OpeningBalance;
}

export default mongoose.model('OpeningBalance', OpeningBalanceSchema);
