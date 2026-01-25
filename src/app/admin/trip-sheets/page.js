'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Download, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TripSheetsPage() {
    const [tripSheets, setTripSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        vehicleReg: '',
        guestName: '',
    });

    const router = useRouter();

    useEffect(() => {
        fetchTripSheets();
    }, []);

    const fetchTripSheets = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams(filters);
            // Remove empty filters
            for (const key of queryParams.keys()) {
                if (!queryParams.get(key)) {
                    queryParams.delete(key);
                }
            }

            const res = await fetch(`/api/trip-sheets?${queryParams.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTripSheets(data);
            }
        } catch (error) {
            console.error('Failed to fetch trip sheets', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = (e) => {
        e.preventDefault();
        fetchTripSheets();
    };

    const handleDownload = async (e, id, no) => {
        e.preventDefault();
        e.stopPropagation();
        // Trigger download
        window.open(`/api/trip-sheets/${id}/pdf`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Trip Sheets</h1>
                    <p className="text-slate-400">Manage guest and customer trip sheets</p>
                </div>
                <Link
                    href="/admin/trip-sheets/new"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                    <Plus size={20} />
                    Create New Trip Sheet
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">From Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">To Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Vehicle Reg No</label>
                        <input
                            type="text"
                            name="vehicleReg"
                            value={filters.vehicleReg}
                            onChange={handleFilterChange}
                            placeholder="e.g. KL-13-AB..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Guest Name</label>
                        <input
                            type="text"
                            name="guestName"
                            value={filters.guestName}
                            onChange={handleFilterChange}
                            placeholder="Guest Name"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-slate-700 h-[38px]"
                    >
                        <Search size={16} />
                        Filter
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-950 border-b border-slate-800">
                                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">No</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Guest</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Vehicle</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Driver</th>
                                <th className="text-right px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Bill Amount</th>
                                <th className="text-right px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">Loading trip sheets...</td>
                                </tr>
                            ) : tripSheets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">No trip sheets found</td>
                                </tr>
                            ) : (
                                tripSheets.map((sheet) => (
                                    <tr
                                        key={sheet._id}
                                        onClick={() => router.push(`/admin/trip-sheets/${sheet._id}`)}
                                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {sheet.trip_sheet_no}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            {new Date(sheet.trip_sheet_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {sheet.guest_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {sheet.vehicle_reg_no || '-'}
                                            <span className="block text-xs text-slate-500">{sheet.vehicle_type}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            {sheet.driver_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-400 text-right font-medium">
                                            {sheet.total_bill_amount ? `₹${sheet.total_bill_amount.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => handleDownload(e, sheet._id, sheet.trip_sheet_no)}
                                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Download PDF"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                <Link
                                                    href={`/admin/trip-sheets/${sheet._id}`}
                                                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
