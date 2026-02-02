'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, RefreshCw, Edit2, Trash2, PauseCircle, PlayCircle, Wallet, Calendar, Truck } from 'lucide-react';
import AddExpenseModal from '@/components/admin/expenses/AddExpenseModal';
import ProcessDuesModal from '@/components/admin/expenses/ProcessDuesModal';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Filters
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterFrequency, setFilterFrequency] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [showDuesModal, setShowDuesModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [filterVehicle, filterFrequency]);

    async function fetchInitialData() {
        try {
            const [vRes, eRes] = await Promise.all([
                fetch('/api/vehicles'),
                fetch('/api/admin/expenses')
            ]);
            const vJson = await vRes.json();
            const eJson = await eRes.json();

            if (vJson.success) setVehicles(vJson.data);
            if (eJson.success) setExpenses(eJson.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchExpenses() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterVehicle) params.append('vehicle_id', filterVehicle);
            if (filterFrequency) params.append('frequency', filterFrequency);

            const res = await fetch(`/api/admin/expenses?${params.toString()}`);
            const json = await res.json();
            if (json.success) setExpenses(json.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(data) {
        try {
            const method = editingExpense ? 'PUT' : 'POST';
            const url = editingExpense
                ? `/api/admin/expenses/${editingExpense._id}`
                : '/api/admin/expenses';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error);

            setShowModal(false);
            setEditingExpense(null);
            fetchExpenses();
        } catch (error) {
            alert('Error saving expense: ' + error.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' });
            fetchExpenses();
        } catch (error) {
            console.error(error);
        }
    }

    const handleProcessRecurring = () => {
        setShowDuesModal(true);
    };

    const handleDuesProcessed = (count) => {
        alert(`Successfully processed ${count} expense instances.`);
        fetchExpenses();
        setShowDuesModal(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Wallet className="text-blue-400" />
                        Admin Expenses
                    </h1>
                    <p className="text-slate-400 text-sm">Manage recurring payments and misc. ledger entries</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleProcessRecurring}
                        disabled={processing}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw size={18} className={processing ? 'animate-spin' : ''} />
                        {processing ? 'Processing...' : 'Process Due'}
                    </button>
                    <button
                        onClick={() => { setEditingExpense(null); setShowModal(true); }}
                        className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400">
                    <Filter size={16} />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                <select
                    value={filterVehicle}
                    onChange={(e) => setFilterVehicle(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">All Vehicles</option>
                    <option value="null">Company Level (No Vehicle)</option>
                    {vehicles.map(v => (
                        <option key={v._id} value={v._id}>{v.vehicle_no || v.registration_number}</option>
                    ))}
                </select>

                <select
                    value={filterFrequency}
                    onChange={(e) => setFilterFrequency(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">All Frequencies</option>
                    <option value="One-time">One-time</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                </select>
            </div>

            {/* Expenses Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-sm uppercase">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Type / Description</th>
                                <th className="p-4 font-medium">Vehicle</th>
                                <th className="p-4 font-medium">Amount</th>
                                <th className="p-4 font-medium">Frequency</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">Loading...</td>
                                </tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">No expenses found.</td>
                                </tr>
                            ) : (
                                expenses.map(expense => (
                                    <tr key={expense._id} className="group hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 text-slate-300 whitespace-nowrap">
                                            {new Date(expense.start_date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{expense.expense_type}</span>
                                                <span className="text-slate-500 text-xs">{expense.description}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300">
                                            {expense.vehicle_id ? (
                                                <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-xs text-blue-300 border border-blue-500/20">
                                                    <Truck size={12} />
                                                    {expense.vehicle_id.vehicle_no || 'Unknown'}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600 text-xs italic">Company Level</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-bold text-white">
                                            ₹{expense.amount.toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded-full border ${expense.frequency === 'One-time'
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                }`}>
                                                {expense.frequency}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${expense.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                                                expense.status === 'Paused' ? 'bg-yellow-500/10 text-yellow-400' :
                                                    'bg-slate-700 text-slate-400'
                                                }`}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setEditingExpense(expense); setShowModal(true); }}
                                                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense._id)}
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
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

            {showModal && (
                <AddExpenseModal
                    initialData={editingExpense}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                    vehicles={vehicles}
                />
            )}
            {showDuesModal && (
                <ProcessDuesModal
                    onClose={() => setShowDuesModal(false)}
                    onProcessed={handleDuesProcessed}
                />
            )}
        </div>
    );
}
