'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, FileText, ChevronDown, Edit2, Trash2 } from 'lucide-react';

export default function InvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/invoices');
            if (res.ok) {
                const json = await res.json();
                setInvoices(json.data || []);
            } else {
                alert('Failed to fetch invoices');
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            alert('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteInvoice = async (id) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;

        try {
            const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Invoice deleted successfully');
                fetchInvoices();
            } else {
                alert('Failed to delete invoice');
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert('An error occurred');
        }
    };

    const filteredInvoices = invoices.filter(invoice => 
        invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.vehicle_id?.vehicle_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.booking_id?.booking_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Invoices</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage generated invoices</p>
                </div>
                
                <Link
                    href="/admin/invoices/new"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all"
                >
                    <Plus size={20} />
                    <span>Create Invoice</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-4 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by customer, vehicle, or booking..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="p-4 text-xs font-medium text-slate-400 uppercase">Inv No</th>
                                <th className="p-4 text-xs font-medium text-slate-400 uppercase">Date</th>
                                <th className="p-4 text-xs font-medium text-slate-400 uppercase">Customer</th>
                                <th className="p-4 text-xs font-medium text-slate-400 uppercase">Vehicle/Booking</th>
                                <th className="p-4 text-xs font-medium text-slate-400 uppercase">KM & Time</th>
                                <th className="p-4 text-xs font-medium text-slate-400 uppercase">Amount</th>
                                <th className="p-4 text-xs font-medium text-slate-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">Loading invoices...</td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">No invoices found</td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-blue-400">
                                            {invoice.invoice_no}
                                        </td>
                                        <td className="p-4 text-sm text-white">
                                            {new Date(invoice.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-white">{invoice.customer_name}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-emerald-400">{invoice.vehicle_id?.vehicle_no}</div>
                                            {invoice.booking_id && (
                                                <div className="text-xs text-slate-400 mt-1">{invoice.booking_id.booking_no}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-300">Total: {invoice.total_km} km</div>
                                            <div className="text-xs text-slate-500 mt-1">{invoice.total_hours.toFixed(1)} hrs</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-slate-300">₹{invoice.final_amount.toLocaleString('en-IN')}</div>
                                            {invoice.override_amount !== undefined && invoice.override_amount !== invoice.calculated_amount && (
                                                <div className="text-xs text-amber-400 mt-1">Calculated: ₹{invoice.calculated_amount.toLocaleString('en-IN')}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button 
                                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                                    onClick={() => window.open(`/api/invoices/${invoice._id}/pdf`, '_blank')}
                                                    title="View & Print"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                                <Link 
                                                    href={`/admin/invoices/edit/${invoice._id}`}
                                                    className="text-amber-400 hover:text-amber-300"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </Link>
                                                <button 
                                                    className="text-red-400 hover:text-red-300"
                                                    onClick={() => deleteInvoice(invoice._id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
