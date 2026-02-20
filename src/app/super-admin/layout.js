'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LogOut, Shield } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SuperAdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin');
        } else if (session.user.role !== 'super_admin') {
            router.push('/admin/summary');
        }
    }, [session, status, router]);

    if (status === 'loading' || !session || session.user.role !== 'super_admin') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    const NavItem = ({ href, icon: Icon, label }) => {
        const isActive = pathname.startsWith(href);
        return (
            <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
            >
                <Icon size={20} />
                <span className="font-medium text-sm">{label}</span>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex-shrink-0">
                <div className="p-6">
                    <div className="flex items-center gap-2">
                        <Shield size={20} className="text-purple-400" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Platform Admin
                        </h1>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Super Admin Console</p>
                </div>

                <nav className="px-4 pb-4 space-y-2 overflow-x-auto md:overflow-visible flex md:flex-col gap-2 md:gap-0">
                    <NavItem href="/super-admin/companies" icon={Building2} label="Companies" />

                    <div className="md:mt-auto pt-4 md:border-t border-slate-800">
                        <button
                            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                        >
                            <LogOut size={20} />
                            <span className="font-medium text-sm">Sign Out</span>
                        </button>
                    </div>
                </nav>
            </aside>

            <main className="flex-1 overflow-auto bg-slate-950 p-6">
                {children}
            </main>
        </div>
    );
}
