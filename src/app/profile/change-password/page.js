'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Lock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ChangePasswordPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            setStatus({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        if (formData.newPassword.length < 6) {
            setStatus({ type: 'error', message: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/users/change-password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldPassword: formData.oldPassword,
                    newPassword: formData.newPassword
                })
            });

            const json = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: 'Password updated successfully!' });
                setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => {
                    const redirectUrl = session?.user?.role === 'admin' ? '/admin/summary' : '/trips/new';
                    router.push(redirectUrl);
                }, 1500);
            } else {
                setStatus({ type: 'error', message: json.error || 'Update failed' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="inline-flex p-4 rounded-xl bg-blue-500/10 text-blue-400 mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Update Password</h1>
                    <p className="text-slate-400 text-sm mt-1">Keep your account secure</p>
                </div>

                {status.message && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${status.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                        <span className="text-sm">{status.message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 ml-1">Current Password</label>
                            <input
                                type="password"
                                required
                                value={formData.oldPassword}
                                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter current password"
                            />
                        </div>

                        <div className="h-px bg-slate-800" />

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 ml-1">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Min. 6 characters"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 ml-1">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Re-type new password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Save New Password'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full text-sm text-slate-500 hover:text-white transition-colors py-1"
                    >
                        Go Back
                    </button>
                </form>
            </div>
        </div>
    );
}
