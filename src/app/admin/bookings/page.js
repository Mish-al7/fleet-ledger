'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Car, FileText, Eye, Check, X, Filter, ChevronDown } from 'lucide-react';

// Status Badge Component
const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    const labels = {
        pending: '🟡 Pending',
        approved: '🟢 Approved',
        rejected: '🔴 Rejected',
    };

    return (
        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

// Booking Detail Modal
const BookingDetailModal = ({ booking, onClose, onApprove, onReject, actionLoading }) => {
    if (!booking) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Booking Details</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-white">{booking.booking_no}</span>
                        <StatusBadge status={booking.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Vehicle */}
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <h3 className="text-sm font-medium text-blue-400 mb-3">Vehicle</h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-slate-500">Number:</span> <span className="text-white font-medium">{booking.vehicle_no}</span></div>
                                <div><span className="text-slate-500">Type:</span> <span className="text-white">{booking.vehicle_type || '-'}</span></div>
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <h3 className="text-sm font-medium text-emerald-400 mb-3">Customer</h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-slate-500">Name:</span> <span className="text-white">{booking.customer_name}</span></div>
                                <div><span className="text-slate-500">Phone:</span> <span className="text-white">{booking.customer_phone}</span></div>
                                <div><span className="text-slate-500">Address:</span> <span className="text-white">{booking.customer_address || '-'}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Trip */}
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-purple-400 mb-3">Trip Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-slate-500">Pickup:</span> <span className="text-white">{booking.pickup_location}</span></div>
                            <div><span className="text-slate-500">Destination:</span> <span className="text-white">{booking.trip_destination}</span></div>
                            <div><span className="text-slate-500">Persons:</span> <span className="text-white">{booking.total_persons}</span></div>
                            <div><span className="text-slate-500">Night Halts:</span> <span className="text-white">{booking.night_halt_places || '-'}</span></div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-amber-400 mb-3">Schedule</h3>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div><span className="text-slate-500">Start Date:</span><br /><span className="text-white">{new Date(booking.journey_start_date).toLocaleDateString()}</span></div>
                            <div><span className="text-slate-500">Return Date:</span><br /><span className="text-white">{new Date(booking.journey_return_date).toLocaleDateString()}</span></div>
                            <div><span className="text-slate-500">Time:</span><br /><span className="text-white">{booking.trip_start_time} - {booking.trip_end_time}</span></div>
                            <div><span className="text-slate-500">Days / KM:</span><br /><span className="text-white">{booking.total_days} days / {booking.total_kilometers || 0} km</span></div>
                        </div>
                    </div>

                    {/* Financials */}
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-green-400 mb-3">Financials</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-slate-500">Advance:</span> <span className="text-white">₹ {booking.advance_amount || 0}</span></div>
                            <div><span className="text-slate-500">Total Amount:</span> <span className="text-white font-bold text-lg">₹ {booking.total_amount || 0}</span></div>
                            <div><span className="text-slate-500">Other Expenses:</span> <span className="text-white">{booking.other_expenses || '-'}</span></div>
                            <div><span className="text-slate-500">Driver F&A:</span> <span className="text-white">{booking.driver_food_accommodation || '-'}</span></div>
                        </div>
                    </div>

                    {/* Created By */}
                    <div className="text-xs text-slate-500">
                        Created by: {booking.created_by?.name || 'Unknown'} on {new Date(booking.createdAt).toLocaleString()}
                    </div>

                    {/* Action Buttons (only for pending) */}
                    {booking.status === 'pending' && (
                        <div className="flex gap-4 pt-4 border-t border-slate-800">
                            <button
                                onClick={() => onApprove(booking._id)}
                                disabled={actionLoading}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <Check size={20} />
                                Approve Booking
                            </button>
                            <button
                                onClick={() => onReject(booking._id)}
                                disabled={actionLoading}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <X size={20} />
                                Reject Booking
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [vehicleFilter, setVehicleFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        fetchBookings();
        fetchVehicles();
    }, [statusFilter, vehicleFilter, dateFrom, dateTo]);

    async function fetchVehicles() {
        try {
            const res = await fetch('/api/vehicles');
            const json = await res.json();
            if (json.success) {
                setVehicles(json.data);
            }
        } catch (err) {
            console.error('Failed to fetch vehicles', err);
        }
    }

    async function fetchBookings() {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (vehicleFilter) params.append('vehicle_id', vehicleFilter);
            if (dateFrom) params.append('start_date', dateFrom);
            if (dateTo) params.append('end_date', dateTo);

            const res = await fetch(`/api/bookings?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setBookings(json.data);
            } else {
                setError(json.error || 'Failed to fetch bookings');
            }
        } catch (err) {
            setError('Failed to load bookings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(bookingId, newStatus) {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to update status');
            }

            // Refresh bookings
            fetchBookings();
            setSelectedBooking(null);
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Bookings</h1>
                <p className="text-slate-400 text-sm mt-1">Manage vehicle reservations</p>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <Filter size={16} />
                    <span className="text-sm font-medium">Filters</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Status */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Vehicle */}
                    <div className="relative">
                        <select
                            value={vehicleFilter}
                            onChange={(e) => setVehicleFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Vehicles</option>
                            {vehicles.map(v => (
                                <option key={v._id} value={v._id}>{v.vehicle_no}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Date From */}
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        placeholder="From Date"
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Date To */}
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        placeholder="To Date"
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Bookings Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading bookings...</div>
                ) : bookings.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText size={48} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500">No bookings found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800/50 border-b border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-slate-400 font-medium">Booking #</th>
                                    <th className="px-4 py-3 text-left text-slate-400 font-medium">Vehicle</th>
                                    <th className="px-4 py-3 text-left text-slate-400 font-medium">Customer</th>
                                    <th className="px-4 py-3 text-left text-slate-400 font-medium">Route</th>
                                    <th className="px-4 py-3 text-left text-slate-400 font-medium">Dates</th>
                                    <th className="px-4 py-3 text-left text-slate-400 font-medium">Status</th>
                                    <th className="px-4 py-3 text-center text-slate-400 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {bookings.map(booking => (
                                    <tr key={booking._id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 text-white font-medium">{booking.booking_no}</td>
                                        <td className="px-4 py-3 text-slate-300">{booking.vehicle_no}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-white">{booking.customer_name}</div>
                                            <div className="text-xs text-slate-500">{booking.customer_phone}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">
                                            {booking.pickup_location} → {booking.trip_destination}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300 text-xs">
                                            {new Date(booking.journey_start_date).toLocaleDateString()} - {new Date(booking.journey_return_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(booking._id, 'approved')}
                                                            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                            title="Approve"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(booking._id, 'rejected')}
                                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onApprove={(id) => handleStatusChange(id, 'approved')}
                    onReject={(id) => handleStatusChange(id, 'rejected')}
                    actionLoading={actionLoading}
                />
            )}
        </div>
    );
}
