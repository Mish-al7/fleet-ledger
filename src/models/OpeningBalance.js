import mongoose from 'mongoose';

const OpeningBalanceSchema = new mongoose.Schema({
    vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
        unique: true, // One opening balance per vehicle
    },
    opening_balance: {
        type: Number,
        required: true,
        default: 0,
    },
}, {
    timestamps: true,
});

export default mongoose.models.OpeningBalance || mongoose.model('OpeningBalance', OpeningBalanceSchema);
