
import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Users, Shield, User, X, Check, Search, Save, Lock } from 'lucide-react';
import { auth } from '../../lib/auth';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'BUYER' | 'SALESPERSON';
    permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
    { id: 'MANAGE_INVENTORY', label: 'Manage Inventory' },
    { id: 'MANAGE_PAYMENT', label: 'Manage Payment Settings' },
    { id: 'VIEW_ORDERS', label: 'View All Orders' },
    { id: 'MANAGE_SYSTEM', label: 'System Settings' },
    { id: 'MANAGE_USERS', label: 'Manage Users' },
];

const UsersManager = () => {
    const currentUser = auth.getUser();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'BUYER' as any, permissions: [] as string[] });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(((res as any).data as UserData[]) || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            await api.patch(`/users/${editingUser.id}/permissions`, {
                role: editingUser.role,
                permissions: editingUser.permissions
            });
            await fetchUsers();
            setEditingUser(null);
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Failed to update user permissions');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password) {
            alert('Email and password are required');
            return;
        }
        setIsSaving(true);
        try {
            await api.post('/auth/register', {
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role,
                permissions: newUser.permissions
            });
            await fetchUsers();
            setIsCreating(false);
            setNewUser({ name: '', email: '', password: '', role: 'BUYER', permissions: [] });
            alert('User created successfully!');
        } catch (error: any) {
            console.error('Failed to create user:', error);
            alert(error?.response?.data?.message || 'Failed to create user');
        } finally {
            setIsSaving(false);
        }
    };

    const togglePermission = (permissionId: string) => {
        if (!editingUser) return;
        const current = editingUser.permissions || [];
        const updated = current.includes(permissionId)
            ? current.filter(p => p !== permissionId)
            : [...current, permissionId];
        setEditingUser({ ...editingUser, permissions: updated });
    };

    const toggleNewUserPermission = (permissionId: string) => {
        const current = newUser.permissions || [];
        const updated = current.includes(permissionId)
            ? current.filter(p => p !== permissionId)
            : [...current, permissionId];
        setNewUser({ ...newUser, permissions: updated });
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
                        <Users className="w-6 h-6" /> User Management
                    </h1>
                    <p className="text-gray-500">Manage user roles and access permissions.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-action-600 hover:bg-action-700 text-white font-bold px-4 py-2 rounded shadow flex items-center gap-2 transition"
                >
                    <User className="w-4 h-4" />
                    Create New User
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Permissions</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading users...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">No users found.</td></tr>
                        ) : (
                            users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold">
                                                {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-navy-900">{u.name || 'No Name'}</div>
                                                <div className="text-xs text-gray-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                                            u.role === 'COMPANY_ADMIN' ? 'bg-blue-100 text-blue-700' :
                                                u.role === 'SALESPERSON' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {u.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {u.role === 'SUPER_ADMIN' ? (
                                            <span className="text-xs text-gray-400 italic">All Permissions</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {(u.permissions || []).map(p => (
                                                    <span key={p} className="px-2 py-0.5 bg-gray-100 border rounded text-xs text-gray-600">
                                                        {AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label || p}
                                                    </span>
                                                ))}
                                                {(!u.permissions || u.permissions.length === 0) && <span className="text-xs text-gray-400">-</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setEditingUser(u)}
                                            className="text-navy-600 hover:text-navy-800 font-medium text-sm border border-navy-200 px-3 py-1 rounded hover:bg-navy-50"
                                        >
                                            Edit Access
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5 text-navy-600" />
                                Edit Access: {editingUser.name || editingUser.email}
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                                    className="w-full border border-gray-300 rounded p-2"
                                >
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                    <option value="COMPANY_ADMIN">Company Admin</option>
                                    <option value="SALESPERSON">Salesperson</option>
                                    <option value="BUYER">Buyer</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Super Admins have full access regardless of permissions.
                                </p>
                            </div>

                            {editingUser.role !== 'SUPER_ADMIN' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Granular Permissions</label>
                                    <div className="space-y-2">
                                        {AVAILABLE_PERMISSIONS.map(perm => (
                                            <label key={perm.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer transition">
                                                <input
                                                    type="checkbox"
                                                    checked={(editingUser.permissions || []).includes(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                    className="w-4 h-4 text-navy-600 rounded focus:ring-navy-500"
                                                />
                                                <span className="text-sm font-medium text-gray-800">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-navy-900 text-white font-bold rounded shadow hover:bg-navy-800 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-action-600" />
                                Create New User
                            </h3>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="John Doe"
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-action-600 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="user@example.com"
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-action-600 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Password *</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Minimum 6 characters"
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-action-600 outline-none"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-action-600 outline-none"
                                >
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                    <option value="COMPANY_ADMIN">Company Admin</option>
                                    <option value="SALESPERSON">Salesperson</option>
                                    <option value="BUYER">Buyer</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Super Admins have full access regardless of permissions.
                                </p>
                            </div>

                            {newUser.role !== 'SUPER_ADMIN' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Granular Permissions</label>
                                    <div className="space-y-2">
                                        {AVAILABLE_PERMISSIONS.map(perm => (
                                            <label key={perm.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer transition">
                                                <input
                                                    type="checkbox"
                                                    checked={(newUser.permissions || []).includes(perm.id)}
                                                    onChange={() => toggleNewUserPermission(perm.id)}
                                                    className="w-4 h-4 text-action-600 rounded focus:ring-action-500"
                                                />
                                                <span className="text-sm font-medium text-gray-800">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateUser}
                                disabled={isSaving || !newUser.email || !newUser.password}
                                className="px-6 py-2 bg-action-600 text-white font-bold rounded shadow hover:bg-action-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManager;
