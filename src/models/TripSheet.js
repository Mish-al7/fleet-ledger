import mongoose from 'mongoose';

const TripSheetSchema = new mongoose.Schema({
    trip_sheet_no: {
        type: String,
        required: true,
        unique: true,
    },
    trip_sheet_date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    // Guest & Vehicle
    guest_name: {
        type: String,
        default: '',
    },
    vehicle_type: {
        type: String,
        default: '',
    },
    vehicle_reg_no: {
        type: String,
        default: '',
    },
    // Trip Details
    trip_details: {
        type: String,
        default: '',
    },
    // KM Details
    garage_km_start: {
        type: Number,
        default: null,
    },
    pickup_km: {
        type: Number,
        default: null,
    },
    drop_km: {
        type: Number,
        default: null,
    },
    garage_km_end: {
        type: Number,
        default: null,
    },
    // Time Details
    garage_time_start: {
        type: String,
        default: '',
    },
    pickup_time: {
        type: String,
        default: '',
    },
    drop_time: {
        type: String,
        default: '',
    },
    garage_time_end: {
        type: String,
        default: '',
    },
    // Dates
    starting_date: {
        type: Date,
        default: null,
    },
    closing_date: {
        type: Date,
        default: null,
    },
    // Billing
    total_bill_amount: {
        type: Number,
        default: null,
    },
    // Signatures / Names
    driver_name: {
        type: String,
        default: '',
    },
    customer_name: {
        type: String,
        default: '',
    },
    // System fields
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

export default mongoose.models.TripSheet || mongoose.model('TripSheet', TripSheetSchema);
