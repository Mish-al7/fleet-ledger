'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Check, X, Shield, User } from 'lucide-react';

export default function DriversPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'driver'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const res = await fetch('/api/users');
            const json = await res.json();
            if (json.success) setUsers(json.data);
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
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to create user');
            }

            // Success - refresh list and reset form
            await fetchUsers();
            setFormData({ name: '', email: '', password: '', role: 'driver' });
            setShowForm(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-slate-500">Loading users...</div>;

    const drivers = users.filter(u => u.role === 'driver');
    const admins = users.filter(u => u.role === 'admin');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Drivers</h1>
                    <p className="text-slate-400 text-sm">Manage driver accounts</p>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    <span>{showForm ? 'Cancel' : 'Add Driver'}</span>
                </button>
            </div>

            {/* Add Driver Form */}
            {showForm && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Add New Driver</h3>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Driver Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="John Doe"
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                placeholder="driver@example.com"
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                                placeholder="Minimum 6 characters"
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
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
                                    <span>Create Driver Account</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Drivers List */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Drivers ({drivers.length})</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {drivers.map(driver => (
                        <div
                            key={driver._id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                    <User size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white">{driver.name}</h3>
                                    <p className="text-sm text-slate-400">{driver.email}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {drivers.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-600 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                            No drivers found. Add your first driver to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* Admins List */}
            {admins.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Admins ({admins.length})</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {admins.map(admin => (
                            <div
                                key={admin._id}
                                className="bg-slate-900 border border-emerald-800/30 rounded-xl p-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                                        <Shield size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white">{admin.name}</h3>
                                        <p className="text-sm text-slate-400">{admin.email}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
