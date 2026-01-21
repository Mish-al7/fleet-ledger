'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Truck } from 'lucide-react';

export default function LedgerHubPage() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchVehicles() {
            try {
                const res = await fetch('/api/user/vehicles'); // Reusing existing User Vehicles API (Admin sees all)
                const json = await res.json();
                if (json.success) setVehicles(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchVehicles();
    }, []);

    if (loading) return <div className="text-slate-500">Loading vehicles...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Vehicle Ledgers</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vehicles.map(v => (
                    <Link
                        key={v._id}
                        href={`/admin/ledger/${v._id}`}
                        className="group bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 transition-all"
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-blue-400 transition-colors">
                                    <Truck size={24} />
                                </div>
                                <span className="font-bold text-lg text-white">{v.vehicle_no}</span>
                            </div>
                            <ChevronRight className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
