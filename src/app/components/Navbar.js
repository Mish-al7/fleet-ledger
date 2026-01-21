'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path) => pathname === path ? 'text-blue-400' : 'text-slate-400 hover:text-white';

    return (
        <nav className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 pb-safe z-50 md:sticky md:top-0 md:border-t-0 md:border-b">
            <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">

                <Link href="/trips/new" className={`flex flex-col items-center gap-1 ${isActive('/trips/new')}`}>
                    <PlusCircle size={24} />
                    <span className="text-xs font-medium">New Trip</span>
                </Link>

                <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-400 transition-colors"
                >
                    <LogOut size={24} />
                    <span className="text-xs font-medium">Logout</span>
                </button>

            </div>
        </nav>
    );
}
