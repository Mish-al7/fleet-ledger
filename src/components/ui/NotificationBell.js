'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
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
            console.error('Failed to fetch notifications', error);
        }
    };

    // Only fetch on mount since real-time/polling isn't needed
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Close on click outside
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

    const handleNotificationClick = async (notif) => {
        // Mark as read immediately if not read
        if (!notif.read) {
            try {
                await fetch('/api/notifications', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationIds: [notif._id] })
                });
                
                // Optimistically update local state
                setNotifications(prev => prev.map(n => 
                    n._id === notif._id ? { ...n, read: true } : n
                ));
            } catch (error) {
                console.error('Error marking as read', error);
            }
        }

        setIsOpen(false);

        // Navigate depending on type
        if (notif.type === 'booking_created' && notif.related_id) {
            router.push(`/admin/bookings?booking_id=${notif.related_id}`);
        }
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
        if (unreadIds.length === 0) return;

        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationIds: unreadIds })
            });
            
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const timeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
    
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-slate-800"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900 shadow-sm" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div className="overflow-y-auto flex-1 overscroll-contain">
                        {notifications.filter(n => !n.read).length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                <Bell className="mx-auto mb-2 opacity-50" size={24} />
                                No new notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {notifications.filter(n => !n.read).map(notif => (
                                    <div 
                                        key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 hover:bg-slate-800/50 cursor-pointer transition-colors ${!notif.read ? 'bg-slate-800/20' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-0.5">
                                                {notif.type === 'booking_created' && (
                                                    <div className={`p-1.5 rounded-lg ${!notif.read ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                                        <CheckCircle2 size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-2 font-medium">
                                                    {timeAgo(notif.createdAt)}
                                                </p>
                                            </div>
                                            {!notif.read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                            )}
                                        </div>
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
