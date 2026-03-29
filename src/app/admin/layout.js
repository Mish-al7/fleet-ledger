'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, LogOut, Truck, Users, CalendarCheck, Wallet, Cog, Lock, Calendar, FileBarChart, Menu, X } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                onClick={() => setIsMobileMenuOpen(false)}
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

            {/* Mobile Header — only visible on small screens */}
            <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 flex-shrink-0 z-20">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Admin Portal
                </h1>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 -mr-2 text-slate-400 hover:text-white"
                    aria-label="Toggle navigation menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Mobile Backdrop Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar — fixed drawer on mobile, sticky sidebar on desktop */}
            <aside className={`
                fixed md:sticky top-0 left-0 h-full max-h-screen
                w-64 bg-slate-900 border-r border-slate-800
                flex-shrink-0 flex flex-col z-40
                transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Desktop title — hidden on mobile */}
                <div className="p-6 hidden md:block">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Admin Portal
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Fleet Ledger System</p>
                </div>

                {/* Mobile sidebar header with close button */}
                <div className="flex items-center justify-between p-4 md:hidden border-b border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-white">Menu</h2>
                        <p className="text-xs text-slate-500">Fleet Ledger</p>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 text-slate-400 hover:text-white"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Nav items */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2 flex flex-col no-scrollbar">
                    <NavItem href="/admin/summary" icon={LayoutDashboard} label="Summary" />
                    <NavItem href="/admin/daily" icon={Calendar} label="Daily Dashboard" />
                    <NavItem href="/admin/reports" icon={FileBarChart} label="Reports" />
                    <NavItem href="/admin/ledger" icon={FileText} label="Ledgers" />
                    <NavItem href="/admin/vehicles" icon={Truck} label="Vehicles" />
                    <NavItem href="/admin/drivers" icon={Users} label="Drivers" />
                    <NavItem href="/admin/opening-balances" icon={Settings} label="Opening Balances" />
                    <NavItem href="/admin/trip-sheets" icon={FileText} label="Trip Sheets" />
                    <NavItem href="/admin/bookings" icon={CalendarCheck} label="Bookings" />
                    <NavItem href="/admin/personal-ledger" icon={Wallet} label="Personal Ledger" />
                    <NavItem href="/admin/settings" icon={Cog} label="Company Settings" />
                    <NavItem href="/profile/change-password" icon={Lock} label="Change Password" />

                    <div className="mt-auto pt-4 md:border-t border-slate-800">
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
            <main className="flex-1 overflow-auto bg-slate-950 p-4 md:p-6 w-full max-w-full">
                {children}
            </main>
        </div>
    );
}
