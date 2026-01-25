'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, Save, X, Truck, Wrench, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import ServiceLogsTab from './_components/ServiceLogsTab';

export default function VehicleDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('logs'); // Default to logs as requested feature focus? Or ledger? Let's default to ledger usually but for dev testing logs.
    // Spec says: "Tabs: Ledger, Trips, Service Logs".
    // Let's make "Ledger" default.

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVehicle();
        setActiveTab('ledger');
    }, [id]);

    const fetchVehicle = async () => {
        try {
            const res = await fetch(`/api/vehicles/${id}`);
            if (res.ok) {
                const data = await res.json();
                setVehicle(data);
                setEditData({ vehicle_no: data.vehicle_no, status: data.status });
            } else {
                setError('Vehicle not found');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`/api/vehicles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });

            const json = await res.json();
            if (res.ok) {
                setVehicle(json);
                setIsEditing(false);
            } else {
                setError(json.error || 'Update failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this vehicle? This check will fail if trips or logs exist.')) return;

        try {
            const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
            const json = await res.json();

            if (res.ok) {
                router.push('/admin/vehicles');
            } else {
                alert(json.error); // Show the blocking reason
            }
        } catch (err) {
            alert('Delete failed');
        }
    };

    if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
    if (!vehicle) return <div className="p-6 text-white">Vehicle not found</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/vehicles" className="text-slate-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    className="bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-xl font-bold"
                                    value={editData.vehicle_no}
                                    onChange={e => setEditData({ ...editData, vehicle_no: e.target.value.toUpperCase() })}
                                />
                                <select
                                    className="bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded"
                                    value={editData.status}
                                    onChange={e => setEditData({ ...editData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-white">{vehicle.vehicle_no}</h1>
                                <span className={`text-xs px-2 py-1 rounded-full ${vehicle.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {vehicle.status}
                                </span>
                            </div>
                        )}
                        <p className="text-slate-400 text-sm">Created {new Date(vehicle.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-white"><X size={20} /></button>
                            <button onClick={handleUpdate} disabled={saving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium">
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                <Edit2 size={18} />
                                Edit
                            </button>
                            <button onClick={handleDelete} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg font-medium transition-colors border border-red-500/20">
                                <Trash2 size={18} />
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">{error}</div>}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('ledger')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'ledger' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2">
                        <BarChart3 size={18} />
                        Ledger
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'logs' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2">
                        <Wrench size={18} />
                        Service Logs
                    </div>
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'ledger' && (
                    <div className="text-center py-12">
                        <p className="text-slate-500 mb-4">View Operational Ledger for this vehicle.</p>
                        <Link href={`/admin/ledger/${id}`} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-colors">
                            Go to Vehicle Ledger
                        </Link>
                    </div>
                )}

                {activeTab === 'logs' && <ServiceLogsTab vehicleId={id} />}
            </div>
        </div>
    );
}
