'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="inline-flex p-4 bg-emerald-500/10 rounded-2xl animate-bounce">
                        <CheckCircle2 size={48} className="text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white">Application Received!</h1>
                        <p className="text-slate-400">
                            Your registration for <span className="text-emerald-400 font-semibold">{formData.name}</span> has been submitted successfully.
                        </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-400 text-left">
                        <p>What happens next?</p>
                        <ul className="mt-2 space-y-2 list-disc list-inside">
                            <li>Our SuperAdmin will review your application.</li>
                            <li>You will receive an email once approved.</li>
                            <li>You can then sign in with your credentials.</li>
                        </ul>
                    </div>
                    <Link
                        href="/auth/signin"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                        Return to Sign In <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Fleet Ledger
                </h1>
                <h2 className="mt-6 text-center text-2xl font-extrabold text-white">
                    Register your company
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Join the most efficient fleet management platform
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-900 py-8 px-4 border border-slate-800 shadow-2xl rounded-2xl sm:px-10">
                    {/* Progress Dots */}
                    <div className="flex justify-center gap-2 mb-8">
                        <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
                        <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3 text-red-400 text-sm">
                                <AlertCircle size={18} />
                                <p>{error}</p>
                            </div>
                        )}

                        {step === 1 ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Company Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <Building2 size={18} />
                                        </div>
                                        <input
                                            name="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all sm:text-sm"
                                            placeholder="Global Logistics Inc."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Company Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all sm:text-sm"
                                            placeholder="contact@company.com"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={!formData.name || !formData.email}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                    Continue <ArrowRight size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <User size={18} />
                                        </div>
                                        <input
                                            name="adminName"
                                            type="text"
                                            required
                                            value={formData.adminName}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all sm:text-sm"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            name="adminEmail"
                                            type="email"
                                            required
                                            value={formData.adminEmail}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all sm:text-sm"
                                            placeholder="john@company.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            name="adminPassword"
                                            type="password"
                                            required
                                            value={formData.adminPassword}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all sm:text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                                    >
                                        {loading ? 'Submitting...' : 'Register Company'}
                                        {!loading && <ArrowRight size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                        <p className="text-sm text-slate-400">
                            Already have an account?{' '}
                            <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
