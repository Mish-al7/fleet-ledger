'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, Truck } from 'lucide-react';

export default function ProcessDuesModal({ onClose, onProcessed }) {
    const [dues, setDues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDues();
    }, []);

    const fetchDues = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/expenses/pending-dues');
            const json = await res.json();
            if (json.success) {
                setDues(json.data);
                // Select all by default
                setSelectedIds(new Set(json.data.map((_, index) => index)));
            } else {
                setError(json.error);
            }
        } catch (err) {
            setError('Failed to fetch pending dues');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (index) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedIds(newSelected);
    };

    const handleProcess = async () => {
        if (selectedIds.size === 0) return;

        try {
            setProcessing(true);
            const selectedItems = Array.from(selectedIds).map(index => ({
                masterId: dues[index].masterId,
                dueDate: dues[index].dueDate
            }));

            const res = await fetch('/api/admin/expenses/process-recurring', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedDues: selectedItems })
            });

            const json = await res.json();
            if (json.success) {
                onProcessed(json.processed);
                onClose();
            } else {
                setError(json.error);
            }
        } catch (err) {
            setError('Failed to process dues');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Process Pending Dues</h3>
                            <p className="text-sm text-slate-400">Review and select recurring expenses to post to ledger</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4 text-slate-500">
                            <Loader2 className="animate-spin" size={40} />
                            <p>Calculating pending dues...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                            <AlertCircle size={20} />
                            <p>{error}</p>
                        </div>
                    ) : dues.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500 text-lg">No pending dues found.</p>
                            <p className="text-slate-600 text-sm mt-1">All recurring expenses are up to date.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <p className="text-sm font-medium text-slate-400">
                                    {selectedIds.size} of {dues.length} instances selected
                                </p>
                                <button
                                    onClick={() => setSelectedIds(selectedIds.size === dues.length ? new Set() : new Set(dues.map((_, i) => i)))}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                                >
                                    {selectedIds.size === dues.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            <div className="border border-slate-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 uppercase tracking-wider text-[11px]">
                                        <tr>
                                            <th className="px-4 py-3 w-10"></th>
                                            <th className="px-4 py-3">Due Date</th>
                                            <th className="px-4 py-3">Expense</th>
                                            <th className="px-4 py-3">Vehicle</th>
                                            <th className="px-4 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {dues.map((due, index) => (
                                            <tr
                                                key={`${due.masterId}-${due.dueDate}`}
                                                className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${selectedIds.has(index) ? 'bg-blue-500/5' : ''}`}
                                                onClick={() => toggleSelect(index)}
                                            >
                                                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(index)}
                                                        onChange={() => toggleSelect(index)}
                                                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/20"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 font-mono text-slate-300">
                                                    {new Date(due.dueDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-white font-medium">{due.expense_type}</p>
                                                    <p className="text-xs text-slate-500 italic truncate max-w-[150px]">{due.description}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {due.vehicle_no !== 'Company Level' ? (
                                                        <span className="inline-flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded text-xs text-blue-300 border border-blue-500/20">
                                                            <Truck size={12} />
                                                            {due.vehicle_no}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs">Company</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right text-emerald-400 font-bold">
                                                    ₹{due.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={selectedIds.size === 0 || processing}
                        onClick={handleProcess}
                        className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={20} />
                                Process {selectedIds.size} Selected {selectedIds.size === 1 ? 'Due' : 'Dues'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
