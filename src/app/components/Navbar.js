'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, PlusCircle, CalendarPlus, FileText } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path) => pathname === path ? 'text-blue-400' : 'text-slate-400 hover:text-white';

    return (
        <nav className="fixed bottom-0 left-0 right-0 w-full bg-slate-900 border-t border-slate-800 pb-safe z-50">
            <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">

                <Link href="/trips/new" className={`flex flex-col items-center gap-1 ${isActive('/trips/new')}`}>
                    <PlusCircle size={24} />
                    <span className="text-xs font-medium">New Trip</span>
                </Link>

                <Link href="/bookings/new" className={`flex flex-col items-center gap-1 ${isActive('/bookings/new')}`}>
                    <CalendarPlus size={24} />
                    <span className="text-xs font-medium">Book</span>
                </Link>

                <Link href="/bookings" className={`flex flex-col items-center gap-1 ${isActive('/bookings')}`}>
                    <FileText size={24} />
                    <span className="text-xs font-medium">Bookings</span>
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
