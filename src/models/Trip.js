import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
    trip_date: {
        type: Date,
        required: [true, 'Please provide a trip date'],
    },
    month: {
        type: String,
        required: true, // Auto-derived, e.g., '2025-01'
        match: /^\d{4}-\d{2}$/,
    },
    vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
    },
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    trip_route: {
        type: String,
        required: [true, 'Please provide the route'],
        trim: true,
    },

    // Financials
    income: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },

    // Expenses
    fuel: { type: Number, default: 0, min: 0 },
    fasttag: { type: Number, default: 0, min: 0 },
    driver_allowance: { type: Number, default: 0, min: 0 },
    service: { type: Number, default: 0, min: 0 },
    deposit_to_kdr_bank: { type: Number, default: 0, min: 0 },
    other_expense: { type: Number, default: 0, min: 0 },

    total_expenses: {
        type: Number,
        required: true,
        default: 0, // Auto-calculated
    },

    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

// Pre-validate hook to ensure month and total_expenses are correct before validation
TripSchema.pre('validate', function () {
    // Derive month from trip_date
    if (this.trip_date) {
        const d = new Date(this.trip_date);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        this.month = `${yyyy}-${mm}`;
    }

    // Calculate total_expenses
    this.total_expenses = (
        (this.fuel || 0) +
        (this.fasttag || 0) +
        (this.driver_allowance || 0) +
        (this.service || 0) +
        (this.deposit_to_kdr_bank || 0) +
        (this.other_expense || 0)
    );
});

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);
