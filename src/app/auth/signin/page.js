'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, AlertCircle } from 'lucide-react';

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError(result.error);
                setLoading(false);
            } else {
                // Fetch session to get user role
                const response = await fetch('/api/auth/session');
                const session = await response.json();

                // Redirect based on role
                const redirectUrl = session?.user?.role === 'driver' ? '/trips/new' : '/admin/summary';
                router.push(redirectUrl);
                router.refresh();
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    const quickLogin = async (userEmail, userPassword) => {
        setEmail(userEmail);
        setPassword(userPassword);
        setLoading(true);
        setError('');

        const result = await signIn('credentials', {
            redirect: false,
            email: userEmail,
            password: userPassword,
        });

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else {
            // Fetch session to get user role
            const response = await fetch('/api/auth/session');
            const session = await response.json();

            // Redirect based on role
            const redirectUrl = session?.user?.role === 'driver' ? '/trips/new' : '/admin/summary';
            router.push(redirectUrl);
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
            <div className="w-full max-w-md space-y-8">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Fleet Ledger
                    </h1>
                    <p className="text-slate-400 mt-2">Sign in to your account</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="text-red-400" size={20} />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="admin@fleet.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span>Signing in...</span>
                        ) : (
                            <>
                                <LogIn size={20} />
                                <span>Sign In</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Quick Login Buttons */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-3">
                    <p className="text-slate-400 text-sm text-center mb-4">Quick Login (Test Accounts)</p>

                    <button
                        onClick={() => quickLogin('admin@fleet.com', 'admin123')}
                        disabled={loading}
                        className="w-full py-2 bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/20 transition-all disabled:opacity-50"
                    >
                        Login as Admin
                    </button>

                    <button
                        onClick={() => quickLogin('driver@fleet.com', 'driver123')}
                        disabled={loading}
                        className="w-full py-2 bg-blue-600/10 border border-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/20 transition-all disabled:opacity-50"
                    >
                        Login as Driver
                    </button>
                </div>

            </div>
        </div>
    );
}
