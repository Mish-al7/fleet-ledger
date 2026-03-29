'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    FileBarChart2,
    Truck,
    ReceiptText,
    ClipboardList,
    Download,
    FileText,
    ChevronDown,
    Filter,
    Calendar,
} from 'lucide-react';
import DateInput from '@/app/components/DateInput';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = n =>
    typeof n === 'number'
        ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
        : '—';

const pct = n => (typeof n === 'number' ? `${n.toFixed(1)}%` : '—');

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
    { id: 'profit-loss', label: 'P&L', icon: FileBarChart2 },
    { id: 'vehicle-profitability', label: 'Vehicle Profitability', icon: Truck },
    { id: 'expense-breakdown', label: 'Expense Breakdown', icon: ReceiptText },
    { id: 'trip-summary', label: 'Trip Summary', icon: ClipboardList },
];

// ─── Table components ────────────────────────────────────────────────────────

function ProfitLossTable({ data, totals }) {
    if (!data.length) return <EmptyState />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium text-right">Trips</th>
                        <th className="px-4 py-3 font-medium text-right">Income</th>
                        <th className="px-4 py-3 font-medium text-right">Trip Expenses</th>
                        <th className="px-4 py-3 font-medium text-right">Net Profit</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                    {data.map((r, i) => (
                        <tr key={`${r.date}-${i}`} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.date}</td>
                            <td className="px-4 py-3 text-right">{r.trip_count}</td>
                            <td className="px-4 py-3 text-right text-emerald-400">{fmt(r.income)}</td>
                            <td className="px-4 py-3 text-right text-red-400">{fmt(r.trip_expenses)}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${r.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                {fmt(r.net_profit)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                {totals && (
                    <tfoot>
                        <tr className="border-t-2 border-slate-700 text-white font-bold text-sm">
                            <td className="px-4 py-3">TOTAL</td>
                            <td className="px-4 py-3 text-right">{totals.trip_count}</td>
                            <td className="px-4 py-3 text-right text-emerald-400">{fmt(totals.income)}</td>
                            <td className="px-4 py-3 text-right text-red-400">{fmt(totals.trip_expenses)}</td>
                            <td className={`px-4 py-3 text-right ${totals.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>{fmt(totals.net_profit)}</td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}

function VehicleProfitabilityTable({ data }) {
    if (!data.length) return <EmptyState />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                        <th className="px-4 py-3 font-medium">Vehicle</th>
                        <th className="px-4 py-3 font-medium text-right">Trips</th>
                        <th className="px-4 py-3 font-medium text-right">Income</th>
                        <th className="px-4 py-3 font-medium text-right">Expenses</th>
                        <th className="px-4 py-3 font-medium text-right">Net Profit</th>
                        <th className="px-4 py-3 font-medium text-right">Margin</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                    {data.map((r, i) => (
                        <tr key={r.vehicle_id ?? i} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-semibold text-white">
                                {r.vehicle_no}{r.nickname ? ` (${r.nickname})` : ''}
                            </td>
                            <td className="px-4 py-3 text-right">{r.trip_count}</td>
                            <td className="px-4 py-3 text-right text-emerald-400">{fmt(r.income)}</td>
                            <td className="px-4 py-3 text-right text-red-400">{fmt(r.total_expenses)}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${r.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>{fmt(r.net_profit)}</td>
                            <td className="px-4 py-3 text-right text-slate-400">{pct(r.profit_margin)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ExpenseBreakdownTable({ data, total }) {
    if (!data.length) return <EmptyState />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium text-right">Amount</th>
                        <th className="px-4 py-3 font-medium text-right">Share %</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                    {data.map((r, i) => (
                        <tr key={i} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-medium text-white">{r.category}</td>
                            <td className="px-4 py-3 text-right text-red-400">{fmt(r.amount)}</td>
                            <td className="px-4 py-3 text-right text-slate-400">
                                {total > 0 ? pct((r.amount / total) * 100) : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-slate-700 font-bold text-white">
                        <td className="px-4 py-3">TOTAL</td>
                        <td className="px-4 py-3 text-right text-red-400">{fmt(total)}</td>
                        <td className="px-4 py-3 text-right text-slate-400">100%</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

function TripSummaryTable({ data }) {
    if (!data.length) return <EmptyState />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Route</th>
                        <th className="px-4 py-3 font-medium">Vehicle</th>
                        <th className="px-4 py-3 font-medium">Driver</th>
                        <th className="px-4 py-3 font-medium text-right">Income</th>
                        <th className="px-4 py-3 font-medium text-right">Expenses</th>
                        <th className="px-4 py-3 font-medium text-right">Net Profit</th>
                        <th className="px-4 py-3 font-medium">Notes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                    {data.map((r, i) => (
                        <tr key={r._id || i} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.trip_date}</td>
                            <td className="px-4 py-3 max-w-[160px] truncate">{r.trip_route}</td>
                            <td className="px-4 py-3 font-semibold text-white">
                                {r.vehicle_no}{r.nickname ? ` (${r.nickname})` : ''}
                            </td>
                            <td className="px-4 py-3">{r.driver_name}</td>
                            <td className="px-4 py-3 text-right text-emerald-400">{fmt(r.income)}</td>
                            <td className="px-4 py-3 text-right text-red-400">{fmt(r.total_expenses)}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${r.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>{fmt(r.net_profit)}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs max-w-[120px] truncate">{r.notes || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-16 text-slate-600">
            <FileText className="mx-auto mb-3 opacity-40" size={40} />
            <p className="text-sm">No data for the selected filters.</p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('profit-loss');
    const [data, setData] = useState([]);
    const [totals, setTotals] = useState(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filters
    const [month, setMonth] = useState('');
    const [availableMonths, setAvailableMonths] = useState([]);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicleId, setVehicleId] = useState('');
    const [driverId, setDriverId] = useState('');

    // Initial Fetch
    useEffect(() => {
        // Fetch vehicles
        fetch('/api/vehicles').then(r => r.json()).then(j => j.success && setVehicles(j.data || [])).catch(() => { });
        
        // Fetch drivers
        fetch('/api/users').then(r => r.json()).then(j => {
            if (j.success) setDrivers((j.data || []).filter(u => u.role === 'driver'));
        }).catch(() => { });

        // Fetch available months from summary API
        fetch('/api/summary/monthly').then(r => r.json()).then(j => {
            if (j.success && j.availableMonths) {
                setAvailableMonths(j.availableMonths);
            }
        }).catch(() => { });
    }, []);

    const buildQs = useCallback(() => {
        const p = new URLSearchParams();
        if (from) p.set('from', from);
        if (to) p.set('to', to);
        if (vehicleId) p.set('vehicle_id', vehicleId);
        if (driverId) p.set('driver_id', driverId);
        return p.toString();
    }, [from, to, vehicleId, driverId]);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setData([]);
        setTotals(null);
        setTotal(0);
        try {
            const qs = buildQs();
            const res = await fetch(`/api/reports/${activeTab}${qs ? '?' + qs : ''}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data || []);
                setTotals(json.totals || null);
                setTotal(json.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [activeTab, buildQs]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleMonthChange = (e) => {
        const val = e.target.value; 
        setMonth(val);
        if (val && val.includes('-')) {
            const [yStr, mStr] = val.split('-');
            const year = parseInt(yStr);
            const monthIdx = parseInt(mStr) - 1;

            const first = new Date(year, monthIdx, 1);
            const last = new Date(year, monthIdx + 1, 0);

            const fmtDate = (d) => {
                const yy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yy}-${mm}-${dd}`;
            };

            setFrom(fmtDate(first));
            setTo(fmtDate(last));
        } else {
            setFrom('');
            setTo('');
        }
    };

    const handleFromChange = (e) => {
        setFrom(e.target.value);
        setMonth('');
    };

    const handleToChange = (e) => {
        setTo(e.target.value);
        setMonth('');
    };

    const handleExport = (format) => {
        const qs = buildQs();
        const base = `/api/reports/export?report=${activeTab}&format=${format}`;
        window.open(qs ? `${base}&${qs}` : base, '_blank');
    };

    const formatMonthDisplay = (mStr) => {
        if (!mStr) return 'Select Month';
        const [y, m] = mStr.split('-');
        return new Date(y, m - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Reports</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Read-only analytical trip reports</p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-600/30 text-emerald-400 text-sm font-medium transition-all"
                    >
                        <Download size={14} />
                        CSV
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-600/30 text-blue-400 text-sm font-medium transition-all"
                    >
                        <FileText size={14} />
                        PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex flex-wrap gap-3 items-end">
                    
                    {/* Month Select - Standard Select instead of input type="month" for reliability */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Filter size={10} /> Month
                        </label>
                        <div className="relative">
                            <select
                                value={month}
                                onChange={handleMonthChange}
                                className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-8 py-2 outline-none focus:border-blue-500/60 transition-colors min-h-[40px] min-w-[140px]"
                            >
                                <option value="">Select Month</option>
                                {availableMonths.map(m => (
                                    <option key={m} value={m}>{formatMonthDisplay(m)}</option>
                                ))}
                            </select>
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="hidden sm:block text-slate-600 mb-2">or</div>

                    {/* From/To Dates */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-medium flex items-center gap-1">From</label>
                        <DateInput
                            value={from}
                            onChange={(e) => handleFromChange(e)}
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/60 transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-medium">To</label>
                        <DateInput
                            value={to}
                            onChange={(e) => handleToChange(e)}
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/60 transition-colors"
                        />
                    </div>

                    {/* Vehicle/Driver Filters */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-medium">Vehicle</label>
                        <div className="relative">
                            <select
                                value={vehicleId}
                                onChange={e => setVehicleId(e.target.value)}
                                className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-3 pr-8 py-2 outline-none focus:border-blue-500/60 transition-colors min-h-[40px]"
                            >
                                <option value="">All Vehicles</option>
                                {vehicles.map(v => (
                                    <option key={v._id} value={v._id}>{v.vehicle_no}{v.nickname ? ` - ${v.nickname}` : ''}</option>
                                ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-medium">Driver</label>
                        <div className="relative">
                            <select
                                value={driverId}
                                onChange={e => setDriverId(e.target.value)}
                                className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-3 pr-8 py-2 outline-none focus:border-blue-500/60 transition-colors min-h-[40px]"
                            >
                                <option value="">All Drivers</option>
                                {drivers.map(d => (
                                    <option key={d._id} value={d._id}>{d.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    <button
                        onClick={() => { setMonth(''); setFrom(''); setTo(''); setVehicleId(''); setDriverId(''); }}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors self-end pb-2.5"
                    >
                        Clear filters
                    </button>
                </div>
            </div>

            {/* Tabs + Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="flex overflow-x-auto border-b border-slate-800 no-scrollbar">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${isActive
                                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'profit-loss' && <ProfitLossTable data={data} totals={totals} />}
                            {activeTab === 'vehicle-profitability' && <VehicleProfitabilityTable data={data} />}
                            {activeTab === 'expense-breakdown' && <ExpenseBreakdownTable data={data} total={total} />}
                            {activeTab === 'trip-summary' && <TripSummaryTable data={data} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
