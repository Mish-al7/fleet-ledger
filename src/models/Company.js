import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Company email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    plan: {
        type: String,
        enum: ['free', 'basic', 'pro'],
        default: 'free',
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active',
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

export default mongoose.models.Company || mongoose.model('Company', CompanySchema);
