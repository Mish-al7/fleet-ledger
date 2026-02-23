'use client';

import { signOut } from 'next-auth/react';
import { Clock, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PendingApprovalPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="text-center space-y-8 max-w-md">
                <div className="relative inline-flex">
                    <div className="p-4 bg-blue-500/10 rounded-2xl">
                        <Clock size={48} className="text-blue-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 p-1.5 bg-slate-950 rounded-full border border-slate-800">
                        <ShieldCheck size={16} className="text-emerald-400" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Pending Approval</h1>
                    <p className="text-slate-400 leading-relaxed">
                        Your registration has been received and is currently under review by our team.
                        Once approved, you will be able to access your dashboard.
                    </p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 text-sm text-slate-400 text-left space-y-4">
                    <div className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">1</div>
                        <p>We review all registrations to ensure platform integrity.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">2</div>
                        <p>This process typically takes less than 24 hours.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">3</div>
                        <p>You will receive an confirmation email as soon as your account is active.</p>
                    </div>
                </div>

                <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium text-sm group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Return to Sign In
                </button>
            </div>
        </div>
    );
}
