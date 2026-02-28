'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert, User, Phone } from 'lucide-react';

export default function ForgotPasswordPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center">
                    <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 text-amber-500 mb-6">
                        <ShieldAlert size={48} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Access Recovery</h1>
                    <p className="text-slate-400 mt-2">How to get back into your account</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Contact Administrator</h3>
                                <p className="text-sm text-slate-400">Your fleet manager or system administrator can reset your password instantly from the Drivers management portal.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <Phone size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Instant Reset</h3>
                                <p className="text-sm text-slate-400">Once verified, they will provide you with a temporary password which you can change after logging in.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <button
                            onClick={() => router.push('/auth/signin')}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            Back to Sign In
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600">
                    Fleet Ledger Security Protocol v2.4
                </p>
            </div>
        </div>
    );
}
