import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        default: 'NEELAMBARI'
    },
    tagline: {
        type: String,
        default: 'VACATIONS'
    },
    address: {
        type: String,
        default: '5/243 KADIRUR (PO), THALASSERY 670642'
    },
    phoneNumbers: {
        type: String,
        default: '9562828482 | 8547227022'
    }
}, {
    timestamps: true
});

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
