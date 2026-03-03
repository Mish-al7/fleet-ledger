import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Settings from '@/models/Settings';
import { authOptions } from '@/lib/auth';
import PDFDocument from 'pdfkit';
import { formatDate, formatTimeTo24Hour } from '@/lib/dateUtils';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const [booking, settings] = await Promise.all([
            Booking.findById(id),
            Settings.findOne().lean()
        ]);

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Settings fallbacks
        const companyName = settings?.companyName || 'NEELAMBARI';
        const tagline = settings?.tagline || 'VACATIONS';
        const addressLine = settings?.address || '5/243 KADIRUR (PO), THALASSERY 670642';
        const phoneNumbers = settings?.phoneNumbers || '9562828482 | 8547227022';

        // Create PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));

        // Define Promise to handle stream end
        const pdfBufferPromise = new Promise((resolve, reject) => {
            doc.on('end', () => {
                const pdfData = Buffer.concat(chunks);
                resolve(pdfData);
            });
            doc.on('error', reject);
        });

        // --- PDF CONTENT START ---

        // 1. Header (Same as Trip Sheet)
        doc.font('Helvetica-Bold').fontSize(24).text(companyName, { align: 'center' });
        doc.fontSize(14).text(tagline, { align: 'center' });

        doc.font('Helvetica').fontSize(10).text(
            `${addressLine} | Mob: ${phoneNumbers}`,
            { align: 'center' }
        );

        doc.moveDown(1);

        // 2. BOOKING FORM Title Box
        const startX = 50;
        const pageWidth = 595.28; // A4 width
        const contentWidth = pageWidth - 100;
        let currentY = doc.y;

        doc.rect(startX, currentY, contentWidth, 25).stroke();
        doc.font('Helvetica-Bold').fontSize(16).text('BOOKING FORM', startX, currentY + 5, { width: contentWidth, align: 'center' });

        currentY += 35;

        // 3. No and Date row
        doc.font('Helvetica').fontSize(12).text(`No. ${booking.booking_no}`, startX, currentY);

        const dateStr = formatDate(booking.booking_date || booking.createdAt);
        doc.text(`Date: ${dateStr}`, startX, currentY, { align: 'right', width: contentWidth });

        currentY += 25;

        // 4. Main Table Helper
        const rowHeight = 35;
        const col1Width = 120;
        const col2Width = contentWidth - col1Width;

        function drawRow(y, label, value) {
            doc.rect(startX, y, col1Width, rowHeight).stroke();
            doc.rect(startX + col1Width, y, col2Width, rowHeight).stroke();

            doc.font('Helvetica').fontSize(11).text(label, startX + 5, y + 10);
            if (value) {
                doc.font('Helvetica-Bold').text(String(value), startX + col1Width + 5, y + 10);
            }
        }

        function drawTwoColRow(y, l1, v1, l2, v2) {
            const labelW = 100;
            const valW = (contentWidth - (labelW * 2)) / 2;

            doc.rect(startX, y, labelW, rowHeight).stroke();
            doc.font('Helvetica').fontSize(11).text(l1, startX + 5, y + 10);

            doc.rect(startX + labelW, y, valW, rowHeight).stroke();
            if (v1) doc.font('Helvetica-Bold').text(String(v1), startX + labelW + 5, y + 10);

            doc.rect(startX + labelW + valW, y, labelW, rowHeight).stroke();
            doc.font('Helvetica').text(l2, startX + labelW + valW + 5, y + 10);

            doc.rect(startX + labelW + valW + labelW, y, valW, rowHeight).stroke();
            if (v2) doc.font('Helvetica-Bold').text(String(v2), startX + labelW + valW + labelW + 5, y + 10);
        }

        // Customer Details
        drawRow(currentY, 'Customer Name', booking.customer_name);
        currentY += rowHeight;

        drawRow(currentY, 'Phone Number', booking.customer_phone);
        currentY += rowHeight;

        drawRow(currentY, 'Address', booking.customer_address || '-');
        currentY += rowHeight;

        // Vehicle Info
        drawTwoColRow(currentY, 'Vehicle No.', booking.vehicle_no, 'Vehicle Type', booking.vehicle_type || '-');
        currentY += rowHeight;

        // Journey Details
        drawRow(currentY, 'Pickup', booking.pickup_location);
        currentY += rowHeight;

        drawRow(currentY, 'Destination', booking.trip_destination);
        currentY += rowHeight;

        // Schedule
        const startD = formatDate(booking.journey_start_date);
        const endD = formatDate(booking.journey_return_date);
        drawTwoColRow(currentY, 'Start Date', startD, 'Return Date', endD);
        currentY += rowHeight;

        drawTwoColRow(currentY, 'Start Time', formatTimeTo24Hour(booking.trip_start_time), 'End Time', formatTimeTo24Hour(booking.trip_end_time));
        currentY += rowHeight;

        // Additional Info
        drawTwoColRow(currentY, 'Total Days', booking.total_days, 'Total Persons', booking.total_persons);
        currentY += rowHeight;

        drawRow(currentY, 'Night Halts', booking.night_halt_places || '-');
        currentY += rowHeight;

        // Financials
        currentY += 10;
        const amountLabelW = 150;
        const amountValW = (contentWidth / 2) - amountLabelW;

        // Left side: Total Amount
        doc.rect(startX, currentY, amountLabelW, rowHeight).stroke();
        doc.font('Helvetica-Bold').text('TOTAL AMOUNT Rs.', startX + 5, currentY + 10);

        doc.rect(startX + amountLabelW, currentY, amountValW, rowHeight).stroke();
        if (booking.total_amount) {
            doc.text(String(booking.total_amount), startX + amountLabelW + 5, currentY + 10);
        }

        // Right side: Advance Amount
        const rightStartX = startX + (contentWidth / 2);
        doc.rect(rightStartX, currentY, amountLabelW, rowHeight).stroke();
        doc.font('Helvetica-Bold').text('ADVANCE AMOUNT Rs.', rightStartX + 5, currentY + 10);

        doc.rect(rightStartX + amountLabelW, currentY, amountValW, rowHeight).stroke();
        if (booking.advance_amount) {
            doc.text(String(booking.advance_amount), rightStartX + amountLabelW + 5, currentY + 10);
        }

        currentY += rowHeight + 10;

        // Other Expenses & Accommodation
        drawRow(currentY, 'Other Expenses', booking.other_expenses || '-');
        currentY += rowHeight;

        drawRow(currentY, 'Food & Acc.', booking.driver_food_accommodation || '-');
        currentY += rowHeight + 20;

        // Signatures
        const boxWidth = contentWidth / 2;
        const boxHeight = 60;

        doc.rect(startX, currentY, boxWidth, boxHeight).stroke();
        doc.font('Helvetica').fontSize(10).text("Office Signature", startX + 5, currentY + 5);

        doc.rect(startX + boxWidth, currentY, boxWidth, boxHeight).stroke();
        doc.text("Customer Signature", startX + boxWidth + 5, currentY + 5);

        // --- PDF CONTENT END ---
        doc.end();

        const pdfBuffer = await pdfBufferPromise;

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Booking_${booking.booking_no}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
