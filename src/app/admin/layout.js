'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, LogOut, Truck, Users, CalendarCheck } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    // Redirect non-admin users
    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin');
        } else if (session.user.role !== 'admin') {
            router.push('/trips/new');
        }
    }, [session, status, router]);

    // Show loading while checking auth
    if (status === 'loading' || !session || session.user.role !== 'admin') {
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
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
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
            {/* Sidebar / Mobile Header */}
            <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex-shrink-0">
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Admin Portal
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Fleet Ledger System</p>
                </div>

                <nav className="px-4 pb-4 space-y-2 overflow-x-auto md:overflow-visible flex md:flex-col gap-2 md:gap-0">
                    <NavItem href="/admin/summary" icon={LayoutDashboard} label="Summary" />
                    <NavItem href="/admin/ledger" icon={FileText} label="Ledgers" />
                    <NavItem href="/admin/vehicles" icon={Truck} label="Vehicles" />
                    <NavItem href="/admin/drivers" icon={Users} label="Drivers" />
                    <NavItem href="/admin/opening-balances" icon={Settings} label="Opening Balances" />
                    <NavItem href="/admin/trip-sheets" icon={FileText} label="Trip Sheets" />
                    <NavItem href="/admin/bookings" icon={CalendarCheck} label="Bookings" />

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

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-950 p-6">
                {children}
            </main>
        </div>
    );
}
