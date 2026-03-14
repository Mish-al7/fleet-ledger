import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import Invoice from '@/models/Invoice';
import Settings from '@/models/Settings';
import { authOptions } from '@/lib/auth';
import PDFDocument from 'pdfkit';
import { formatDate } from '@/lib/dateUtils';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const [invoice, settings] = await Promise.all([
            Invoice.findById(id)
                .populate('vehicle_id', 'vehicle_no')
                .populate('booking_id', 'booking_no')
                .populate('created_by', 'name'),
            Settings.findOne().lean()
        ]);

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
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

        // 2. INVOICE Title Box
        const startX = 50;
        const pageWidth = 595.28;
        const contentWidth = pageWidth - 100;
        let currentY = doc.y;

        doc.rect(startX, currentY, contentWidth, 25).stroke();
        doc.font('Helvetica-Bold').fontSize(16).text('INVOICE / BILL', startX, currentY + 5, { width: contentWidth, align: 'center' });

        currentY += 35;

        // 3. Info row
        doc.font('Helvetica').fontSize(11).text(`Inv No: ${invoice.invoice_no}`, startX, currentY);
        const invDate = formatDate(invoice.createdAt);
        doc.text(`Date: ${invDate}`, startX, currentY, { align: 'right', width: contentWidth });

        currentY += 20;
        doc.text(`Customer: ${invoice.customer_name}`, startX, currentY);

        currentY += 20;
        doc.text(`Vehicle No: ${invoice.vehicle_id?.vehicle_no || 'N/A'}`, startX, currentY);
        if (invoice.booking_id) {
            doc.text(`Booking No: ${invoice.booking_id.booking_no}`, startX, currentY, { align: 'right', width: contentWidth });
        }

        currentY += 30;

        // 4. Billing Table Header
        const colWidths = [200, 70, 70, 150]; // Description, Quantity, Rate, Amount
        const tableHeaders = ['Description', 'Qty/Unit', 'Rate', 'Total (Rs.)'];

        doc.rect(startX, currentY, contentWidth, 20).fillAndStroke('#f0f0f0', '#000');
        doc.fillColor('#000').font('Helvetica-Bold').fontSize(10);

        let headerX = startX;
        tableHeaders.forEach((header, i) => {
            doc.text(header, headerX + 5, currentY + 5, { width: colWidths[i] - 10, align: i === 0 ? 'left' : 'right' });
            headerX += colWidths[i];
        });

        currentY += 20;
        doc.font('Helvetica').fontSize(10);

        // helper to add row
        function addTableRow(desc, qty, rate, amt) {
            doc.rect(startX, currentY, contentWidth, 20).stroke();
            let x = startX;
            doc.text(desc, x + 5, currentY + 5, { width: colWidths[0] - 10 });
            x += colWidths[0];
            doc.text(String(qty), x + 5, currentY + 5, { width: colWidths[1] - 10, align: 'right' });
            x += colWidths[1];
            doc.text(String(rate), x + 5, currentY + 5, { width: colWidths[2] - 10, align: 'right' });
            x += colWidths[2];
            doc.text(String(amt), x + 5, currentY + 5, { width: colWidths[3] - 10, align: 'right' });
            currentY += 20;
        }

        // Base Package
        addTableRow(`Base Package (${invoice.base_km}km / ${invoice.base_hours}hrs)`, '1', invoice.base_price, invoice.base_price);

        // Extra KM
        if (invoice.extra_km > 0) {
            addTableRow(`Extra Kilometers`, invoice.extra_km.toString(), invoice.extra_km_rate, (invoice.extra_km * invoice.extra_km_rate).toFixed(2));
        }

        // Extra Hours
        if (invoice.extra_hours > 0) {
            addTableRow(`Extra Hours`, invoice.extra_hours.toFixed(2), invoice.extra_hour_rate, (invoice.extra_hours * invoice.extra_hour_rate).toFixed(2));
        }

        // Subtotal / Calculated
        doc.rect(startX, currentY, contentWidth, 25).stroke();
        doc.font('Helvetica-Bold').text('Calculated Total Amount:', startX + 5, currentY + 7);
        doc.text(`Rs. ${invoice.calculated_amount.toFixed(2)}`, startX + 5, currentY + 7, { align: 'right', width: contentWidth - 10 });

        currentY += 25;

        // Override if applicable
        if (invoice.override_amount !== undefined && invoice.override_amount !== null && invoice.override_amount !== invoice.calculated_amount) {
            doc.rect(startX, currentY, contentWidth, 25).stroke();
            doc.font('Helvetica').text('Manual Adjustment / Override:', startX + 5, currentY + 7);
            const diff = invoice.final_amount - invoice.calculated_amount;
            doc.text(`${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`, startX + 5, currentY + 7, { align: 'right', width: contentWidth - 10 });
            currentY += 25;
        }

        // Grand Total
        doc.rect(startX, currentY, contentWidth, 30).fillAndStroke('#eef2ff', '#000');
        doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(14).text('Total Payable:', startX + 5, currentY + 8);
        doc.text(`Rs. ${invoice.final_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, startX + 5, currentY + 8, { align: 'right', width: contentWidth - 10 });

        doc.fillColor('#000');
        currentY += 50;

        // Summary details
        doc.font('Helvetica-Bold').fontSize(11).text('Trip Details Summary:', startX, currentY);
        currentY += 20;
        doc.font('Helvetica').fontSize(10);
        doc.text(`Odometer: ${invoice.pick_km} - ${invoice.drop_km} (${invoice.total_km} km)`, startX + 10, currentY);
        currentY += 15;
        const startT = new Date(invoice.start_time).toLocaleString();
        const endT = new Date(invoice.end_time).toLocaleString();
        doc.text(`Duration: ${startT} to ${endT}`, startX + 10, currentY);
        currentY += 15;
        doc.text(`Total Hours: ${invoice.total_hours.toFixed(2)} hrs`, startX + 10, currentY);

        currentY += 60;

        // Signatures
        const sigWidth = contentWidth / 2;
        doc.text('Prepared By:', startX, currentY);
        doc.text('Customer Signature:', startX + sigWidth, currentY);

        currentY += 40;
        doc.font('Helvetica-Bold').text(invoice.created_by?.name || 'Authorized Signatory', startX, currentY);

        // Footer - Use 770 to stay comfortably within the bottom margin (791 for A4)
        doc.fontSize(8).font('Helvetica').text('This is a computer generated invoice.', 0, 770, { align: 'center', width: pageWidth });

        // --- PDF CONTENT END ---
        doc.end();

        const pdfBuffer = await pdfBufferPromise;

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="Invoice_${invoice._id}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generating Invoice PDF:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
