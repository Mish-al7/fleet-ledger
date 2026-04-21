'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function NotificationBell({ align = 'right' }) {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data);
            }
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const { data: session } = useSession();

    const handleNotificationClick = async (notification) => {
        // Remove it immediately from the UI since it is now read
        setNotifications(prev => prev.filter(n => n._id !== notification._id));
        setIsOpen(false);

        // API call to mark as read
        if (!notification.read) {
            try {
                await fetch('/api/notifications', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationIds: [notification._id] })
                });
            } catch (error) {
                console.error('Failed to mark read', error);
            }
        }

        // Navigate based on type and role
        if (session?.user?.role === 'driver') {
            if (['booking_assigned', 'booking_due'].includes(notification.type) && notification.related_id) {
                router.push(`/bookings?booking_id=${notification.related_id}`);
            }
        } else if (notification.type === 'booking_created' && notification.related_id) {
            router.push(`/admin/bookings?booking_id=${notification.related_id}`);
        }
    };

    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
        if (unreadIds.length === 0) return;

        // Clear all notifications from UI
        setNotifications([]);
        
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationIds: unreadIds })
            });
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800 focus:outline-none"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={`absolute ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} mt-2 w-80 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                        <h3 className="font-semibold text-slate-200">Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllRead}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                            >
                                <Check size={14} /> Mark all read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto overscroll-contain">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500 text-sm">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500">
                                <Bell size={32} className="mb-2 opacity-20" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800/50">
                                {notifications.map(notif => (
                                    <div 
                                        key={notif._id} 
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 cursor-pointer hover:bg-slate-800/50 transition-all ${
                                            !notif.read ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : 'opacity-70'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm font-medium ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                                                {notif.title}
                                            </h4>
                                            <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                                                {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                            {notif.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
