'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function DashboardPage() {
    const router = useRouter();
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [availableMonths, setAvailableMonths] = useState([]);

    useEffect(() => {
        fetchSummary();
    }, [selectedMonth]);

    async function fetchSummary() {
        try {
            const url = selectedMonth === 'all'
                ? '/api/summary/monthly'
                : `/api/summary/monthly?month=${selectedMonth}`;

            const res = await fetch(url);
            const json = await res.json();

            if (json.success) {
                setSummary(json.data);
                setAvailableMonths(json.availableMonths || []);

                // If no month is selected yet (and not explicitly 'all'), 
                // default to the most recent month if available
                if (selectedMonth === 'all' && json.availableMonths?.length > 0 && !sessionStorage.getItem('summary_filter_initialized')) {
                    setSelectedMonth(json.availableMonths[0]);
                    sessionStorage.setItem('summary_filter_initialized', 'true');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const formatMonth = (monthStr) => {
        if (!monthStr || monthStr === 'all') return 'All Time';
        const [year, month] = monthStr.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    };

    // Calculate KPIs
    const totalIncome = summary.reduce((sum, item) => sum + item.total_income, 0);
    const totalExpenses = summary.reduce((sum, item) => sum + item.total_expenses, 0);
    const totalProfit = totalIncome - totalExpenses;

    // Prepare aggregated chart data (one entry per vehicle)
    const chartData = summary.reduce((acc, item) => {
        const existing = acc.find(v => v.vehicleId === item.vehicle_id);
        if (existing) {
            existing.income += item.total_income;
            existing.expenses += item.total_expenses;
            existing.profit += item.profit;
        } else {
            acc.push({
                vehicle: item.vehicle_no,
                vehicleId: item.vehicle_id,
                income: item.total_income,
                expenses: item.total_expenses,
                profit: item.profit
            });
        }
        return acc;
    }, []);

    const handleBarClick = (data) => {
        if (data && data.vehicleId) {
            router.push(`/admin/ledger/${data.vehicleId}`);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Fleet Performance Overview</p>
                </div>

                {/* Monthly Pill Filter */}
                <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                    <button
                        onClick={() => setSelectedMonth('all')}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${selectedMonth === 'all'
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                    >
                        All Time
                    </button>

                    {/* Recent Months (Top 4) */}
                    {availableMonths.slice(0, 4).map(month => (
                        <button
                            key={month}
                            onClick={() => setSelectedMonth(month)}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${selectedMonth === month
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                        >
                            {formatMonth(month)}
                        </button>
                    ))}

                    {/* Active "Other" Month Pill (if selected via dropdown and not in top 4) */}
                    {selectedMonth !== 'all' && !availableMonths.slice(0, 4).includes(selectedMonth) && (
                        <button
                            className="px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                        >
                            {formatMonth(selectedMonth)}
                        </button>
                    )}

                    {/* History Dropdown */}
                    {availableMonths.length > 0 && (
                        <div className="relative flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-2 hover:border-slate-700 transition-all">
                            <Calendar size={14} className="text-slate-500" />
                            <select
                                value={availableMonths.includes(selectedMonth) ? selectedMonth : 'history'}
                                onChange={(e) => {
                                    if (e.target.value !== 'history') {
                                        setSelectedMonth(e.target.value);
                                    }
                                }}
                                className="bg-transparent text-sm font-medium text-slate-400 outline-none cursor-pointer appearance-none pr-4"
                            >
                                <option value="history" disabled>History</option>
                                {availableMonths.map(month => (
                                    <option key={month} value={month} className="bg-slate-900 text-white">
                                        {formatMonth(month)}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 pointer-events-none">
                                <Filter size={10} className="text-slate-500" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <TrendingUp className="text-emerald-400" size={24} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Total Income</span>
                    </div>
                    <p className="text-3xl font-bold text-white">₹{totalIncome.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <TrendingDown className="text-red-400" size={24} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Total Expenses</span>
                    </div>
                    <p className="text-3xl font-bold text-white">₹{totalExpenses.toLocaleString()}</p>
                </div>

                <div className={`bg-gradient-to-br ${totalProfit >= 0 ? 'from-blue-500/10 to-blue-600/5 border-blue-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'} border rounded-xl p-6`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 ${totalProfit >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'} rounded-lg`}>
                            <DollarSign className={totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'} size={24} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Net Profit</span>
                    </div>
                    <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {totalProfit >= 0 ? '+' : ''}₹{totalProfit.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Profit per Vehicle */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Profit by Vehicle</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} onClick={(e) => e?.activePayload && handleBarClick(e.activePayload[0].payload)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="vehicle" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#e2e8f0' }}
                            />
                            <Bar dataKey="profit" fill="#3b82f6" radius={[8, 8, 0, 0]} cursor="pointer" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Income vs Expenses */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Income vs Expenses</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="vehicle" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#e2e8f0' }}
                            />
                            <Legend />
                            <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Monthly Trend (if multiple months) */}
            {selectedMonth === 'all' && availableMonths.length > 1 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Monthly Profit Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={summary.reduce((acc, item) => {
                            const existing = acc.find(a => a.month === item.month);
                            if (existing) {
                                existing.profit += item.profit;
                            } else {
                                acc.push({ month: item.month, profit: item.profit });
                            }
                            return acc;
                        }, []).sort((a, b) => a.month.localeCompare(b.month))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#e2e8f0' }}
                            />
                            <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {summary.length === 0 && (
                <div className="text-center py-12 text-slate-600 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                    No data available for the selected period.
                </div>
            )}
        </div>
    );
}
