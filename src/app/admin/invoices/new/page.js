'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Calculator, Car, Clock, CreditCard, FileText } from 'lucide-react';

export default function CreateInvoicePage() {
    const router = useRouter();
    const [vehicles, setVehicles] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        booking_id: '',
        vehicle_id: '',
        customer_name: '',
        pick_km: '',
        drop_km: '',
        start_time: '',
        end_time: '',
        base_hours: 8,
        base_km: 80,
        base_price: 2500,
        extra_hour_rate: 200,
        extra_km_rate: 15,
        override_amount: '',
        is_override: false
    });

    // Calculated State
    const [calculations, setCalculations] = useState({
        total_km: 0,
        extra_km: 0,
        total_hours: 0,
        extra_hours: 0,
        calculated_amount: 0,
        final_amount: 0
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [vehiclesRes, bookingsRes] = await Promise.all([
                fetch('/api/vehicles?status=active'),
                fetch('/api/bookings')
            ]);

            if (vehiclesRes.ok) {
                const res = await vehiclesRes.json();
                setVehicles(res.data || []);
            }
            if (bookingsRes.ok) {
                const res = await bookingsRes.json();
                setBookings(res.data || []);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load initial data');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto calculate when relevant fields change
    useEffect(() => {
        const pickKm = Number(formData.pick_km) || 0;
        const dropKm = Number(formData.drop_km) || 0;
        const baseKm = Number(formData.base_km) || 0;
        const baseHours = Number(formData.base_hours) || 0;
        const basePrice = Number(formData.base_price) || 0;
        const extraHourRate = Number(formData.extra_hour_rate) || 0;
        const extraKmRate = Number(formData.extra_km_rate) || 0;

        let calcTotalKm = dropKm - pickKm;
        if (calcTotalKm < 0) calcTotalKm = 0; // Validation handles this, but visually avoid negative

        const calcExtraKm = Math.max(0, calcTotalKm - baseKm);

        let calcTotalHours = 0;
        if (formData.start_time && formData.end_time) {
            const start = new Date(formData.start_time);
            const end = new Date(formData.end_time);
            if (end > start) {
                const diffMs = end.getTime() - start.getTime();
                calcTotalHours = diffMs / (1000 * 60 * 60);
            }
        }

        const calcExtraHours = Math.max(0, calcTotalHours - baseHours);

        const calculatedAmount = basePrice + (calcExtraHours * extraHourRate) + (calcExtraKm * extraKmRate);

        const finalAmount = formData.is_override && formData.override_amount !== ''
            ? Number(formData.override_amount)
            : calculatedAmount;

        setCalculations({
            total_km: calcTotalKm,
            extra_km: calcExtraKm,
            total_hours: calcTotalHours,
            extra_hours: calcExtraHours,
            calculated_amount: calculatedAmount,
            final_amount: finalAmount
        });

    }, [
        formData.pick_km, formData.drop_km, formData.start_time, formData.end_time,
        formData.base_hours, formData.base_km, formData.base_price,
        formData.extra_hour_rate, formData.extra_km_rate,
        formData.override_amount, formData.is_override
    ]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Auto-fill customer details if booking is selected
        if (name === 'booking_id' && value) {
            const selectedBooking = bookings.find(b => b._id === value);
            if (selectedBooking) {
                setFormData(prev => ({
                    ...prev,
                    customer_name: selectedBooking.customer_name || prev.customer_name,
                    vehicle_id: selectedBooking.vehicle_id?._id || prev.vehicle_id
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const pickKm = Number(formData.pick_km);
        const dropKm = Number(formData.drop_km);

        if (dropKm <= pickKm) {
            alert('Drop KM must be greater than Pick KM');
            return;
        }

        const start = new Date(formData.start_time);
        const end = new Date(formData.end_time);

        if (end <= start) {
            alert('End Time must be after Start Time');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            ...formData,
            override_amount: formData.is_override ? (formData.override_amount || calculations.calculated_amount) : undefined
        };

        // Remove boolean flag before sending
        delete payload.is_override;

        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create invoice');
            }

            alert('Invoice created successfully');
            router.push('/admin/invoices');
            router.refresh();
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert(error.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400">Loading form data...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/invoices"
                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Generate Invoice</h1>
                    <p className="text-slate-400 text-sm mt-1">KM and time based billing</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - Inputs */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Basic Info */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FileText size={18} className="text-blue-400" />
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Booking (Optional)</label>
                                <select
                                    name="booking_id"
                                    value={formData.booking_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Select Booking</option>
                                    {bookings.map(b => (
                                        <option key={b._id} value={b._id}>{b.booking_no} - {b.customer_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Vehicle *</label>
                                <select
                                    name="vehicle_id"
                                    required
                                    value={formData.vehicle_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Select Vehicle</option>
                                    {vehicles.map(v => (
                                        <option key={v._id} value={v._id}>{v.vehicle_no}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-400 mb-1">Customer Name *</label>
                                <input
                                    type="text"
                                    name="customer_name"
                                    required
                                    value={formData.customer_name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Enter customer name"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Odometer & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Car size={18} className="text-emerald-400" />
                                Odometer
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Pick KM *</label>
                                    <input
                                        type="number"
                                        name="pick_km"
                                        required
                                        min="0"
                                        value={formData.pick_km}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Drop KM *</label>
                                    <input
                                        type="number"
                                        name="drop_km"
                                        required
                                        min="0"
                                        value={formData.drop_km}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Clock size={18} className="text-purple-400" />
                                Duration
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Start Time *</label>
                                    <input
                                        type="datetime-local"
                                        name="start_time"
                                        required
                                        value={formData.start_time}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">End Time *</label>
                                    <input
                                        type="datetime-local"
                                        name="end_time"
                                        required
                                        value={formData.end_time}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Rules */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CreditCard size={18} className="text-amber-400" />
                            Pricing Rules
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Base Package Price (₹)</label>
                                <input type="number" name="base_price" required min="0" value={formData.base_price} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Base Package Hours</label>
                                <input type="number" name="base_hours" required min="0" value={formData.base_hours} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Base KM Included</label>
                                <input type="number" name="base_km" required min="0" value={formData.base_km} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Extra Hour Rate (₹/hr)</label>
                                <input type="number" name="extra_hour_rate" required min="0" value={formData.extra_hour_rate} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Extra KM Rate (₹/km)</label>
                                <input type="number" name="extra_km_rate" required min="0" value={formData.extra_km_rate} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column - Live Calculation */}
                <div>
                    <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-24">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-4">
                            <Calculator size={18} className="text-blue-400" />
                            Live Calculation
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Total KM:</span>
                                <span className="text-white font-medium">{calculations.total_km} km</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Extra KM:</span>
                                <span className="text-amber-400 font-medium">{calculations.extra_km} km</span>
                            </div>

                            <div className="h-px bg-slate-800 my-2"></div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Total Duration:</span>
                                <span className="text-white font-medium">{calculations.total_hours.toFixed(2)} hrs</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Extra Duration:</span>
                                <span className="text-amber-400 font-medium">{calculations.extra_hours.toFixed(2)} hrs</span>
                            </div>

                            <div className="h-px bg-slate-800 my-2"></div>

                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 font-medium">Calculated Amount:</span>
                                <span className="text-lg font-bold text-white">₹{calculations.calculated_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>

                            <div className="pt-4 border-t border-slate-800 mt-4">
                                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_override"
                                        checked={formData.is_override}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                                    />
                                    <span className="text-sm text-slate-400">Manual Override Amount</span>
                                </label>

                                {formData.is_override && (
                                    <div className="mb-4">
                                        <input
                                            type="number"
                                            name="override_amount"
                                            value={formData.override_amount}
                                            onChange={handleChange}
                                            placeholder="Enter override amount"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                        />
                                    </div>
                                )}

                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex justify-between items-center mt-4">
                                    <span className="text-blue-400 font-medium">Final Amount</span>
                                    <span className="text-2xl font-bold text-blue-400">
                                        ₹{calculations.final_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            {isSubmitting ? (
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <Save size={20} />
                            )}
                            {isSubmitting ? 'Saving...' : 'Save Invoice'}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
}
