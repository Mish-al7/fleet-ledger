'use client';

import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

export default function DateInput({ label, name, value, onChange, required = false, icon: Icon = Calendar }) {
    const inputRef = useRef(null);

    const handleClick = () => {
        if (inputRef.current) {
            // Some browsers require showPicker() for programmatic opening
            if (typeof inputRef.current.showPicker === 'function') {
                inputRef.current.showPicker();
            } else {
                inputRef.current.click();
            }
        }
    };

    return (
        <div className="space-y-1">
            {label && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>}
            <div 
                className="relative group cursor-pointer"
                onClick={handleClick}
            >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    {Icon && <Icon size={18} />}
                </div>
                
                {/* Visible Formatted date */}
                <div className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 outline-none group-hover:border-slate-600 transition-all min-h-[46px] flex items-center">
                    {value ? formatDate(value) : <span className="text-slate-600">No Date Selected</span>}
                </div>

                {/* Hidden Native Date Input */}
                <input
                    ref={inputRef}
                    type="date"
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    required={required}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    style={{ colorScheme: 'dark' }} // Helps some browsers style the picker
                />
            </div>
        </div>
    );
}
