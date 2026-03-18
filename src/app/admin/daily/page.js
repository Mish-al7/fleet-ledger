'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Wallet, FileText, Truck, CalendarCheck, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

export default function DailyDashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Default to today in YYYY-MM-DD local
    const getTodayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const initialDate = searchParams.get('date') || getTodayStr();

    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Watch URL param sync to state
    useEffect(() => {
        const paramDate = searchParams.get('date');
        if (paramDate && paramDate !== selectedDate) {
            setSelectedDate(paramDate);
        } else if (!paramDate && selectedDate !== getTodayStr()) {
            // If URL loses query param, enforce today
            handleDateChange(getTodayStr());
        }
    }, [searchParams, selectedDate]);

    const fetchDailyData = useCallback(async (dateStr) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/daily?date=${dateStr}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            } else {
                setError(json.error || 'Failed to fetch daily data');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDailyData(selectedDate);
    }, [selectedDate, fetchDailyData]);

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
        router.push(`/admin/daily?date=${newDate}`);
    };

    const getYesterdayStr = () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const getDayBeforeYesterdayStr = () => {
        const d = new Date();
        d.setDate(d.getDate() - 2);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    if (loading && !data) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const summary = data?.summary || {};
    const lists = data?.lists || {
        tripsToday: [],
        adminExpensesPostedToday: [],
        bookingsCreatedToday: [],
        vehicleLedgerEntriesToday: []
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CalendarIcon className="text-emerald-400" />
                        Daily Dashboard
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Snapshot for {formatDate(selectedDate) || selectedDate}</p>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                    <button
                        onClick={() => handleDateChange(getTodayStr())}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDate === getTodayStr()
                                ? 'bg-emerald-600 border border-emerald-500 text-white shadow shadow-emerald-500/20'
                                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                            }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => handleDateChange(getYesterdayStr())}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDate === getYesterdayStr()
                                ? 'bg-emerald-600 border border-emerald-500 text-white shadow shadow-emerald-500/20'
                                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                            }`}
                    >
                        Yesterday
                    </button>
                    <button
                        onClick={() => handleDateChange(getDayBeforeYesterdayStr())}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDate === getDayBeforeYesterdayStr()
                                ? 'bg-emerald-600 border border-emerald-500 text-white shadow shadow-emerald-500/20'
                                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                            }`}
                    >
                        Day Before
                    </button>
                    <div className="relative flex items-center border border-slate-700 rounded-lg overflow-hidden focus-within:border-emerald-500 transition-colors">
                        <div className="pl-3 pr-2 py-2 bg-slate-800 flex items-center justify-center border-r border-slate-700">
                            <CalendarIcon size={16} className="text-slate-400" />
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="bg-slate-800 text-white text-sm px-3 py-2 outline-none w-[130px] cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">Trip Income</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{summary.totalTripIncome?.toLocaleString() || 0}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                            <TrendingDown size={20} />
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">Trip Expense</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{summary.totalTripExpense?.toLocaleString() || 0}</p>
                </div>



                <div className={`col-span-1 md:col-span-2 lg:col-span-2 border rounded-xl p-5 transition-all ${summary.netMovementForTheDay >= 0 ? 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40' : 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${summary.netMovementForTheDay >= 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            <DollarSign size={20} />
                        </div>
                        <h3 className={`text-sm font-medium ${summary.netMovementForTheDay >= 0 ? 'text-blue-200' : 'text-rose-200'}`}>Net Movement</h3>
                    </div>
                    <p className={`text-2xl font-bold ${summary.netMovementForTheDay >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                        {summary.netMovementForTheDay >= 0 ? '+' : ''}₹{summary.netMovementForTheDay?.toLocaleString() || 0}
                    </p>
                </div>
            </div>

            {/* Content Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Trips */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 sticky top-0">
                        <div className="flex items-center gap-2">
                            <Truck size={18} className="text-emerald-400" />
                            <h3 className="font-bold text-white">Trips</h3>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
                            {lists.tripsToday.length} entries
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {lists.tripsToday.map(trip => (
                            <div key={trip._id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-white">{trip.trip_route || 'Unknown Route'}</span>
                                    <span className={`text-xs font-bold ${trip.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {trip.profit >= 0 ? '+' : ''}₹{(trip.profit || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Truck size={12} /> {trip.vehicle_id?.vehicle_no || 'Unknown'}{trip.vehicle_id?.nickname ? ` (${trip.vehicle_id.nickname})` : ''}
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="text-emerald-400/80">I: ₹{(trip.income || 0).toLocaleString()}</span>
                                        <span className="text-red-400/80">E: ₹{(trip.total_expenses || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {lists.tripsToday.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <Truck size={32} className="opacity-20 mb-2" />
                                <p className="text-sm">No trips on this date.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ledger Entries */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 sticky top-0">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-blue-400" />
                            <h3 className="font-bold text-white">Vehicle Ledger Entries</h3>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
                            {lists.vehicleLedgerEntriesToday.length} entries
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {lists.vehicleLedgerEntriesToday.map(entry => (
                            <div key={entry._id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-sm font-medium text-white">
                                        {entry.vehicle_id?.vehicle_no || 'Unknown'}{entry.vehicle_id?.nickname ? ` (${entry.vehicle_id.nickname})` : ''} - {entry.trip_route || 'Unknown Route'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-2 text-xs">
                                    <span className="text-slate-500">Income: <span className="text-emerald-400">₹{(entry.income || 0).toLocaleString()}</span></span>
                                    <span className="text-slate-500">Expense: <span className="text-red-400">₹{(entry.total_expenses || 0).toLocaleString()}</span></span>
                                    <span className="text-slate-400 font-mono">Bal: ₹{(entry.running_balance || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                        {lists.vehicleLedgerEntriesToday.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <FileText size={32} className="opacity-20 mb-2" />
                                <p className="text-sm">No ledger entries on this date.</p>
                            </div>
                        )}
                    </div>
                </div>



                {/* Bookings */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 sticky top-0">
                        <div className="flex items-center gap-2">
                            <CalendarCheck size={18} className="text-purple-400" />
                            <h3 className="font-bold text-white">Bookings Created</h3>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
                            {lists.bookingsCreatedToday.length} entries
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {lists.bookingsCreatedToday.map(booking => (
                            <div key={booking._id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-sm font-medium text-white">{booking.booking_no}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{booking.customer_name}</div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${booking.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                            booking.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                'bg-amber-500/20 text-amber-400'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 border-t border-slate-800/50 pt-2 flex justify-between">
                                    <span>Route: {booking.trip_destination}</span>
                                    <span className="text-emerald-400/80 font-medium">₹{(booking.total_amount || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                        {lists.bookingsCreatedToday.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <CalendarCheck size={32} className="opacity-20 mb-2" />
                                <p className="text-sm">No bookings created on this date.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
