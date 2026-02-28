'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Check, X, Shield, User, Loader2 } from 'lucide-react';

// Define UserCard OUTSIDE to prevent focus loss issues on re-render
const UserCard = ({ user, icon: Icon, colorClass, resettingId, setResettingId, newPassword, setNewPassword, handleResetPassword, resetStatus }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all">
        <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${colorClass}`}>
                <Icon size={24} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-white">{user.name}</h3>
                <p className="text-sm text-slate-400 mb-3">{user.email}</p>

                {resettingId === user._id ? (
                    <div className="space-y-2 mt-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <input
                            type="password"
                            placeholder="New Password"
                            autoFocus
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full text-xs px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleResetPassword(user._id)}
                                className="flex-1 text-[10px] font-bold bg-blue-600 text-white rounded py-1 px-2 hover:bg-blue-500 transition-colors"
                            >
                                {resetStatus === 'Saving...' ? '...' : 'Save'}
                            </button>
                            <button
                                onClick={() => {
                                    setResettingId(null);
                                    setNewPassword('');
                                }}
                                className="text-[10px] font-bold bg-slate-700 text-slate-300 rounded py-1 px-2 hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                        {resetStatus && <p className={`text-[10px] text-center ${resetStatus === 'Success!' ? 'text-emerald-400' : 'text-blue-400'}`}>{resetStatus}</p>}
                    </div>
                ) : (
                    <button
                        onClick={() => setResettingId(user._id)}
                        className="text-xs text-blue-500 hover:text-blue-400 font-semibold flex items-center gap-1 transition-colors"
                    >
                        Reset Password
                    </button>
                )}
            </div>
        </div>
    </div>
);

export default function DriversPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [resettingId, setResettingId] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetStatus, setResetStatus] = useState('');

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

    const handleResetPassword = async (id) => {
        if (!newPassword || newPassword.length < 6) {
            setResetStatus('Min 6 chars');
            return;
        }
        setResetStatus('Saving...');
        try {
            const res = await fetch(`/api/users/${id}/reset-password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setResetStatus('Success!');
                setTimeout(() => {
                    setResettingId(null);
                    setNewPassword('');
                    setResetStatus('');
                }, 1500);
            } else {
                setResetStatus(data.error || 'Error');
            }
        } catch (err) {
            setResetStatus('Failed');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    const drivers = users.filter(u => u.role === 'driver');
    const admins = users.filter(u => u.role === 'admin');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Drivers & Admins</h1>
                    <p className="text-slate-400 text-sm">Manage accounts and reset passwords</p>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all active:scale-95"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    <span className="font-semibold">{showForm ? 'Cancel' : 'Add Driver'}</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-bold text-white mb-4">Add New Driver</h3>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
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
                                    Email Address
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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Initial Password
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
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
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

            <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Drivers ({drivers.length})</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {drivers.map(driver => (
                        <UserCard
                            key={driver._id}
                            user={driver}
                            icon={User}
                            colorClass="bg-blue-500/10 text-blue-400"
                            resettingId={resettingId}
                            setResettingId={setResettingId}
                            newPassword={newPassword}
                            setNewPassword={setNewPassword}
                            handleResetPassword={handleResetPassword}
                            resetStatus={resetStatus}
                        />
                    ))}

                    {drivers.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-600 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                            No drivers found. Add your first driver to get started.
                        </div>
                    )}
                </div>
            </div>

            {admins.length > 0 && (
                <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Admins ({admins.length})</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {admins.map(admin => (
                            <UserCard
                                key={admin._id}
                                user={admin}
                                icon={Shield}
                                colorClass="bg-emerald-500/10 text-emerald-400"
                                resettingId={resettingId}
                                setResettingId={setResettingId}
                                newPassword={newPassword}
                                setNewPassword={setNewPassword}
                                handleResetPassword={handleResetPassword}
                                resetStatus={resetStatus}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
