'use client';

import { useState, useEffect } from 'react';
import { Save, Building2, MapPin, Phone, Quote, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        companyName: '',
        tagline: '',
        address: '',
        phoneNumbers: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (res.ok) {
                setSettings(data);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to fetch settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while fetching settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await res.json();

            if (res.ok) {
                setSettings(data);
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while saving settings' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Company Settings</h1>
                <p className="text-slate-400 text-sm mt-1">Manage company details for trip sheets</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl border ${message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="space-y-4">
                        {/* Company Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5 flex items-center gap-2">
                                <Building2 size={16} className="text-blue-400" />
                                Business Name
                            </label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                placeholder="Enter company name"
                                required
                            />
                        </div>

                        {/* Tagline */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5 flex items-center gap-2">
                                <Quote size={16} className="text-purple-400" />
                                Business Tagline
                            </label>
                            <input
                                type="text"
                                value={settings.tagline}
                                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                placeholder="e.g. VACATIONS"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5 flex items-center gap-2">
                                <MapPin size={16} className="text-emerald-400" />
                                Address
                            </label>
                            <textarea
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none h-24"
                                placeholder="Enter full address"
                            />
                        </div>

                        {/* Phone Numbers */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5 flex items-center gap-2">
                                <Phone size={16} className="text-amber-400" />
                                Contact Numbers
                            </label>
                            <input
                                type="text"
                                value={settings.phoneNumbers}
                                onChange={(e) => setSettings({ ...settings, phoneNumbers: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                placeholder="e.g. 9847... | 9562..."
                            />
                            <p className="mt-1.5 text-[11px] text-slate-500 italic">Separate multiple numbers with |</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Preview Card */}
            <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">PDF Header Preview</h3>
                <div className="text-center space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-wide">{settings.companyName || 'COMPANY NAME'}</h2>
                    <p className="text-sm font-medium text-slate-400 tracking-[0.2em]">{settings.tagline || 'TAGLINE'}</p>
                    <p className="text-[10px] text-slate-500 mt-2 italic">
                        {settings.address || 'Address Line'} | Mob: {settings.phoneNumbers || '0000000000'}
                    </p>
                </div>
            </div>
        </div>
    );
}
