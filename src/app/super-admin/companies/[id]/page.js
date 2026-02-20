'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Users, Truck, MapPin, Ban, CheckCircle, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function CompanyDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showResetModal, setShowResetModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        fetchCompany();
    }, [id]);

    const fetchCompany = async () => {
        try {
            const res = await fetch(`/api/super-admin/companies/${id}`);
            const json = await res.json();
            if (json.success) setCompany(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} this company?`)) return;

        try {
            const res = await fetch(`/api/super-admin/companies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const json = await res.json();
            if (json.success) fetchCompany();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handlePlanChange = async (plan) => {
        try {
            const res = await fetch(`/api/super-admin/companies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });
            const json = await res.json();
            if (json.success) fetchCompany();
        } catch (err) {
            alert('Failed to update plan');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetting(true);
        try {
            const res = await fetch(`/api/super-admin/companies/${id}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const json = await res.json();
            if (json.success) {
                alert('Password reset successfully');
                setShowResetModal(false);
                setNewPassword('');
            } else {
                alert(json.error || 'Failed to reset password');
            }
        } catch (err) {
            alert('An error occurred');
        } finally {
            setResetting(false);
        }
    };

    if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
    if (!company) return <div className="p-6 text-red-400">Company not found</div>;

    const metrics = company.metrics || {};
    const planColors = {
        basic: 'bg-slate-700 text-slate-300',
        pro: 'bg-blue-500/20 text-blue-400',
        enterprise: 'bg-purple-500/20 text-purple-400',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/super-admin/companies" className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">{company.name}</h1>
                    <p className="text-slate-400 text-sm">{company.email}</p>
                </div>
            </div>

            {/* Company Info + Status */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Company Info</h3>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">Status</span>
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${company.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {company.status}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Plan</span>
                            <select
                                value={company.plan}
                                onChange={(e) => handlePlanChange(e.target.value)}
                                className={`appearance-none text-xs font-medium px-3 py-1 rounded-full cursor-pointer bg-transparent ${planColors[company.plan] || planColors.basic}`}
                            >
                                <option value="basic" className="bg-slate-900 text-white">Basic</option>
                                <option value="pro" className="bg-slate-900 text-white">Pro</option>
                                <option value="enterprise" className="bg-slate-900 text-white">Enterprise</option>
                            </select>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">Created</span>
                            <span className="text-white text-sm">{new Date(company.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Usage Metrics */}
                <div className="grid gap-4 grid-cols-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                        <Users size={24} className="text-purple-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{metrics.userCount || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">Users</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                        <Truck size={24} className="text-blue-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{metrics.vehicleCount || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">Vehicles</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                        <MapPin size={24} className="text-emerald-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{metrics.tripCount || 0}</p>
                        <p className="text-xs text-slate-400 mt-1">Trips</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Actions</h3>
                <div className="flex flex-wrap gap-3">
                    {company.status === 'active' ? (
                        <button
                            onClick={() => handleStatusChange('suspended')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors font-medium text-sm"
                        >
                            <Ban size={16} />
                            Suspend Company
                        </button>
                    ) : (
                        <button
                            onClick={() => handleStatusChange('active')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors font-medium text-sm"
                        >
                            <CheckCircle size={16} />
                            Activate Company
                        </button>
                    )}

                    <button
                        onClick={() => setShowResetModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg transition-colors font-medium text-sm"
                    >
                        <KeyRound size={16} />
                        Reset Admin Password
                    </button>
                </div>
            </div>

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-bold text-white">Reset Admin Password</h2>
                        <p className="text-sm text-slate-400">Set a new password for the admin user of <strong className="text-white">{company.name}</strong></p>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <input
                                required
                                type="password"
                                placeholder="New Password (min 6 chars)"
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowResetModal(false); setNewPassword(''); }}
                                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetting}
                                    className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                                >
                                    {resetting ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
