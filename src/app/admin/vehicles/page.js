'use client';

import { useState, useEffect } from 'react';
import { Truck, Plus, Check, X } from 'lucide-react';

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        vehicle_no: '',
        status: 'active'
    });

    useEffect(() => {
        fetchVehicles();
    }, []);

    async function fetchVehicles() {
        try {
            const res = await fetch('/api/vehicles');
            const json = await res.json();
            if (json.success) setVehicles(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch('/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to create vehicle');
            }

            // Success - refresh list and reset form
            await fetchVehicles();
            setFormData({ vehicle_no: '', status: 'active' });
            setShowForm(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-slate-500">Loading vehicles...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Vehicles</h1>
                    <p className="text-slate-400 text-sm">Manage your fleet vehicles</p>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    <span>{showForm ? 'Cancel' : 'Add Vehicle'}</span>
                </button>
            </div>

            {/* Add Vehicle Form */}
            {showForm && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Add New Vehicle</h3>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Vehicle Number
                            </label>
                            <input
                                type="text"
                                value={formData.vehicle_no}
                                onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value.toUpperCase() })}
                                required
                                placeholder="KA-01-AB-1234"
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <span>Creating...</span>
                            ) : (
                                <>
                                    <Check size={20} />
                                    <span>Create Vehicle</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Vehicles List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vehicles.map(vehicle => (
                    <div
                        key={vehicle._id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${vehicle.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                <Truck size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-white">{vehicle.vehicle_no}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${vehicle.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                    {vehicle.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {vehicles.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-600 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                        No vehicles found. Add your first vehicle to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
