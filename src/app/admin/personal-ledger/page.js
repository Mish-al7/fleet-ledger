'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Calendar, Filter, X, Edit2, Trash2 } from 'lucide-react';

export default function PersonalLedgerPage() {
    const [entries, setEntries] = useState([]);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isFiltered, setIsFiltered] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'income',
        amount: ''
    });

    // Fetch entries
    const fetchEntries = async (filterParams = {}) => {
        try {
            setLoading(true);
            let url = '/api/admin-cash-ledger';

            const params = new URLSearchParams();
            if (filterParams.startDate) params.append('startDate', filterParams.startDate);
            if (filterParams.endDate) params.append('endDate', filterParams.endDate);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                setEntries(data.data.entries);
                setCurrentBalance(data.data.currentBalance);
            }
        } catch (error) {
            console.error('Error fetching entries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    // Apply filter
    const handleApplyFilter = () => {
        if (startDate || endDate) {
            fetchEntries({ startDate, endDate });
            setIsFiltered(true);
        }
    };

    // Clear filter
    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        setIsFiltered(false);
        fetchEntries();
    };

    // Handle edit entry
    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setFormData({
            date: new Date(entry.date).toISOString().split('T')[0],
            description: entry.description,
            type: entry.type,
            amount: entry.amount.toString()
        });
        setShowAddModal(true);
    };

    // Handle delete entry
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            return;
        }

        try {
            setDeletingId(id);
            const res = await fetch(`/api/admin-cash-ledger/${id}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (data.success) {
                // Refresh entries
                if (isFiltered) {
                    fetchEntries({ startDate, endDate });
                } else {
                    fetchEntries();
                }
            } else {
                alert(data.error || 'Failed to delete entry');
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Failed to delete entry');
        } finally {
            setDeletingId(null);
        }
    };

    // Handle form submit (Create or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let res;

            if (editingEntry) {
                // Update existing entry
                res = await fetch(`/api/admin-cash-ledger/${editingEntry._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new entry
                res = await fetch('/api/admin-cash-ledger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            const data = await res.json();

            if (data.success) {
                setShowAddModal(false);
                setEditingEntry(null);
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    type: 'income',
                    amount: ''
                });

                // Show warning if updating
                if (editingEntry && data.warning) {
                    alert(data.warning);
                }

                // Refresh entries
                if (isFiltered) {
                    fetchEntries({ startDate, endDate });
                } else {
                    fetchEntries();
                }
            } else {
                alert(data.error || `Failed to ${editingEntry ? 'update' : 'add'} entry`);
            }
        } catch (error) {
            console.error(`Error ${editingEntry ? 'updating' : 'adding'} entry:`, error);
            alert(`Failed to ${editingEntry ? 'update' : 'add'} entry`);
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingEntry(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            type: 'income',
            amount: ''
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Personal Cash Ledger</h1>
                <p className="text-slate-400">Track your personal income and expenses</p>
            </div>

            {/* Current Balance Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 mb-6 shadow-lg">
                <p className="text-blue-100 text-xs font-medium mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-white">
                    Rs {currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
                {/* Add Entry Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow"
                >
                    <PlusCircle size={18} />
                    Add Entry
                </button>

                {/* Filter Section */}
                <div className="flex flex-col md:flex-row gap-2 flex-1">
                    <div className="flex items-center gap-2 flex-1">
                        <Calendar size={16} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Start Date"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                        <Calendar size={16} className="text-slate-400" />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="End Date"
                        />
                    </div>
                    <button
                        onClick={handleApplyFilter}
                        className="px-4 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <Filter size={16} />
                        Apply Filter
                    </button>
                    {isFiltered && (
                        <button
                            onClick={handleClearFilter}
                            className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <X size={16} />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Income
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Expense
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Running Balance
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                        No entries found. Add your first entry to get started.
                                    </td>
                                </tr>
                            ) : (
                                // Sort entries for display: newest first (date DESC, createdAt DESC)
                                // Note: This is display-only. Running balances remain correct as calculated.
                                [...entries]
                                    .sort((a, b) => {
                                        const dateA = new Date(a.date);
                                        const dateB = new Date(b.date);

                                        // First sort by date (newest first)
                                        if (dateB.getTime() !== dateA.getTime()) {
                                            return dateB.getTime() - dateA.getTime();
                                        }

                                        // If same date, sort by createdAt (newest first)
                                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                                    })
                                    .map((entry) => (
                                        <tr key={entry._id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {new Date(entry.date).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white">
                                                {entry.description}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-green-400 font-medium">
                                                {entry.type === 'income'
                                                    ? `+${entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-red-400 font-medium">
                                                {entry.type === 'expense'
                                                    ? `-${entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-blue-400 font-bold font-mono">
                                                ₹{entry.running_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(entry)}
                                                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="Edit entry"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(entry._id)}
                                                        disabled={deletingId === entry._id}
                                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Delete entry"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Entry Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-800">
                        <div className="p-6 border-b border-slate-800">
                            <h2 className="text-2xl font-bold text-white">{editingEntry ? 'Edit Entry' : 'Add Entry'}</h2>
                            <p className="text-slate-400 text-sm mt-1">{editingEntry ? 'Update income or expense details' : 'Record a new income or expense'}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Date <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Description <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Office supplies, Client payment"
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Type <span className="text-red-400">*</span>
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="income"
                                            checked={formData.type === 'income'}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-white">Income</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="expense"
                                            checked={formData.type === 'expense'}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-white">Expense</span>
                                    </label>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Amount (Rs) <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                                >
                                    {editingEntry ? 'Update Entry' : 'Add Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
