import mongoose from 'mongoose';

const VehicleServiceLogSchema = new mongoose.Schema({
    vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
    },
    vehicle_no: { // Denormalized for easier reporting
        type: String,
        required: true,
    },
    // Vehicle Snapshot (optional, for history)
    make: String,
    model: String,
    year: Number,

    service_date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    odometer_reading: {
        type: Number,
        required: true,
        min: 0,
    },
    service_category: {
        type: String,
        required: true, // e.g., 'Regular Service', 'Repair', 'Tyre Change'
    },

    description: {
        type: String,
        trim: true,
    },

    // Costs
    parts_cost: {
        type: Number,
        default: 0,
        min: 0,
    },
    labour_cost: {
        type: Number,
        default: 0,
        min: 0,
    },
    total_cost: {
        type: Number,
        default: 0, // Auto-calculated
        min: 0,
    },

    service_provider: {
        type: String,
        trim: true,
    },

    // Follow up
    follow_up_required: {
        type: Boolean,
        default: false,
    },
    follow_up_completed: {
        type: Boolean,
        default: false,
    },
    follow_up_notes: String,
    next_service_date: Date,

    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// Auto-calculate total cost
// Auto-calculation moved to API controller to avoid middleware issues


// Help with hot-reloading schema changes in development
if (mongoose.models.VehicleServiceLog) {
    delete mongoose.models.VehicleServiceLog;
}

export default mongoose.model('VehicleServiceLog', VehicleServiceLogSchema);
