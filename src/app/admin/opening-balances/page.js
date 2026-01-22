'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function OpeningBalancesPage() {
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updates, setUpdates] = useState({}); // Local state for edits
    const [saving, setSaving] = useState(null); // ID being saved

    useEffect(() => {
        fetchBalances();
    }, []);

    async function fetchBalances() {
        try {
            // We can use the generic API which returns all balances with populated vehicle info.
            // Wait, endpoint is `/api/opening-balances` (Admin only).
            // Does it return *all* vehicles even with 0 balance? 
            // Actually, we need to list ALL vehicles, then join with balances.
            // My API `GET /api/opening-balances` returns `OpeningBalance` docs.
            // If a vehicle has no OB set, it won't be in the list.
            // Better approach: Fetch ALL vehicles, and merge with OB data.
            // For simplicity/speed: I'll just fetch `/api/user/vehicles` (returns all active for admin) 
            // AND `/api/opening-balances` and merge them.

            const [vRes, obRes] = await Promise.all([
                fetch('/api/user/vehicles'),
                fetch('/api/opening-balances')
            ]);

            const vJson = await vRes.json();
            const obJson = await obRes.json();

            if (vJson.success && obJson.success) {
                const merged = vJson.data.map(v => {
                    const found = obJson.data.find(ob => ob.vehicle_id._id === v._id);
                    return {
                        vehicle_id: v._id,
                        vehicle_no: v.vehicle_no,
                        opening_balance: found ? found.opening_balance : 0
                    };
                });
                setBalances(merged);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleUpdate = (id, value) => {
        setUpdates(prev => ({ ...prev, [id]: value }));
    };

    const saveBalance = async (vehicleId, currentVal) => {
        const newVal = updates[vehicleId];
        if (newVal === undefined) return; // No change

        setSaving(vehicleId);
        try {
            await fetch('/api/opening-balances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicle_id: vehicleId,
                    opening_balance: Number(newVal)
                })
            });
            // Refresh to confirm sync
            await fetchBalances();
            setUpdates(prev => {
                const next = { ...prev };
                delete next[vehicleId];
                return next;
            });
        } catch (err) {
            alert('Failed to save');
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="text-slate-500">Loading configurations...</div>;

    return (
        <div className="max-w-3xl border border-slate-800 rounded-xl bg-slate-900 overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-900">
                <h1 className="text-xl font-bold text-white">Opening Balances</h1>
                <p className="text-slate-400 text-sm mt-1">Set the initial carry-forward balance for each vehicle.</p>
            </div>

            <div className="divide-y divide-slate-800">
                {balances.map(item => {
                    const isEdited = updates[item.vehicle_id] !== undefined;
                    return (
                        <div key={item.vehicle_id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                                    {item.vehicle_no.slice(0, 2)}
                                </div>
                                <span className="font-mono text-white font-medium">{item.vehicle_no}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                    <input
                                        type="number"
                                        className="bg-slate-950 border border-slate-700 text-white rounded-lg py-2 pl-7 pr-3 w-32 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
                                        placeholder="0"
                                        value={updates[item.vehicle_id] ?? item.opening_balance}
                                        onChange={(e) => handleUpdate(item.vehicle_id, e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                    />
                                </div>

                                {isEdited && (
                                    <button
                                        onClick={() => saveBalance(item.vehicle_id)}
                                        disabled={saving === item.vehicle_id}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
                                        title="Save"
                                    >
                                        <Save size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-yellow-500/5 text-yellow-500 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>Changing opening balance will affect the running balance of ALL future trips immediately.</span>
            </div>
        </div>
    );
}
