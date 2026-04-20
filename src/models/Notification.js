import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['booking_created'],
    },
    related_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
