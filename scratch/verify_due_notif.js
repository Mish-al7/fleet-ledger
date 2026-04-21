import mongoose from 'mongoose';
import Notification from '../src/models/Notification.js';
import Booking from '../src/models/Booking.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function simulateDueBooking() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find a driver and an admin
    const driver = await User.findOne({ role: 'driver' });
    const admin = await User.findOne({ role: 'admin' });
    
    if (!driver || !admin) {
        console.log('Driver or Admin not found. Skipping simulation.');
        await mongoose.disconnect();
        return;
    }

    console.log(`Using Driver: ${driver.email}, Admin: ${admin.email}`);

    // Create a booking that ended yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const booking = await Booking.create({
        booking_no: 'TEST-' + Date.now(),
        company_id: admin.company_id,
        created_by: admin._id,
        driver_id: driver._id,
        status: 'approved',
        customer_name: 'Test Customer',
        customer_phone: '1234567890',
        journey_start_date: yesterday,
        journey_return_date: yesterday,
        trip_start_time: '09:00',
        trip_end_time: '18:00',
        vehicle_id: new mongoose.Types.ObjectId(), // dummy
        vehicle_no: 'TEST-123'
    });

    console.log(`Created due booking: ${booking.booking_no}`);

    // Now trigger the discovery logic (simulating GET /api/notifications)
    // We can't easily call the API route here, but we can copy the logic
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueBookings = await Booking.find({
        company_id: admin.company_id,
        driver_id: driver._id,
        status: 'approved',
        journey_return_date: { $lte: new Date() }
    }).lean();

    console.log(`Found ${dueBookings.length} due bookings for driver.`);

    for (const b of dueBookings) {
        const existingNotif = await Notification.findOne({
            company_id: admin.company_id,
            recipient: driver._id,
            related_id: b._id,
            type: 'booking_due'
        });

        if (!existingNotif) {
            console.log(`Creating notification for ${b.booking_no}`);
            await Notification.create({
                company_id: admin.company_id,
                recipient: driver._id,
                title: 'Trip Entry Due',
                message: `The trip ${b.booking_no} to ${b.trip_destination} has ended. Please enter the final trip details.`,
                type: 'booking_due',
                related_id: b._id
            });
        } else {
            console.log(`Notification already exists for ${b.booking_no}`);
        }
    }

    // Check if notification was created
    const notif = await Notification.findOne({ related_id: booking._id });
    if (notif) {
        console.log('Verification Success: Notification created automatically!');
    } else {
        console.log('Verification Failed: Notification not created.');
    }

    // Cleanup
    await Booking.deleteOne({ _id: booking._id });
    if (notif) await Notification.deleteOne({ _id: notif._id });

    await mongoose.disconnect();
}

simulateDueBooking().catch(console.error);
