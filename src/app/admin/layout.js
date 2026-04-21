'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, LogOut, Truck, Users, CalendarCheck, Wallet, Cog, BarChart2, PieChart, Menu, X } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import NotificationBell from '@/components/ui/NotificationBell';

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

    const NavItem = ({ href, icon: Icon, label, pathname }) => {
        // Fallback for pathname if not provided directly, though we pass it below
        const currentPath = pathname || usePathname();
        const isActive = currentPath.startsWith(href);
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
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 flex-shrink-0 z-20">
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Admin Portal
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 -mr-2 text-slate-400 hover:text-white"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:sticky top-0 left-0 h-full max-h-screen w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col z-40 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 hidden md:block">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                                Admin Portal
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">Fleet Ledger System</p>
                        </div>
                        <NotificationBell align="left" />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 md:hidden border-b border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-white">Menu</h2>
                        <p className="text-xs text-slate-500">Fleet Ledger</p>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2 flex flex-col gap-0 scrollbar-hide">
                    <NavItem href="/admin/summary" icon={LayoutDashboard} label="Summary" pathname={pathname} />
                    <NavItem href="/admin/daily" icon={CalendarCheck} label="Daily Dashboard" pathname={pathname} />
                    <NavItem href="/admin/ledger" icon={FileText} label="Ledgers" pathname={pathname} />
                    <NavItem href="/admin/vehicles" icon={Truck} label="Vehicles" pathname={pathname} />
                    <NavItem href="/admin/expenses" icon={Wallet} label="Expenses" pathname={pathname} />
                    <NavItem href="/admin/drivers" icon={Users} label="Drivers" pathname={pathname} />
                    <NavItem href="/admin/opening-balances" icon={Settings} label="Opening Balances" pathname={pathname} />
                    <NavItem href="/admin/trip-sheets" icon={FileText} label="Trip Sheets" pathname={pathname} />
                    <NavItem href="/admin/invoices" icon={FileText} label="Invoices" pathname={pathname} />
                    <NavItem href="/admin/bookings" icon={CalendarCheck} label="Bookings" pathname={pathname} />
                    <NavItem href="/admin/personal-ledger" icon={Wallet} label="Personal Ledger" pathname={pathname} />
                    <NavItem href="/admin/reports" icon={BarChart2} label="Reports" pathname={pathname} />
                    <NavItem href="/admin/analytics" icon={PieChart} label="Analytics" pathname={pathname} />
                    <NavItem href="/admin/settings" icon={Cog} label="Company Settings" pathname={pathname} />

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
