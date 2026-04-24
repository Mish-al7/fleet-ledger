'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function BookingCalendar({ bookings, onBookingClick, showFullVehicleNo = false }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getCalendarDays = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startDayOfWeek = firstDayOfMonth.getDay();
        const days = [];

        for (let i = startDayOfWeek; i > 0; i--) {
            const d = new Date(year, month, 1 - i);
            days.push({ date: d, isCurrentMonth: false });
        }

        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const d = new Date(year, month, i);
            days.push({ date: d, isCurrentMonth: true });
        }

        while (days.length % 7 !== 0) {
            const d = new Date(days[days.length - 1].date);
            d.setDate(d.getDate() + 1);
            days.push({ date: d, isCurrentMonth: false });
        }

        return days;
    };

    const days = getCalendarDays(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isSameDay = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const getBookingsForDay = (date) => {
        return bookings.filter(b => {
            const start = new Date(b.journey_start_date);
            const end = new Date(b.journey_return_date);

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            const check = new Date(date);
            check.setHours(12, 0, 0, 0);

            return check >= start && check <= end;
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/20';
            case 'rejected': return 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/20';
            default: return 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-900/20';
        }
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col min-h-[500px] w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="text-blue-400" size={20} />
                    <h2 className="text-lg font-bold text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-800/20">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-7 flex-1 bg-slate-950/30">
                {days.map((dayObj, idx) => {
                    const dayBookings = getBookingsForDay(dayObj.date);
                    const isToday = isSameDay(new Date(), dayObj.date);

                    return (
                        <div
                            key={idx}
                            className={`
                                min-h-[90px] border-b border-r border-slate-800/50 p-1 flex flex-col gap-1 relative overflow-hidden transition-colors
                                ${!dayObj.isCurrentMonth ? 'bg-slate-900/40 text-slate-600' : 'text-slate-300 hover:bg-slate-900/80'}
                                ${isToday ? 'bg-blue-500/5' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`
                                    text-[10px] sm:text-xs font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full
                                    ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : ''}
                                `}>
                                    {dayObj.date.getDate()}
                                </span>
                            </div>

                            {/* Booking Bars */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5 max-h-[120px]">
                                {dayBookings.map(booking => (
                                    <button
                                        key={booking._id}
                                        onClick={(e) => { e.stopPropagation(); onBookingClick(booking); }}
                                        className={`
                                            w-full text-left text-[9px] sm:text-[11px] font-bold px-1.5 py-1 rounded-[4px] border whitespace-normal break-all leading-[1.1] transition-all flex items-center mb-1 active:scale-[0.97]
                                            ${getStatusColor(booking.status)}
                                        `}
                                        title={`${booking.vehicle_no}\n${booking.customer_name}`}
                                    >
                                        <span>{booking.vehicle_no}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend / Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-900 flex flex-wrap gap-x-4 gap-y-2 text-[10px] sm:text-xs text-slate-400 justify-end">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Approved</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Rejected</div>
            </div>
        </div>
    );
}
