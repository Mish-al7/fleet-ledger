import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required'],
        index: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // Optional: If null, it means it's for all admins of the company
    },
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
        enum: ['booking_created', 'booking_approved', 'booking_rejected', 'system'],
        default: 'system',
    },
    related_id: {
        type: mongoose.Schema.Types.ObjectId, // e.g. Booking ID
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Index to quickly fetch unread notifications for a company/user
NotificationSchema.index({ company_id: 1, recipient: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
