import React from 'react';
import { Calendar } from 'lucide-react';

export default function DateInput({ value, onChange, className, placeholder, name, id, required, disabled }) {
    // value is expected to be YYYY-MM-DD or empty
    const displayValue = value ? value.split('-').reverse().join('/') : '';
    
    return (
        <div className={`relative flex items-center ${className} ${disabled ? 'opacity-50' : ''}`}>
            {/* The actual date input is hidden but covers the entire area and captures clicks */}
            <input
                type="date"
                name={name}
                id={id}
                required={required}
                disabled={disabled}
                value={value || ''}
                onChange={onChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                style={{ colorScheme: 'dark' }}
                onClick={(e) => {
                    // Force picker to show on some browsers if it doesn't automatically
                    try {
                        if (e.target.showPicker) e.target.showPicker();
                    } catch (err) {}
                }}
            />
            
            {/* The visible text input representation */}
            <div className="relative w-full flex items-center">
                <input
                    type="text"
                    readOnly
                    value={displayValue}
                    placeholder={placeholder || "DD/MM/YYYY"}
                    disabled={disabled}
                    className="w-full bg-transparent border-none outline-none pr-10 cursor-default focus:ring-0"
                />
                <Calendar 
                    size={16} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none opacity-70" 
                />
            </div>
        </div>
    );
}
