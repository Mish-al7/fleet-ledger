'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import EditTripModal from '@/app/components/EditTripModal';

export default function VehicleLedgerPage() {
    const { vehicleId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState({});
    const [editingTrip, setEditingTrip] = useState(null);

    // Filters state
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(''); // '' means all
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const fetchLedger = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/ledger/${vehicleId}?year=${selectedYear}`);
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [vehicleId, selectedYear]);

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleEditClick = (e, trip) => {
        e.stopPropagation();
        setEditingTrip(trip);
    };

    const handleDeleteClick = async (e, tripId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/trips/${tripId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Refresh data to update ledger balances
                fetchLedger();
            } else {
                alert('Failed to delete trip');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        }
    };

    const handleTripUpdate = () => {
        fetchLedger();
    };

    // Filter and Sort Logic
    const filteredLedger = data?.ledger.filter(row => {
        const tripDate = new Date(row.trip_date);

        // Year filter (API already filters trip data if we wanted to, but requirement says "Filters affect ONLY which rows are shown")
        // However, year changes the Opening Balance Resolution, so we re-fetch on Year change.
        // For Month and Date Range, we filter locally to avoid re-calculating balances.

        if (selectedMonth && row.month !== `${selectedYear}-${selectedMonth.padStart(2, '0')}`) {
            return false;
        }

        if (dateRange.start && tripDate < new Date(dateRange.start)) return false;
        if (dateRange.end && tripDate > new Date(dateRange.end)) return false;

        return true;
    }).sort((a, b) => new Date(b.trip_date) - new Date(a.trip_date)) || [];

    if (loading && !data) return <div className="p-6 text-slate-500">Loading ledger...</div>;
    if (!data) return <div className="p-6 text-red-400">Failed to load data</div>;

    // Calculate Yearly Stats for Header Display
    const yearlyTrips = data.ledger.filter(row => {
        const tripYear = new Date(row.trip_date).getFullYear();
        return tripYear === selectedYear;
    });

    const yearlyRunningBalance = yearlyTrips.reduce((acc, row) => {
        return acc + (row.income || 0) - (row.total_expenses || 0);
    }, 0);

    const totalBalance = (data.opening_balance || 0) + yearlyRunningBalance;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/ledger" className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {data.vehicle ? data.vehicle.vehicle_no : 'Vehicle Ledger'}
                        </h1>
                        <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-3">
                                <p className="text-slate-400 text-sm">
                                    Opening Balance ({data.selected_year}):
                                    <span className="text-white font-mono ml-1">₹{data.opening_balance.toLocaleString()}</span>
                                </p>
                                <span className="text-slate-700">|</span>
                                <p className="text-slate-400 text-sm">
                                    Running Balance ({selectedYear}):
                                    <span className={`font-mono ml-1 ${yearlyRunningBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {yearlyRunningBalance >= 0 ? '+' : ''}₹{yearlyRunningBalance.toLocaleString()}
                                    </span>
                                </p>
                                <span className="text-slate-700">|</span>
                                <p className="text-slate-200 text-sm font-bold">
                                    Total Balance:
                                    <span className={`font-mono ml-1 ${totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ₹{totalBalance.toLocaleString()}
                                    </span>
                                </p>
                                {selectedMonth && (() => {
                                    const monthBalance = data.ledger.filter(row => {
                                        return row.month === `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
                                    }).reduce((acc, row) => acc + (row.income || 0) - (row.total_expenses || 0), 0);

                                    return (
                                        <>
                                            <span className="text-slate-700">|</span>
                                            <p className="text-blue-200 text-sm font-bold">
                                                Monthly Balance:
                                                <span className={`font-mono ml-1 ${monthBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {monthBalance >= 0 ? '+' : ''}₹{monthBalance.toLocaleString()}
                                                </span>
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                            <p className="text-slate-500 text-[10px] italic">
                                Opening Balance (₹{data.opening_balance.toLocaleString()}) + Running Balance (₹{yearlyRunningBalance.toLocaleString()}) = Total Balance (₹{totalBalance.toLocaleString()})
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-slate-950 text-white text-sm border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-slate-950 text-white text-sm border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
                    >
                        <option value="">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => {
                            const m = (i + 1).toString().padStart(2, '0');
                            const name = new Date(2000, i).toLocaleString('default', { month: 'long' });
                            return <option key={m} value={m}>{name}</option>;
                        })}
                    </select>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="bg-slate-950 text-white border border-slate-700 rounded-lg px-2 py-1 focus:outline-none"
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="bg-slate-950 text-white border border-slate-700 rounded-lg px-2 py-1 focus:outline-none"
                        />
                        {(dateRange.start || dateRange.end || selectedMonth) && (
                            <button
                                onClick={() => { setSelectedMonth(''); setDateRange({ start: '', end: '' }); }}
                                className="text-blue-400 hover:text-blue-300 ml-1"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-slate-200 uppercase tracking-wider font-semibold border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Route</th>
                                <th className="px-6 py-4">Driver</th>
                                <th className="px-6 py-4 text-emerald-400">Income</th>
                                <th className="px-6 py-4 text-red-400">Expenses</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredLedger.map((row) => (
                                <React.Fragment key={row._id}>
                                    <tr
                                        onClick={() => toggleRow(row._id)}
                                        className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 font-mono text-slate-300">
                                            {new Date(row.trip_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">{row.trip_route}</td>
                                        <td className="px-6 py-4 font-medium text-slate-300">{row.actual_driver_name || row.driver_id?.name || 'Unknown'}</td>

                                        <td className="px-6 py-4 text-emerald-400 font-medium">
                                            {row.income ? `+${row.income.toLocaleString()}` : '-'}
                                        </td>

                                        <td className="px-6 py-4 text-red-400 font-medium">
                                            {row.total_expenses ? `-${row.total_expenses.toLocaleString()}` : '-'}
                                        </td>

                                        <td className={`px-6 py-4 text-right font-bold font-mono ${row.running_balance < 0 ? 'text-red-500' : 'text-blue-400'}`}>
                                            <div className="flex items-center justify-end gap-2">
                                                ₹{row.running_balance.toLocaleString()}
                                                {expandedRows[row._id] ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-all" />}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => handleEditClick(e, row)}
                                                    className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Edit Trip"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteClick(e, row._id)}
                                                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete Trip"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRows[row._id] && (
                                        <tr className="bg-slate-950/50">
                                            <td colSpan="7" className="px-6 py-4 border-l-2 border-blue-500">
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <div>
                                                        <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Income Details</span>
                                                        <p className="text-white font-medium">Income: ₹{row.income?.toLocaleString() || 0}</p>
                                                    </div>
                                                    <div className="col-span-1 lg:col-span-3">
                                                        <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Expense Details</span>
                                                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                                                            {row.fuel > 0 && <span className="text-xs text-slate-400">Fuel: <span className="text-white">₹{row.fuel.toLocaleString()}</span></span>}
                                                            {row.fasttag > 0 && <span className="text-xs text-slate-400">FastTag: <span className="text-white">₹{row.fasttag.toLocaleString()}</span></span>}
                                                            {row.driver_allowance > 0 && <span className="text-xs text-slate-400">Allowance: <span className="text-white">₹{row.driver_allowance.toLocaleString()}</span></span>}
                                                            {row.service > 0 && <span className="text-xs text-slate-400">Service: <span className="text-white">₹{row.service.toLocaleString()}</span></span>}
                                                            {row.deposit_to_kdr_bank > 0 && <span className="text-xs text-slate-400">Bank Dep: <span className="text-white">₹{row.deposit_to_kdr_bank.toLocaleString()}</span></span>}
                                                            {row.other_expense > 0 && <span className="text-xs text-slate-400">Other: <span className="text-white">₹{row.other_expense.toLocaleString()}</span></span>}
                                                        </div>
                                                    </div>
                                                    {row.notes && (
                                                        <div className="col-span-full mt-2 pt-2 border-t border-slate-800">
                                                            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Notes</span>
                                                            <p className="text-xs text-slate-300 italic">&quot;{row.notes}&quot;</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {filteredLedger.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-600">No trips found for the selected filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingTrip && (
                <EditTripModal
                    trip={editingTrip}
                    onClose={() => setEditingTrip(null)}
                    onUpdate={handleTripUpdate}
                />
            )}
        </div>
    );
}
