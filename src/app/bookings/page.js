'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import { Calendar, MapPin, Clock, Car, FileText, Eye } from 'lucide-react';

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
        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

// Booking Card Component
const BookingCard = ({ booking, onViewDetails }) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between">
            <div>
                <div className="text-sm font-medium text-white">{booking.booking_no}</div>
                <div className="text-xs text-slate-500">{new Date(booking.booking_date).toLocaleDateString()}</div>
            </div>
            <StatusBadge status={booking.status} />
        </div>

        <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
                <Car size={14} />
                <span>{booking.vehicle_no}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
                <MapPin size={14} />
                <span className="truncate">{booking.pickup_location} → {booking.trip_destination}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
                <Calendar size={14} />
                <span>
                    {new Date(booking.journey_start_date).toLocaleDateString()} - {new Date(booking.journey_return_date).toLocaleDateString()}
                </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
                <Clock size={14} />
                <span>{booking.trip_start_time} - {booking.trip_end_time}</span>
            </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <div className="text-xs text-slate-500">
                Customer: <span className="text-slate-300">{booking.customer_name}</span>
            </div>
            <button
                onClick={() => onViewDetails(booking)}
                className="text-blue-400 text-xs font-medium hover:text-blue-300 flex items-center gap-1"
            >
                <Eye size={14} /> View
            </button>
        </div>
    </div>
);

// Detail Modal Component
const BookingDetailModal = ({ booking, onClose }) => {
    if (!booking) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Booking Details</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-white">{booking.booking_no}</span>
                        <StatusBadge status={booking.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-slate-500">Vehicle</div>
                            <div className="text-white font-medium">{booking.vehicle_no}</div>
                        </div>
                        <div>
                            <div className="text-slate-500">Vehicle Type</div>
                            <div className="text-white">{booking.vehicle_type || '-'}</div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                        <h3 className="text-sm font-medium text-emerald-400 mb-2">Customer</h3>
                        <div className="space-y-1 text-sm">
                            <div><span className="text-slate-500">Name:</span> <span className="text-white">{booking.customer_name}</span></div>
                            <div><span className="text-slate-500">Phone:</span> <span className="text-white">{booking.customer_phone}</span></div>
                            <div><span className="text-slate-500">Address:</span> <span className="text-white">{booking.customer_address || '-'}</span></div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                        <h3 className="text-sm font-medium text-purple-400 mb-2">Trip</h3>
                        <div className="space-y-1 text-sm">
                            <div><span className="text-slate-500">Pickup:</span> <span className="text-white">{booking.pickup_location}</span></div>
                            <div><span className="text-slate-500">Destination:</span> <span className="text-white">{booking.trip_destination}</span></div>
                            <div><span className="text-slate-500">Persons:</span> <span className="text-white">{booking.total_persons}</span></div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                        <h3 className="text-sm font-medium text-amber-400 mb-2">Schedule</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-slate-500">Start:</span> <span className="text-white">{new Date(booking.journey_start_date).toLocaleDateString()}</span></div>
                            <div><span className="text-slate-500">Return:</span> <span className="text-white">{new Date(booking.journey_return_date).toLocaleDateString()}</span></div>
                            <div><span className="text-slate-500">Time:</span> <span className="text-white">{booking.trip_start_time} - {booking.trip_end_time}</span></div>
                            <div><span className="text-slate-500">Days:</span> <span className="text-white">{booking.total_days}</span></div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                        <h3 className="text-sm font-medium text-green-400 mb-2">Financials</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-slate-500">Advance:</span> <span className="text-white">Rs {booking.advance_amount || 0}</span></div>
                            <div><span className="text-slate-500">Total:</span> <span className="text-white font-bold">Rs {booking.total_amount || 0}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    async function fetchBookings() {
        setLoading(true);
        setError('');
        try {
            const url = statusFilter === 'all'
                ? '/api/bookings'
                : `/api/bookings?status=${statusFilter}`;

            const res = await fetch(url);
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

    const filteredBookings = bookings;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
            {/* Header */}
            <div className="bg-slate-900 pt-8 pb-6 px-6 shadow-lg border-b border-slate-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                    My Bookings
                </h1>
                <p className="text-slate-400 text-sm mt-1">View your vehicle reservations</p>
            </div>

            <main className="max-w-lg mx-auto px-6 py-6">
                {/* Status Filter Pills */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {['all', 'pending', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${statusFilter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center text-slate-400 py-12">Loading bookings...</div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText size={48} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500">No bookings found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map(booking => (
                            <BookingCard
                                key={booking._id}
                                booking={booking}
                                onViewDetails={setSelectedBooking}
                            />
                        ))}
                    </div>
                )}
            </main>

            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}

            <Navbar />
        </div>
    );
}
