'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Eye, Ban, CheckCircle, ChevronDown } from 'lucide-react';

export default function CompaniesPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', plan: 'basic',
        adminName: '', adminEmail: '', adminPassword: '',
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/super-admin/companies');
            const json = await res.json();
            if (json.success) setCompanies(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/super-admin/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const json = await res.json();
            if (json.success) {
                setShowCreateModal(false);
                setFormData({ name: '', email: '', plan: 'basic', adminName: '', adminEmail: '', adminPassword: '' });
                fetchCompanies();
            } else {
                alert(json.error || 'Failed to create company');
            }
        } catch (err) {
            alert('An error occurred');
        } finally {
            setCreating(false);
        }
    };

    const [confirmModal, setConfirmModal] = useState({ show: false, id: null, status: '' });
    const [updatingId, setUpdatingId] = useState(null);

    const handleStatusChangeInitiate = (id, newStatus) => {
        setConfirmModal({
            show: true,
            id,
            status: newStatus
        });
    };

    const handleStatusChangeExecute = async () => {
        const { id, status: newStatus } = confirmModal;
        setConfirmModal({ show: false, id: null, status: '' });
        setUpdatingId(id);

        // Optimistic update
        const originalCompanies = [...companies];
        setCompanies(companies.map(c =>
            c._id === id ? { ...c, status: newStatus } : c
        ));

        try {
            const res = await fetch(`/api/super-admin/companies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const json = await res.json();
            if (!json.success) {
                setCompanies(originalCompanies);
                alert(json.error || 'Failed to update status');
            }
        } catch (err) {
            setCompanies(originalCompanies);
            alert('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handlePlanChange = async (id, plan) => {
        try {
            const res = await fetch(`/api/super-admin/companies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });
            const json = await res.json();
            if (json.success) fetchCompanies();
        } catch (err) {
            alert('Failed to update plan');
        }
    };

    const planColors = {
        basic: 'bg-slate-700 text-slate-300',
        pro: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        enterprise: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    };

    const statusColors = {
        active: 'bg-emerald-500/20 text-emerald-400',
        suspended: 'bg-red-500/20 text-red-400',
        pending_approval: 'bg-amber-500/20 text-amber-400',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Companies</h1>
                    <p className="text-slate-400 text-sm">Manage all tenant companies</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                    <Plus size={20} />
                    Create Company
                </button>
            </div>

            {/* Companies Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-950 border-b border-slate-800">
                                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Company</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="text-center px-4 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    <div className="flex flex-col items-center gap-1">
                                        <span>Vehicles</span>
                                    </div>
                                </th>
                                <th className="text-center px-4 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    <div className="flex flex-col items-center gap-1">
                                        <span>Trips</span>
                                    </div>
                                </th>
                                <th className="text-center px-4 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    <div className="flex flex-col items-center gap-1">
                                        <span>Drivers</span>
                                    </div>
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading companies...</td>
                                </tr>
                            ) : companies.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No companies found</td>
                                </tr>
                            ) : (
                                companies.map((company) => (
                                    <tr key={company._id} className="hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                                    <Building2 size={16} className="text-purple-400" />
                                                </div>
                                                <span className="text-white font-medium">{company.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">{company.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="relative inline-block">
                                                <select
                                                    value={company.plan}
                                                    onChange={(e) => handlePlanChange(company._id, e.target.value)}
                                                    className={`appearance-none text-xs font-medium px-3 py-1 rounded-full cursor-pointer bg-transparent ${planColors[company.plan] || planColors.basic}`}
                                                >
                                                    <option value="basic" className="bg-slate-900 text-white">Basic</option>
                                                    <option value="pro" className="bg-slate-900 text-white">Pro</option>
                                                    <option value="enterprise" className="bg-slate-900 text-white">Enterprise</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[company.status] || ''}`}>
                                                {company.status}
                                            </span>
                                            {updatingId === company._id && (
                                                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-white font-semibold text-sm">{company.metrics?.vehicleCount || 0}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-white font-semibold text-sm">{company.metrics?.tripCount || 0}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-white font-semibold text-sm">{company.metrics?.driverCount || 0}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-white">
                                                <button
                                                    onClick={() => router.push(`/super-admin/companies/${company._id}`)}
                                                    className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                                                    title="View Details"
                                                    disabled={updatingId === company._id}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {company.status === 'pending_approval' ? (
                                                    <button
                                                        onClick={() => handleStatusChangeInitiate(company._id, 'active')}
                                                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                        title="Approve"
                                                        disabled={updatingId === company._id}
                                                    >
                                                        <CheckCircle size={16} className={updatingId === company._id ? 'animate-spin' : ''} />
                                                    </button>
                                                ) : company.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleStatusChangeInitiate(company._id, 'suspended')}
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Suspend"
                                                        disabled={updatingId === company._id}
                                                    >
                                                        <Ban size={16} className={updatingId === company._id ? 'animate-spin' : ''} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleStatusChangeInitiate(company._id, 'active')}
                                                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                        title="Activate"
                                                        disabled={updatingId === company._id}
                                                    >
                                                        <CheckCircle size={16} className={updatingId === company._id ? 'animate-spin' : ''} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Company Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">Create Company</h2>
                            <p className="text-sm text-slate-400 mt-1">Set up a new tenant company with its admin user</p>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4" autoComplete="off">
                            <div className="border-b border-slate-800 pb-4 space-y-3">
                                <h3 className="text-sm font-medium text-slate-300">Company Details</h3>
                                <input
                                    required
                                    autoComplete="off"
                                    placeholder="Company Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                />
                                <input
                                    required type="email"
                                    autoComplete="off"
                                    placeholder="Company Email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                />
                                <select
                                    value={formData.plan}
                                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                >
                                    <option value="basic">Basic</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-slate-300">Admin User</h3>
                                <input
                                    autoComplete="off"
                                    placeholder="Admin Name"
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                />
                                <input
                                    required type="email"
                                    autoComplete="new-email"
                                    placeholder="Admin Email"
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                />
                                <input
                                    required type="password"
                                    autoComplete="new-password"
                                    placeholder="Admin Password"
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Company'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-6 shadow-2xl">
                        <div className="text-center space-y-3">
                            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${confirmModal.status === 'suspended' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {confirmModal.status === 'suspended' ? <Ban size={24} /> : <CheckCircle size={24} />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Confirm Action</h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    Are you sure you want to {confirmModal.status === 'suspended' ? 'suspend' : 'activate'} this company?
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal({ show: false, id: null, status: '' })}
                                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusChangeExecute}
                                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm ${confirmModal.status === 'suspended' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
