'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/app/components/Navbar';
import EditTripModal from '@/app/components/EditTripModal';
import { Truck, MapPin, FileText, PlusCircle, Edit } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import Link from 'next/link';

export default function MyTripsPage() {
    const { data: session } = useSession();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingTrip, setEditingTrip] = useState(null);

    useEffect(() => {
        if (session) {
            fetchMyTrips();
        }
    }, [session]);

    async function fetchMyTrips() {
        setLoading(true);
        try {
            const res = await fetch('/api/trips/my');
            const json = await res.json();
            if (json.success) {
                setTrips(json.data);
            } else {
                setError(json.error || 'Failed to load trips');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleUpdate = (updatedTrip) => {
        setTrips(trips.map(t => t._id === updatedTrip._id
            ? { ...t, ...updatedTrip, vehicle_id: t.vehicle_id }
            : t));
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
            <div className="bg-slate-900 pt-8 pb-4 px-6 shadow-lg border-b border-slate-800">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                        Recent Trips
                    </h1>
                    <Link
                        href="/trips/new"
                        className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-md transition-colors"
                    >
                        <PlusCircle size={16} /> New Trip
                    </Link>
                </div>
                <p className="text-slate-400 text-sm">Your recently logged journeys.</p>
            </div>

            <main className="max-w-md mx-auto px-6 py-6 animate-fade-in-up">
                {error && (
                    <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-slate-400">Loading trips...</div>
                ) : trips.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText size={48} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500 mb-4">No trips found</p>
                        <Link
                            href="/trips/new"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
                        >
                            <PlusCircle size={18} /> Add Your First Trip
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trips.map(trip => (
                            <div key={trip._id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-white font-medium">
                                        <Truck size={16} className="text-emerald-400" />
                                        <span>{trip.vehicle_id?.vehicle_no || 'Unknown Vehicle'}</span>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {formatDate(trip.trip_date)}
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 text-sm text-slate-300">
                                    <MapPin size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{trip.trip_route}</span>
                                </div>

                                <div className="pt-3 border-t border-slate-800/50 flex justify-between items-center">
                                    <div className="text-sm">
                                        <span className="text-slate-500">Income: </span>
                                        <span className="text-emerald-400 font-medium">₹{trip.income?.toLocaleString() || 0}</span>
                                    </div>
                                    <button
                                        onClick={() => setEditingTrip(trip)}
                                        className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <Edit size={14} /> Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {editingTrip && (
                <EditTripModal
                    trip={editingTrip}
                    onClose={() => setEditingTrip(null)}
                    onUpdate={handleUpdate}
                />
            )}

            <Navbar />
        </div>
    );
}
