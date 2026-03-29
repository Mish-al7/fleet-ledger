import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import mongoose from 'mongoose';

async function buildPdf(title, headers, rows, labelMap) {
    const PDFDocument = (await import('pdfkit')).default;
    const chunks = [];
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    await new Promise((resolve, reject) => {
        doc.on('data', c => chunks.push(c));
        doc.on('end', resolve);
        doc.on('error', reject);

        // Title
        doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(1);

        const pageWidth = doc.page.width - 80;
        const colW = Math.floor(pageWidth / headers.length);
        let y = doc.y;

        // Header
        doc.font('Helvetica-Bold').fontSize(8);
        headers.forEach((h, i) => {
            doc.text(labelMap[h] || h, 40 + i * colW, y, { width: colW - 4, lineBreak: false });
        });
        y += 16;
        doc.moveTo(40, y - 2).lineTo(40 + pageWidth, y - 2).stroke();

        // Rows
        doc.font('Helvetica').fontSize(7.5);
        for (const row of rows) {
            let maxRowHeight = 14;
            headers.forEach((h) => {
                const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
                const hgt = doc.heightOfString(val, { width: colW - 4, align: 'left' });
                if (hgt > maxRowHeight) maxRowHeight = hgt;
            });
            maxRowHeight += 4; // Padding

            if (y + maxRowHeight > doc.page.height - 60) {
                doc.addPage();
                y = 40;
            }

            headers.forEach((h, i) => {
                const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
                doc.text(val, 40 + i * colW, y, { width: colW - 4, align: 'left' });
            });
            y += maxRowHeight;
        }

        doc.end();
    });

    return Buffer.concat(chunks);
}

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const report = searchParams.get('report') || 'profit-loss';
        const format = searchParams.get('format') || 'csv';
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const vehicle_id = searchParams.get('vehicle_id');
        const driver_id = searchParams.get('driver_id');

        const match = { trip_date: { $type: 'date' } };
        if (from || to) {
            if (from) match.trip_date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                match.trip_date.$lte = toDate;
            }
        }
        if (vehicle_id) match.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);
        if (driver_id) match.driver_id = new mongoose.Types.ObjectId(driver_id);

        let rows = [];
        let headers = [];
        let labelMap = {};
        let title = '';

        if (report === 'profit-loss') {
            title = 'Profit & Loss Report';
            headers = ['date', 'trip_count', 'income', 'trip_expenses', 'net_profit'];
            labelMap = { date: 'Date', trip_count: 'Trips', income: 'Income', trip_expenses: 'Expenses', net_profit: 'Net Profit' };
            const data = await Trip.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$trip_date' } },
                        income: { $sum: '$income' },
                        trip_expenses: { $sum: '$total_expenses' },
                        trip_count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } }
            ]);
            rows = data.map(r => ({
                date: r._id,
                trip_count: r.trip_count,
                income: r.income,
                trip_expenses: r.trip_expenses,
                net_profit: r.income - r.trip_expenses
            }));
        } else if (report === 'vehicle-profitability') {
            title = 'Vehicle Profitability Report';
            headers = ['vehicle_no', 'trip_count', 'income', 'expenses', 'net_profit', 'margin'];
            labelMap = { vehicle_no: 'Vehicle', trip_count: 'Trips', income: 'Income', expenses: 'Expenses', net_profit: 'Net Profit', margin: 'Margin%' };
            const data = await Trip.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: '$vehicle_id',
                        income: { $sum: '$income' },
                        total_expenses: { $sum: '$total_expenses' },
                        trip_count: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: 'vehicles',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vehicle',
                    },
                },
                { $unwind: '$vehicle' }
            ]);
            rows = data.map(r => {
                const profit = r.income - r.total_expenses;
                return {
                    vehicle_no: r.vehicle.vehicle_no,
                    trip_count: r.trip_count,
                    income: r.income,
                    expenses: r.total_expenses,
                    net_profit: profit,
                    margin: r.income > 0 ? ((profit / r.income) * 100).toFixed(2) : '0.00'
                };
            });
        } else if (report === 'trip-summary') {
            title = 'Trip Summary Report';
            headers = ['date', 'route', 'vehicle', 'income', 'expenses', 'profit', 'notes'];
            labelMap = { date: 'Date', route: 'Route', vehicle: 'Vehicle', income: 'Income', expenses: 'Expenses', profit: 'Profit', notes: 'Notes' };
            const data = await Trip.find(match).populate('vehicle_id', 'vehicle_no').sort({ trip_date: -1 }).lean();
            rows = data.map(r => ({
                date: r.trip_date.toISOString().split('T')[0],
                route: r.trip_route,
                vehicle: r.vehicle_id?.vehicle_no || 'N/A',
                income: r.income,
                expenses: r.total_expenses,
                profit: r.income - r.total_expenses,
                notes: r.notes || ''
            }));
        } else if (report === 'expense-breakdown') {
            title = 'Expense Breakdown Report';
            headers = ['category', 'amount'];
            labelMap = { category: 'Category', amount: 'Amount' };
            const tripTotals = await Trip.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        fuel: { $sum: '$fuel' },
                        fasttag: { $sum: '$fasttag' },
                        driver_allowance: { $sum: '$driver_allowance' },
                        service: { $sum: '$service' },
                        adblue: { $sum: '$adblue' },
                        grease: { $sum: '$grease' },
                        air: { $sum: '$air' },
                        deposit_to_kdr_bank: { $sum: '$deposit_to_kdr_bank' },
                        other_expense: { $sum: '$other_expense' },
                    },
                },
            ]);
            const te = tripTotals[0] || {};
            rows = [
                { category: 'Fuel', amount: te.fuel || 0 },
                { category: 'FASTag', amount: te.fasttag || 0 },
                { category: 'Driver Allowance', amount: te.driver_allowance || 0 },
                { category: 'Service', amount: te.service || 0 },
                { category: 'AdBlue', amount: te.adblue || 0 },
                { category: 'Grease', amount: te.grease || 0 },
                { category: 'Air', amount: te.air || 0 },
                { category: 'Deposit to KDR Bank', amount: te.deposit_to_kdr_bank || 0 },
                { category: 'Other', amount: te.other_expense || 0 },
            ].filter(r => r.amount > 0);
        }

        const filename = `report_${report}_${new Date().toISOString().split('T')[0]}`;

        if (format === 'csv') {
            const csvContent = [
                headers.map(h => labelMap[h] || h),
                ...rows.map(row => headers.map(h => row[h]))
            ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename=${filename}.csv`,
                },
            });
        }

        if (format === 'pdf') {
            const pdfBuffer = await buildPdf(title, headers, rows, labelMap);
            return new NextResponse(pdfBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename=${filename}.pdf`,
                },
            });
        }

        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });

    } catch (err) {
        console.error('[reports/export]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
