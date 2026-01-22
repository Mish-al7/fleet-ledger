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

    const fetchLedger = useCallback(async () => {
        try {
            const res = await fetch(`/api/ledger/${vehicleId}`);
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [vehicleId]);

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

    if (loading) return <div className="p-6 text-slate-500">Loading ledger...</div>;
    if (!data) return <div className="p-6 text-red-400">Failed to load data</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/ledger" className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {data.vehicle ? data.vehicle.vehicle_no : 'Vehicle Ledger'}
                    </h1>
                    <p className="text-slate-400 text-sm">Opening Balance: <span className="text-white font-mono">₹{data.opening_balance.toLocaleString()}</span></p>
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
                            {data.ledger.map((row) => (
                                <React.Fragment key={row._id}>
                                    <tr
                                        onClick={() => toggleRow(row._id)}
                                        className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 font-mono text-slate-300">
                                            {new Date(row.trip_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">{row.trip_route}</td>
                                        <td className="px-6 py-4 font-medium text-slate-300">{row.driver_id?.name || 'Unknown'}</td>

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
                                                        <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Income Breakdown</span>
                                                        <p className="text-white font-medium">Income: ₹{row.income?.toLocaleString() || 0}</p>
                                                    </div>
                                                    <div className="col-span-1 lg:col-span-3">
                                                        <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Expense Breakdown</span>
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
                            {data.ledger.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-600">No trips found for this vehicle.</td>
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
