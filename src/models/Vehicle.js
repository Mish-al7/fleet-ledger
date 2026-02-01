import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
    vehicle_no: {
        type: String,
        required: [true, 'Please provide a vehicle number'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
});
//export
export default mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
