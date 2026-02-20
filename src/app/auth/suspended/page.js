'use client';

import { signOut } from 'next-auth/react';
import { ShieldOff } from 'lucide-react';

export default function SuspendedPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="inline-flex p-4 bg-red-500/10 rounded-2xl">
                    <ShieldOff size={48} className="text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Account Suspended</h1>
                <p className="text-slate-400">
                    Your company account has been suspended. Please contact support for assistance.
                </p>
                <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
