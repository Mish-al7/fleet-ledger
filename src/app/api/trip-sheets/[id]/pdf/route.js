import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import TripSheet from '@/models/TripSheet';
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

        const tripSheet = await TripSheet.findById(id);
        if (!tripSheet) {
            return NextResponse.json({ error: 'Trip Sheet not found' }, { status: 404 });
        }

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
        doc.font('Helvetica-Bold').fontSize(24).text('NEELAMBARI', { align: 'center' });
        doc.fontSize(14).text('VACATIONS', { align: 'center' });

        doc.font('Helvetica').fontSize(10).text(
            '5/243 KADIRUR (PO), THALASSERY 670642 | Mob: 9562828482 | 8547227022',
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

        // Total Bill Amount
        // Full width label ??? Or Label | Value
        // PDF: TOTAL BILL AMOUNT Rs. (spanning mostly) | Value
        // Let's do: Label (70%) | Value (30%)

        currentY += 5; // tiny gap
        const billLabelW = contentWidth * 0.7;
        const billValW = contentWidth - billLabelW;

        doc.rect(startX, currentY, billLabelW, rowHeight).stroke();
        doc.font('Helvetica-Bold').text('TOTAL BILL AMOUNT Rs.', startX + 5, currentY + 10);

        doc.rect(startX + billLabelW, currentY, billValW, rowHeight).stroke();
        if (tripSheet.total_bill_amount) {
            doc.text(String(tripSheet.total_bill_amount), startX + billLabelW + 5, currentY + 10);
        }

        currentY += rowHeight + 5;

        // Signatures
        // Box 1: Driver's Name & Signature
        // Box 2: Customer Name & Signature
        const sigBoxWidth = contentWidth / 2;
        const sigBoxHeight = 80;

        doc.rect(startX, currentY, sigBoxWidth, sigBoxHeight).stroke();
        doc.font('Helvetica').text("Driver's Name: " + (tripSheet.driver_name || ''), startX + 5, currentY + 5);
        doc.text("Signature:", startX + 5, currentY + 40);

        doc.rect(startX + sigBoxWidth, currentY, sigBoxWidth, sigBoxHeight).stroke();
        doc.text("Customer Name: " + (tripSheet.customer_name || ''), startX + sigBoxWidth + 5, currentY + 5);
        doc.text("Signature:", startX + sigBoxWidth + 5, currentY + 40);


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
