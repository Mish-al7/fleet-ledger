import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import TripSheet from '@/models/TripSheet';
import Settings from '@/models/Settings';
import { authOptions } from '@/lib/auth';
import PDFDocument from 'pdfkit';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const [tripSheet, settings] = await Promise.all([
            TripSheet.findById(id),
            Settings.findOne().lean()
        ]);

        if (!tripSheet) {
            return NextResponse.json({ error: 'Trip Sheet not found' }, { status: 404 });
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

        // 1. Header
        doc.font('Helvetica-Bold').fontSize(24).text(companyName, { align: 'center' });
        doc.fontSize(14).text(tagline, { align: 'center' });

        doc.font('Helvetica').fontSize(10).text(
            `${addressLine} | Mob: ${phoneNumbers}`,
            { align: 'center' }
        );

        doc.moveDown(1);

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

        const dateStr = new Date(tripSheet.trip_sheet_date).toLocaleDateString('en-GB');
        doc.text(`Date: ${dateStr}`, startX, currentY, { align: 'right', width: contentWidth });

        currentY += 20;

        // 4. Main Table
        const rowHeight = 35; // Increased height for better spacing
        const col1Width = 120;
        const col2Width = contentWidth - col1Width;

        // Helper to draw row
        function drawRow(y, label, value) {
            doc.rect(startX, y, col1Width, rowHeight).stroke();
            doc.rect(startX + col1Width, y, col2Width, rowHeight).stroke();

            doc.font('Helvetica').fontSize(11).text(label, startX + 5, y + 10);
            if (value) {
                doc.font('Helvetica-Bold').text(String(value), startX + col1Width + 5, y + 10);
            }
        }

        // Guest Name
        drawRow(currentY, 'Guest Name', tripSheet.guest_name);
        currentY += rowHeight;

        // Vehicle Type & Reg No (Split Cell)
        doc.rect(startX, currentY, col1Width, rowHeight).stroke();
        doc.font('Helvetica').text('Type of Vehicle', startX + 5, currentY + 10);

        // Split second column
        const halfCol2 = col2Width / 2;
        doc.rect(startX + col1Width, currentY, halfCol2, rowHeight).stroke(); // Type Value
        doc.font('Helvetica-Bold').text(tripSheet.vehicle_type || '', startX + col1Width + 5, currentY + 10);

        doc.rect(startX + col1Width + halfCol2, currentY, halfCol2, rowHeight).stroke(); // Reg No + Value
        // Label "Reg. No." inside the cell?
        // Let's format it like "Reg. No. KL-XX-YYYY" or use a smaller label box
        // Based on PDF: Type of Vehicle [    ] Reg. No. [      ]
        // Let's actually split it: 
        // Label: Type of Vehicle | Value | Reg. No. | Value
        // But my helper is rigid. Let's draw manual for this row.

        // Redraw this row logic to match PDF better
        // The PDF has: [Guest Name label] [Guest Name value] (Full width)
        // [Type of Vehicle] [Value] [Reg. No.] [Value]

        // Let's overwrite the rects for this row
        // Clear previous drawRow attempt mentally (it's stream, so I just won't call it)
        // Re-implementing this specific row:

        // Cell 1: Label "Type of Vehicle"
        doc.rect(startX, currentY, col1Width, rowHeight).stroke();
        doc.font('Helvetica').text('Type of Vehicle', startX + 5, currentY + 10);

        // Cell 2: Value
        const typeWidth = 130;
        doc.rect(startX + col1Width, currentY, typeWidth, rowHeight).stroke();
        doc.font('Helvetica-Bold').text(tripSheet.vehicle_type || '', startX + col1Width + 5, currentY + 10);

        // Cell 3: Label "Reg. No."
        const regLabelWidth = 80;
        doc.rect(startX + col1Width + typeWidth, currentY, regLabelWidth, rowHeight).stroke();
        doc.font('Helvetica').text('Reg. No.', startX + col1Width + typeWidth + 5, currentY + 10);

        // Cell 4: Value
        const regValueWidth = contentWidth - col1Width - typeWidth - regLabelWidth;
        doc.rect(startX + col1Width + typeWidth + regLabelWidth, currentY, regValueWidth, rowHeight).stroke();
        doc.font('Helvetica-Bold').text(tripSheet.vehicle_reg_no || '', startX + col1Width + typeWidth + regLabelWidth + 5, currentY + 10);

        currentY += rowHeight;

        // Trip Details
        drawRow(currentY, 'Trip Details', tripSheet.trip_details);
        currentY += rowHeight;

        // KM Row
        // [Garage KM] [Value] [Pick-Up KM] [Value] -- PDF shows:
        // Garage KM | <empty> | Pick-Up KM | <empty> ? 
        // No, PDF shows:
        // Garage KM |                   Pick-Up KM |
        // Wait, looking at PDF image:
        // Column 1: Labels. Column 2: Values (Split?)
        // The grid is:
        // Guest Name | ________________
        // Type of Vehicle | _________ | Reg No. | ________
        // Trip Details | ________________
        // Garage KM | ________________ | Pick-Up KM | ______

        // It seems simpler:
        // Left Column (Label) | Right Column (Two halves?)
        // Actually, looking closely at "Garage KM" row:
        // Cell 1: "Garage KM"
        // Cell 2: Value (Empty or filled)
        // Does it have "Pick-Up KM" on the same row? 
        // Yes: Garage KM ...... Pick-Up KM ......

        // Let's assume a 2-column layout for the details part.
        // Label | Value | Label | Value

        function drawTwoColRow(y, l1, v1, l2, v2) {
            const quarter = contentWidth / 4;
            // But labels are usually smaller than values.
            // Let's use: Label (100) | Value (Auto) | Label (100) | Value (Auto)

            const labelW = 100;
            const valW = (contentWidth - (labelW * 2)) / 2;

            // C1
            doc.rect(startX, y, labelW, rowHeight).stroke();
            doc.text(l1, startX + 5, y + 10);

            // V1
            doc.rect(startX + labelW, y, valW, rowHeight).stroke();
            if (v1) doc.font('Helvetica-Bold').text(String(v1), startX + labelW + 5, y + 10);
            doc.font('Helvetica'); // reset

            // C2
            doc.rect(startX + labelW + valW, y, labelW, rowHeight).stroke();
            doc.text(l2, startX + labelW + valW + 5, y + 10);

            // V2
            doc.rect(startX + labelW + valW + labelW, y, valW, rowHeight).stroke();
            if (v2) doc.font('Helvetica-Bold').text(String(v2), startX + labelW + valW + labelW + 5, y + 10);
        }

        // However, the PDF looks like:
        // [LabelCol] [ContentCol]
        // But for KM/Time it creates a split inside.
        // Let's try to match the visuals of:
        // | Garage KM | <value> | Pick-Up KM | <value> |

        // Garage KM / Pick-Up KM
        drawTwoColRow(currentY, 'Garage KM', tripSheet.garage_km_start, 'Pick-Up KM', tripSheet.pickup_km);
        currentY += rowHeight;

        // Garage Time / Pick-Up Time
        drawTwoColRow(currentY, 'Garage Time', tripSheet.garage_time_start, 'Pick-Up Time', tripSheet.pickup_time);
        currentY += rowHeight;

        // Drop KM / Garage KM (End)
        drawTwoColRow(currentY, 'Drop KM', tripSheet.drop_km, 'Garage KM', tripSheet.garage_km_end);
        currentY += rowHeight;

        // Drop Time / Garage Time (End)
        drawTwoColRow(currentY, 'Drop Time', tripSheet.drop_time, 'Garage Time', tripSheet.garage_time_end);
        currentY += rowHeight;

        // Starting Date / Closing Date
        const startD = tripSheet.starting_date ? new Date(tripSheet.starting_date).toLocaleDateString('en-GB') : '';
        const closeD = tripSheet.closing_date ? new Date(tripSheet.closing_date).toLocaleDateString('en-GB') : '';
        drawTwoColRow(currentY, 'Starting Date', startD, 'Closing Date', closeD);
        currentY += rowHeight;

        // Total Bill Amount and Advance Amount (Two columns)
        currentY += 5; // tiny gap
        const amountLabelW = 150;
        const amountValW = (contentWidth / 2) - amountLabelW;

        // Left side: Total Bill Amount
        doc.rect(startX, currentY, amountLabelW, rowHeight).stroke();
        doc.font('Helvetica-Bold').text('TOTAL BILL AMOUNT Rs.', startX + 5, currentY + 10);

        doc.rect(startX + amountLabelW, currentY, amountValW, rowHeight).stroke();
        if (tripSheet.total_bill_amount) {
            doc.text(String(tripSheet.total_bill_amount), startX + amountLabelW + 5, currentY + 10);
        }

        // Right side: Advance Amount
        const rightStartX = startX + (contentWidth / 2);
        doc.rect(rightStartX, currentY, amountLabelW, rowHeight).stroke();
        doc.font('Helvetica-Bold').text('ADVANCE AMOUNT Rs.', rightStartX + 5, currentY + 10);

        doc.rect(rightStartX + amountLabelW, currentY, amountValW, rowHeight).stroke();
        if (tripSheet.advance_amount) {
            doc.text(String(tripSheet.advance_amount), rightStartX + amountLabelW + 5, currentY + 10);
        }

        currentY += rowHeight + 5;

        // Driver and Customer Names
        // Box 1: Driver's Name
        // Box 2: Customer Name
        const nameBoxWidth = contentWidth / 2;
        const nameBoxHeight = 50;

        doc.rect(startX, currentY, nameBoxWidth, nameBoxHeight).stroke();
        doc.font('Helvetica').text("Driver's Name: " + (tripSheet.driver_name || ''), startX + 5, currentY + 15);

        doc.rect(startX + nameBoxWidth, currentY, nameBoxWidth, nameBoxHeight).stroke();
        doc.text("Customer Name: " + (tripSheet.customer_name || ''), startX + nameBoxWidth + 5, currentY + 15);


        // --- PDF CONTENT END ---
        doc.end();

        const pdfBuffer = await pdfBufferPromise;

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="TripSheet_${tripSheet.trip_sheet_no}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
