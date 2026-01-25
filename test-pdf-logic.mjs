import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Mock Model just to be safe if import fails (though we should try to import)
// But to match behavior, let's try to import the model file.
// Since modules might be tricky, I'll define schema here or assume I can import if I use .js extension in import?
// Node might complain about import extension.
// Let's redefine schema briefly to minimize dependency issues in this test script

const TripSheetSchema = new mongoose.Schema({
    trip_sheet_no: String,
    trip_sheet_date: Date,
    guest_name: String,
    vehicle_type: String,
    vehicle_reg_no: String,
    trip_details: String,
    garage_km_start: Number,
    pickup_km: Number,
    drop_km: Number,
    garage_km_end: Number,
    garage_time_start: String,
    pickup_time: String,
    drop_time: String,
    garage_time_end: String,
    starting_date: Date,
    closing_date: Date,
    total_bill_amount: Number,
    driver_name: String,
    customer_name: String,
});
const TripSheet = mongoose.models.TripSheet || mongoose.model('TripSheet', TripSheetSchema);

async function run() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const tripSheet = await TripSheet.findOne();
        if (!tripSheet) {
            console.log('No trip sheet found to test.');
            process.exit(0);
        }
        console.log('Found Trip Sheet:', tripSheet.trip_sheet_no);

        // --- PDF Logic duplicate ---
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream('test_logic_output.pdf');
        doc.pipe(stream);

        // 1. Header
        doc.font('Helvetica-Bold').fontSize(24).text('NEELAMBARI', { align: 'center' });
        doc.fontSize(14).text('VACATIONS', { align: 'center' });

        doc.font('Helvetica').fontSize(10).text(
            '5/243 KADIRUR (PO), THALASSERY 670642 | Mob: 9562828482 | 8547227022',
            { align: 'center' }
        );

        doc.moveDown(1);

        // ... (abbrev logic for test) ...
        // 2. TRIP SHEET Title Box
        const startX = 50;
        const pageWidth = 595.28; // A4 width
        const contentWidth = pageWidth - 100;
        let currentY = doc.y;

        doc.rect(startX, currentY, contentWidth, 25).stroke();
        doc.font('Helvetica-Bold').fontSize(16).text('TRIP SHEET', startX, currentY + 5, { width: contentWidth, align: 'center' });

        currentY += 35;

        // 3. No and Date row
        doc.font('Helvetica').fontSize(12).text(`No. ${tripSheet.trip_sheet_no}`, startX, currentY);

        // This line might fail if date is missing/invalid
        const dateStr = new Date(tripSheet.trip_sheet_date).toLocaleDateString('en-GB');
        doc.text(`Date: ${dateStr}`, startX, currentY, { align: 'right', width: contentWidth });

        // ...

        doc.end();
        console.log('PDF Generated successfully to test_logic_output.pdf');

    } catch (error) {
        console.error('Logic Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
