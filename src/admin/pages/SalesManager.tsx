
import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { db } from '../../lib/db';
import { DollarSign, Edit, Loader2, Save, Target, User as UserIcon, Users, X, Plus, Calendar, BarChart, Link as LinkIcon, Unlink } from 'lucide-react';

interface SalesPerson {
  id: string;
  name: string;
  email: string;
  totalSales: number;
  target: number; 
  quarterlyTarget: number;
  role: string;
}

const SalesManager = () => {
    const [salesTeam, setSalesTeam] = useState<SalesPerson[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [targets, setTargets] = useState({ monthly: 0, quarterly: 0 });
    const [linkTargets, setLinkTargets] = useState(true);
    const [editingUser, setEditingUser] = useState<SalesPerson | null>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '' });
    const [addError, setAddError] = useState('');
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await api.get<SalesPerson[]>('/users/salespeople');
            if (data) {
                setSalesTeam(data);
                setIsOfflineMode(false);
            } else {
                throw new Error("No data");
            }
        } catch (error) {
            console.warn("Failed to fetch sales team from API, using local data", error);
            setIsOfflineMode(true);
            const users = db.users.getSalespeople();
            setSalesTeam(users.map((u: any) => ({
                ...u,
                totalSales: u.totalSales || 0
            })));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openEditModal = (user: SalesPerson) => {
        setEditingUser(user);
        setTargets({
            monthly: user.target || 0,
            quarterly: user.quarterlyTarget || (user.target * 3)
        });
        setLinkTargets(true);
        setIsEditModalOpen(true);
    };

    const handleTargetChange = (type: 'monthly' | 'quarterly', value: string) => {
        const numValue = parseFloat(value) || 0;
        
        if (linkTargets) {
            if (type === 'quarterly') {
                setTargets({
                    quarterly: numValue,
                    monthly: parseFloat((numValue / 3).toFixed(2))
                });
            } else {
                setTargets({
                    monthly: numValue,
                    quarterly: numValue * 3
                });
            }
        } else {
            setTargets(prev => ({
                ...prev,
                [type]: numValue
            }));
        }
    };

    const handleSaveTarget = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            await api.patch(`/users/${editingUser.id}/target`, { 
                monthlyTarget: targets.monthly,
                quarterlyTarget: targets.quarterly
            });
        } catch (error) {
            console.warn("Failed to update target via API, saving locally.", error);
            db.users.update(editingUser.id, {
                target: targets.monthly,
                quarterlyTarget: targets.quarterly
            });
        } finally {
            await fetchData();
            setIsEditModalOpen(false);
            setIsSaving(false);
        }
    };

    const openAddModal = () => {
        setNewUserData({ name: '', email: '', password: '' });
        setAddError('');
        setIsAddModalOpen(true);
    };

    const handleCreateSalesperson = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setAddError('');
        
        if (!newUserData.email || !newUserData.name || !newUserData.password) {
             setAddError("All fields are required.");
             setIsSaving(false);
             return;
        }

        try {
            await api.post('/users/salespeople', newUserData);
        } catch (error: any) {
            console.warn("Creation via API failed, adding locally.", error);
            try {
                db.users.add({
                    ...newUserData,
                    role: 'SALESPERSON',
                    totalSales: 0,
                    target: 0,
                    quarterlyTarget: 0
                });
            } catch (dbErr: any) {
                setAddError(dbErr.message || "Failed to create user");
                setIsSaving(false);
                return;
            }
        } 
        
        await fetchData();
        setIsAddModalOpen(false);
        setIsSaving(false);
    };
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                        Sales Team Management
                        {isOfflineMode && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">Offline Mode</span>}
                    </h3>
                    <p className="text-sm text-gray-500">Set monthly and quarterly targets for your sales force.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold transition"
                >
                    <Plus className="w-4 h-4" /> Add Salesperson
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Salesperson</th>
                                <th className="px-6 py-3">Total Sales (Lifetime)</th>
                                <th className="px-6 py-3">Monthly Target</th>
                                <th className="px-6 py-3">Quarterly Target</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
                            ) : salesTeam.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-8 text-gray-400">No salespeople found. Add one to get started.</td></tr>
                            ) : salesTeam.map(user => {
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 group transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-navy-700">
                                                    {(user.name ? user.name.charAt(0) : user.email.charAt(0)).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-navy-900">{user.name || 'Sales Person'}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-navy-800">{formatCurrency(user.totalSales || 0)}</td>
                                        <td className="px-6 py-4 text-gray-600">{formatCurrency(user.target || 0)}</td>
                                        <td className="px-6 py-4 text-gray-600">{formatCurrency(user.quarterlyTarget || 0)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openEditModal(user)} className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
                                                <Edit className="w-3 h-3" /> Set Targets
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <header className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2"><Target className="w-5 h-5 text-action-600"/> Set Sales Targets</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </header>
                        <main className="p-6 space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart className="w-4 h-4 text-blue-600"/>
                                    <label className="text-sm font-bold text-navy-900">Quarterly Target</label>
                                </div>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                    <input 
                                        type="number" 
                                        value={targets.quarterly}
                                        onChange={e => handleTargetChange('quarterly', e.target.value)}
                                        className="w-full pl-9 border-gray-300 rounded-lg text-sm bg-white py-2 focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                                    />
                                </div>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-gray-500"/>
                                    <label className="text-sm font-semibold text-gray-700">Monthly Breakdown</label>
                                </div>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                    <input 
                                        type="number" 
                                        value={targets.monthly}
                                        onChange={e => handleTargetChange('monthly', e.target.value)}
                                        className="w-full pl-9 border-gray-300 rounded-lg text-sm bg-white py-2 focus:ring-2 focus:ring-navy-900 outline-none"
                                    />
                                </div>
                            </div>
                        </main>
                        <footer className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg">Cancel</button>
                            <button onClick={handleSaveTarget} disabled={isSaving} className="px-4 py-2 bg-navy-900 text-white text-sm font-bold rounded-lg shadow-sm disabled:bg-gray-300 flex items-center gap-2 hover:bg-navy-800 transition">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                                Save Targets
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
                    <form onSubmit={handleCreateSalesperson} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <header className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2"><UserIcon className="w-5 h-5 text-action-600"/> Add New Salesperson</h3>
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </header>
                        <main className="p-6 space-y-4">
                             {addError && <p className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200 flex items-center gap-2"><X className="w-4 h-4"/> {addError}</p>}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Full Name</label>
                                <input type="text" required value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} className="w-full border-gray-300 rounded-lg text-sm bg-white px-3 py-2" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Email</label>
                                <input type="email" required value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} className="w-full border-gray-300 rounded-lg text-sm bg-white px-3 py-2" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Password</label>
                                <input type="password" required minLength={8} value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} className="w-full border-gray-300 rounded-lg text-sm bg-white px-3 py-2" />
                            </div>
                        </main>
                        <footer className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition">Cancel</button>
                            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-navy-900 text-white text-sm font-bold rounded-lg shadow-sm disabled:bg-gray-300 flex items-center gap-2 hover:bg-navy-800 transition">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Create User
                            </button>
                        </footer>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SalesManager;
