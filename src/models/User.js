import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: 60,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'], // Will be hashed
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'driver', 'super_admin'],
        default: 'driver',
    },
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: function () {
            return this.role !== 'super_admin';
        },
        index: true,
    },
    assignedVehicles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Email unique per company (not globally)
UserSchema.index({ email: 1, company_id: 1 }, { unique: true });
UserSchema.index({ company_id: 1, role: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
