import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import AdminExpense from '@/models/AdminExpense';
import AdminCashLedger from '@/models/AdminCashLedger';
import mongoose from 'mongoose';

// ─── Aggregation helpers (same logic as individual report routes) ────────────

function dateFilter(from, to) {
    if (!from && !to) return null;
    const f = {};
    if (from) f.$gte = new Date(from);
    if (to) {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        f.$lte = d;
    }
    return f;
}

async function getProfitLoss(company_id, from, to, vehicle_id, driver_id) {
    const tripMatch = { company_id };
    const df = dateFilter(from, to);
    if (df) tripMatch.trip_date = df;
    if (vehicle_id) tripMatch.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);
    if (driver_id) tripMatch.driver_id = new mongoose.Types.ObjectId(driver_id);

    const tripRows = await Trip.aggregate([
        { $match: tripMatch },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$trip_date' } },
                income: { $sum: '$income' },
                trip_expenses: { $sum: '$total_expenses' },
                trip_count: { $sum: 1 },
            },
        },
        { $project: { _id: 0, date: '$_id', income: 1, trip_expenses: 1, trip_count: 1 } },
        { $sort: { date: 1 } },
    ]);

    const expMatch = { company_id };
    if (df) expMatch.start_date = df;
    if (vehicle_id) expMatch.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);

    const adminRows = await AdminExpense.aggregate([
        { $match: expMatch },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$start_date' } },
                admin_expenses: { $sum: '$amount' },
            },
        },
        { $project: { _id: 0, date: '$_id', admin_expenses: 1 } },
    ]);

    const map = {};
    for (const r of tripRows) map[r.date] = { ...r, admin_expenses: 0 };
    for (const r of adminRows) {
        if (map[r.date]) map[r.date].admin_expenses = r.admin_expenses;
        else map[r.date] = { date: r.date, income: 0, trip_expenses: 0, admin_expenses: r.admin_expenses, trip_count: 0 };
    }

    return Object.values(map)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(r => ({
            ...r,
            total_expenses: r.trip_expenses + r.admin_expenses,
            net_profit: r.income - (r.trip_expenses + r.admin_expenses),
        }));
}

async function getVehicleProfitability(company_id, from, to, vehicle_id, driver_id) {
    const match = { company_id };
    const df = dateFilter(from, to);
    if (df) match.trip_date = df;
    if (vehicle_id) match.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);
    if (driver_id) match.driver_id = new mongoose.Types.ObjectId(driver_id);

    return Trip.aggregate([
        { $match: match },
        { $group: { _id: '$vehicle_id', income: { $sum: '$income' }, total_expenses: { $sum: '$total_expenses' }, trip_count: { $sum: 1 } } },
        { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'v' } },
        { $unwind: { path: '$v', preserveNullAndEmpty: false } },
        { $project: { _id: 0, vehicle_no: '$v.vehicle_no', income: 1, total_expenses: 1, net_profit: { $subtract: ['$income', '$total_expenses'] }, trip_count: 1 } },
        { $sort: { net_profit: -1 } },
    ]);
}

async function getExpenseBreakdown(company_id, from, to, vehicle_id) {
    const tripMatch = { company_id };
    const df = dateFilter(from, to);
    if (df) tripMatch.trip_date = df;
    if (vehicle_id) tripMatch.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);

    const [te] = await Trip.aggregate([
        { $match: tripMatch },
        { $group: { _id: null, fuel: { $sum: '$fuel' }, fasttag: { $sum: '$fasttag' }, driver_allowance: { $sum: '$driver_allowance' }, service: { $sum: '$service' }, adblue: { $sum: '$adblue' }, grease: { $sum: '$grease' }, air: { $sum: '$air' }, deposit_to_kdr_bank: { $sum: '$deposit_to_kdr_bank' }, other_expense: { $sum: '$other_expense' } } },
    ]);

    const tripRows = te ? [
        { category: 'Fuel', type: 'Trip', amount: te.fuel || 0 },
        { category: 'FASTag', type: 'Trip', amount: te.fasttag || 0 },
        { category: 'Driver Allowance', type: 'Trip', amount: te.driver_allowance || 0 },
        { category: 'Service', type: 'Trip', amount: te.service || 0 },
        { category: 'AdBlue', type: 'Trip', amount: te.adblue || 0 },
        { category: 'Grease', type: 'Trip', amount: te.grease || 0 },
        { category: 'Air', type: 'Trip', amount: te.air || 0 },
        { category: 'KDR Bank Deposit', type: 'Trip', amount: te.deposit_to_kdr_bank || 0 },
        { category: 'Other (Trip)', type: 'Trip', amount: te.other_expense || 0 },
    ].filter(r => r.amount > 0) : [];

    const adminMatch = { company_id };
    if (df) adminMatch.start_date = df;
    if (vehicle_id) adminMatch.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);

    const adminRows = await AdminExpense.aggregate([
        { $match: adminMatch },
        { $group: { _id: '$expense_type', amount: { $sum: '$amount' } } },
        { $project: { _id: 0, category: '$_id', type: { $literal: 'Admin' }, amount: 1 } },
    ]);

    return [...tripRows, ...adminRows].sort((a, b) => b.amount - a.amount);
}

async function getTripSummary(company_id, from, to, vehicle_id, driver_id) {
    const match = { company_id };
    const df = dateFilter(from, to);
    if (df) match.trip_date = df;
    if (vehicle_id) match.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);
    if (driver_id) match.driver_id = new mongoose.Types.ObjectId(driver_id);

    return Trip.aggregate([
        { $match: match },
        { $lookup: { from: 'vehicles', localField: 'vehicle_id', foreignField: '_id', as: 'vehicle' } },
        { $unwind: { path: '$vehicle', preserveNullAndEmpty: true } },
        { $lookup: { from: 'users', localField: 'driver_id', foreignField: '_id', as: 'driver' } },
        { $unwind: { path: '$driver', preserveNullAndEmpty: true } },
        {
            $project: {
                _id: 0,
                date: { $dateToString: { format: '%Y-%m-%d', date: '$trip_date' } },
                route: '$trip_route',
                vehicle_no: { $ifNull: ['$vehicle.vehicle_no', 'N/A'] },
                driver_name: { $ifNull: ['$actual_driver_name', '$driver.name', 'N/A'] },
                income: 1,
                total_expenses: 1,
                net_profit: { $subtract: ['$income', '$total_expenses'] },
                notes: 1,
            },
        },
        { $sort: { date: -1 } },
    ]);
}

async function getLedgerMovement(company_id, from, to) {
    const match = { company_id };
    const df = dateFilter(from, to);
    if (df) match.date = df;

    return AdminCashLedger.aggregate([
        { $match: match },
        {
            $project: {
                _id: 0,
                date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                description: 1,
                type: 1,
                amount: 1,
                running_balance: 1,
            },
        },
        { $sort: { date: 1 } },
    ]);
}

// ─── CSV builder ─────────────────────────────────────────────────────────────

function toCsv(headers, rows) {
    const escape = v => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
        headers.map(escape).join(','),
        ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
    ];
    return lines.join('\n');
}

// ─── Simple PDF (table) via plain text response using PDFKit ─────────────────

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

        // Table
        const pageWidth = doc.page.width - 80;
        const colW = Math.floor(pageWidth / headers.length);
        let y = doc.y;

        // Header row
        doc.font('Helvetica-Bold').fontSize(8);
        headers.forEach((h, i) => {
            doc.text(labelMap[h] || h, 40 + i * colW, y, { width: colW - 4, lineBreak: false });
        });
        y += 16;
        doc.moveTo(40, y - 2).lineTo(40 + pageWidth, y - 2).stroke();

        // Data rows
        doc.font('Helvetica').fontSize(7.5);
        for (const row of rows) {
            if (y > doc.page.height - 60) {
                doc.addPage();
                y = 40;
            }
            headers.forEach((h, i) => {
                const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
                doc.text(val, 40 + i * colW, y, { width: colW - 4, lineBreak: false });
            });
            y += 14;
        }

        doc.end();
    });

    return Buffer.concat(chunks);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const company_id = new mongoose.Types.ObjectId(session.user.company_id);
        const { searchParams } = new URL(req.url);

        const report = searchParams.get('report') || 'profit-loss';
        const format = searchParams.get('format') || 'csv';
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const vehicle_id = searchParams.get('vehicle_id');
        const driver_id = searchParams.get('driver_id');

        let rows = [];
        let headers = [];
        let labelMap = {};
        let title = '';

        switch (report) {
            case 'profit-loss':
                rows = await getProfitLoss(company_id, from, to, vehicle_id, driver_id);
                headers = ['date', 'trip_count', 'income', 'trip_expenses', 'admin_expenses', 'total_expenses', 'net_profit'];
                labelMap = { date: 'Date', trip_count: 'Trips', income: 'Income', trip_expenses: 'Trip Expenses', admin_expenses: 'Admin Expenses', total_expenses: 'Total Expenses', net_profit: 'Net Profit' };
                title = 'Profit & Loss Report';
                break;

            case 'vehicle-profitability':
                rows = await getVehicleProfitability(company_id, from, to, vehicle_id, driver_id);
                headers = ['vehicle_no', 'trip_count', 'income', 'total_expenses', 'net_profit'];
                labelMap = { vehicle_no: 'Vehicle', trip_count: 'Trips', income: 'Income', total_expenses: 'Expenses', net_profit: 'Net Profit' };
                title = 'Vehicle Profitability Report';
                break;

            case 'expense-breakdown':
                rows = await getExpenseBreakdown(company_id, from, to, vehicle_id);
                headers = ['category', 'type', 'amount'];
                labelMap = { category: 'Category', type: 'Type', amount: 'Amount' };
                title = 'Expense Breakdown Report';
                break;

            case 'trip-summary':
                rows = await getTripSummary(company_id, from, to, vehicle_id, driver_id);
                headers = ['date', 'route', 'vehicle_no', 'driver_name', 'income', 'total_expenses', 'net_profit', 'notes'];
                labelMap = { date: 'Date', route: 'Route', vehicle_no: 'Vehicle', driver_name: 'Driver', income: 'Income', total_expenses: 'Expenses', net_profit: 'Net Profit', notes: 'Notes' };
                title = 'Trip Summary Report';
                break;

            case 'ledger-movement':
                rows = await getLedgerMovement(company_id, from, to);
                headers = ['date', 'description', 'type', 'amount', 'running_balance'];
                labelMap = { date: 'Date', description: 'Description', type: 'Type', amount: 'Amount', running_balance: 'Balance' };
                title = 'Ledger Movement Report';
                break;

            default:
                return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
        }

        const filename = `${report}-${new Date().toISOString().slice(0, 10)}`;

        if (format === 'csv') {
            const csv = toCsv(headers, rows);
            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${filename}.csv"`,
                },
            });
        }

        if (format === 'pdf') {
            const pdfBuffer = await buildPdf(title, headers, rows, labelMap);
            return new Response(pdfBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${filename}.pdf"`,
                },
            });
        }

        return NextResponse.json({ error: 'Invalid format. Use csv or pdf.' }, { status: 400 });
    } catch (err) {
        console.error('[reports/export]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
