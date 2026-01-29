import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
    // System Fields
    booking_no: {
        type: String,
        required: true,
        unique: true,
    },
    booking_date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },

    // Customer Details
    customer_name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
    },
    customer_address: {
        type: String,
        trim: true,
    },
    customer_phone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true,
    },

    // Trip Details
    pickup_location: {
        type: String,
        required: [true, 'Pickup location is required'],
        trim: true,
    },
    trip_destination: {
        type: String,
        required: [true, 'Trip destination is required'],
        trim: true,
    },
    total_persons: {
        type: Number,
        min: 1,
        default: 1,
    },
    journey_start_date: {
        type: Date,
        required: [true, 'Journey start date is required'],
    },
    journey_return_date: {
        type: Date,
        required: [true, 'Journey return date is required'],
    },

    // Time & Distance
    trip_start_time: {
        type: String, // Format: "HH:MM"
        required: [true, 'Trip start time is required'],
    },
    trip_end_time: {
        type: String, // Format: "HH:MM"
        required: [true, 'Trip end time is required'],
    },
    total_days: {
        type: Number,
        min: 1,
        default: 1,
    },
    total_kilometers: {
        type: Number,
        min: 0,
        default: 0,
    },

    // Additional Info
    night_halt_places: {
        type: String,
        trim: true,
    },
    vehicle_type: {
        type: String,
        trim: true,
    },

    // Financials
    advance_amount: {
        type: Number,
        min: 0,
        default: 0,
    },
    total_amount: {
        type: Number,
        min: 0,
        default: 0,
    },
    other_expenses: {
        type: String,
        trim: true,
    },
    driver_food_accommodation: {
        type: String,
        trim: true,
    },

    // Vehicle (locked reference)
    vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle is required'],
    },
    vehicle_no: {
        type: String, // Snapshot at booking creation
        required: true,
    },
}, {
    timestamps: true,
});

// Index for efficient overlap queries
BookingSchema.index({ vehicle_id: 1, status: 1, journey_start_date: 1, journey_return_date: 1 });

// Static method to generate booking number
BookingSchema.statics.generateBookingNo = async function () {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Find count of bookings created today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await this.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const sequence = String(count + 1).padStart(3, '0');
    return `BK-${dateStr}-${sequence}`;
};

// Static method to check vehicle availability (overlap detection)
BookingSchema.statics.checkVehicleAvailability = async function (vehicleId, startDate, endDate, startTime, endTime, excludeBookingId = null) {
    const query = {
        vehicle_id: vehicleId,
        status: { $in: ['pending', 'approved'] },
        // Date range overlap: existing.start <= new.end AND existing.end >= new.start
        journey_start_date: { $lte: new Date(endDate) },
        journey_return_date: { $gte: new Date(startDate) },
    };

    // Exclude current booking when updating
    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const conflictingBookings = await this.find(query)
        .populate('vehicle_id', 'vehicle_no')
        .lean();

    if (conflictingBookings.length === 0) {
        return { available: true, conflicts: [] };
    }

    // For same-day bookings, check time overlap
    // Time overlap: existing.startTime < new.endTime AND existing.endTime > new.startTime
    const timeConflicts = conflictingBookings.filter(booking => {
        // Convert times to comparable numbers (minutes from midnight)
        const toMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const existingStart = toMinutes(booking.trip_start_time);
        const existingEnd = toMinutes(booking.trip_end_time);
        const newStart = toMinutes(startTime);
        const newEnd = toMinutes(endTime);

        // Check if dates are exactly the same (single-day overlap)
        const bookingStartDate = new Date(booking.journey_start_date).toDateString();
        const bookingEndDate = new Date(booking.journey_return_date).toDateString();
        const newStartDate = new Date(startDate).toDateString();
        const newEndDate = new Date(endDate).toDateString();

        // If booking spans multiple days, any overlap is a conflict
        if (bookingStartDate !== bookingEndDate || newStartDate !== newEndDate) {
            return true;
        }

        // Single-day booking: check time overlap
        return existingStart < newEnd && existingEnd > newStart;
    });

    return {
        available: timeConflicts.length === 0,
        conflicts: timeConflicts.map(b => ({
            booking_no: b.booking_no,
            dates: `${new Date(b.journey_start_date).toLocaleDateString()} - ${new Date(b.journey_return_date).toLocaleDateString()}`,
            times: `${b.trip_start_time} - ${b.trip_end_time}`,
            status: b.status
        }))
    };
};

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
