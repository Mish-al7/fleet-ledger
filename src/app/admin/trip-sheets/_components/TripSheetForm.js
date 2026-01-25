'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Download, Trash2 } from 'lucide-react';
import Link from 'next/link';

// InputGroup defined OUTSIDE the component to prevent re-renders losing focus
const InputGroup = ({ label, name, type = 'text', placeholder, className = '', value, onChange }) => (
    <div className={className}>
        <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onWheel={(e) => e.target.blur()}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
    </div>
);

export default function TripSheetForm({ initialData = {}, isEditing = false }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        trip_sheet_date: initialData.trip_sheet_date ? initialData.trip_sheet_date.split('T')[0] : new Date().toISOString().split('T')[0],
        guest_name: initialData.guest_name || '',
        vehicle_type: initialData.vehicle_type || '',
        vehicle_reg_no: initialData.vehicle_reg_no || '',
        trip_details: initialData.trip_details || '',
        garage_km_start: initialData.garage_km_start || '',
        pickup_km: initialData.pickup_km || '',
        drop_km: initialData.drop_km || '',
        garage_km_end: initialData.garage_km_end || '',
        garage_time_start: initialData.garage_time_start || '',
        pickup_time: initialData.pickup_time || '',
        drop_time: initialData.drop_time || '',
        garage_time_end: initialData.garage_time_end || '',
        starting_date: initialData.starting_date ? initialData.starting_date.split('T')[0] : '',
        closing_date: initialData.closing_date ? initialData.closing_date.split('T')[0] : '',
        total_bill_amount: initialData.total_bill_amount || '',
        driver_name: initialData.driver_name || '',
        customer_name: initialData.customer_name || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = isEditing ? `/api/trip-sheets/${initialData._id}` : '/api/trip-sheets';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/admin/trip-sheets');
                router.refresh(); // Refresh server components
            } else {
                const err = await res.json();
                alert(err.error || 'Something went wrong');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to save trip sheet');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this Trip Sheet? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/trip-sheets/${initialData._id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/admin/trip-sheets');
                router.refresh();
            } else {
                alert('Failed to delete');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleDownload = (e) => {
        e.preventDefault();
        window.open(`/api/trip-sheets/${initialData._id}/pdf`, '_blank');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/trip-sheets" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {isEditing ? 'Edit Trip Sheet' : 'New Trip Sheet'}
                        </h1>
                        {isEditing && (
                            <p className="text-sm text-slate-400 font-mono">{initialData.trip_sheet_no}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isEditing && (
                        <>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg transition-colors font-medium border border-red-500/30"
                            >
                                <Trash2 size={18} />
                                Delete
                            </button>
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors font-medium border border-slate-700"
                            >
                                <Download size={18} />
                                PDF
                            </button>
                        </>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Trip Sheet'}
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-8">

                {/* Section 1: Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup
                        label="Trip Sheet Date"
                        name="trip_sheet_date"
                        type="date"
                        value={formData.trip_sheet_date}
                        onChange={handleChange}
                    />
                    <InputGroup
                        label="Guest Name"
                        name="guest_name"
                        placeholder="Enter guest name"
                        value={formData.guest_name}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup
                        label="Type of Vehicle"
                        name="vehicle_type"
                        placeholder="e.g. Sedan, SUV"
                        value={formData.vehicle_type}
                        onChange={handleChange}
                    />
                    <InputGroup
                        label="Vehicle Reg No"
                        name="vehicle_reg_no"
                        placeholder="e.g. KL-XX-YYYY"
                        value={formData.vehicle_reg_no}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Trip Details</label>
                    <textarea
                        name="trip_details"
                        value={formData.trip_details}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Enter trip route and details..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                <div className="h-px bg-slate-800" />

                {/* Section 2: KM & Time Details - Grid Layout matching PDF logic roughly */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Journey Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {/* KM Column */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wide">Kilometers</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Garage KM (Start)" name="garage_km_start" type="number" value={formData.garage_km_start} onChange={handleChange} />
                                <InputGroup label="Pick-Up KM" name="pickup_km" type="number" value={formData.pickup_km} onChange={handleChange} />
                                <InputGroup label="Drop KM" name="drop_km" type="number" value={formData.drop_km} onChange={handleChange} />
                                <InputGroup label="Garage KM (End)" name="garage_km_end" type="number" value={formData.garage_km_end} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Time Column */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-emerald-400 uppercase tracking-wide">Time</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Garage Time (Start)" name="garage_time_start" placeholder="HH:MM" value={formData.garage_time_start} onChange={handleChange} />
                                <InputGroup label="Pick-Up Time" name="pickup_time" placeholder="HH:MM" value={formData.pickup_time} onChange={handleChange} />
                                <InputGroup label="Drop Time" name="drop_time" placeholder="HH:MM" value={formData.drop_time} onChange={handleChange} />
                                <InputGroup label="Garage Time (End)" name="garage_time_end" placeholder="HH:MM" value={formData.garage_time_end} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-800" />

                {/* Section 3: Dates & Billing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputGroup label="Starting Date" name="starting_date" type="date" value={formData.starting_date} onChange={handleChange} />
                    <InputGroup label="Closing Date" name="closing_date" type="date" value={formData.closing_date} onChange={handleChange} />
                    <InputGroup label="Total Bill Amount (₹)" name="total_bill_amount" type="number" className="md:col-span-1" value={formData.total_bill_amount} onChange={handleChange} />
                </div>

                {/* Section 4: Signatures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                    <InputGroup label="Driver's Name" name="driver_name" placeholder="Driver name for signature" value={formData.driver_name} onChange={handleChange} />
                    <InputGroup label="Customer's Name" name="customer_name" placeholder="Customer name for signature" value={formData.customer_name} onChange={handleChange} />
                </div>
            </div>
        </form>
    );
}
