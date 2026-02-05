
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { api } from '../../lib/api';
import { Search, Loader2, Trash2, User, Shield, AlertCircle, Plus, X, Save } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';

interface Buyer {
  id: string;
  name: string;
  email: string;
  joinedAt?: string;
  role: string;
}

const CustomerManager = () => {
  const [customers, setCustomers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<{ name: string; email: string; password: string }>({ name: '', email: '', password: '' });
  const { showToast } = useUI();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const buyers = await api.get<Buyer[]>('/users/buyers');
      if (buyers && Array.isArray(buyers)) {
        setCustomers(buyers);
      } else {
        const local = db.users.getBuyers();
        setCustomers(local);
      }
    } catch (e) {
      const local = db.users.getBuyers();
      setCustomers(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRevokeAccess = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${email}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/users/buyers/${id}`);
      showToast('Access revoked.', 'info');
    } catch (e: any) {
      db.users.delete(id);
      showToast('Server unavailable. Revoked locally.', 'info');
    } finally {
      await fetchCustomers();
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', email: '', password: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.post('/users/buyers', formData);
      if (res) {
        showToast('Customer created successfully.', 'success');
        setIsModalOpen(false);
        await fetchCustomers();
      } else {
        showToast('Failed to create customer.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to create customer.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-lg font-bold text-navy-900">Registered Customers</h3>
           <p className="text-sm text-gray-500">Manage registered buyer accounts and access.</p>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={openAddModal} className="bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold transition">
              <Plus className="w-4 h-4" /> Add Customer
            </button>
            <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
                type="text" 
                placeholder="Search customers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 outline-none w-64 bg-white"
            />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                 <tr>
                   <th className="px-6 py-3">Customer</th>
                   <th className="px-6 py-3">Email</th>
                   <th className="px-6 py-3">Joined</th>
                   <th className="px-6 py-3">Status</th>
                   <th className="px-6 py-3 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr><td colSpan={5} className="text-center p-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
                ) : filteredCustomers.length > 0 ? (
                 filteredCustomers.map((customer) => (
                   <tr key={customer.id} className="hover:bg-gray-50 transition group">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-navy-900">{customer.name}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                     <td className="px-6 py-4 text-gray-500">
                        {customer.joinedAt ? new Date(customer.joinedAt).toLocaleDateString() : 'N/A'}
                     </td>
                     <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                            <Shield className="w-3 h-3" /> Active
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => handleRevokeAccess(customer.id, customer.email)} 
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition flex items-center gap-1 ml-auto" 
                            title="Revoke Access"
                        >
                           <Trash2 className="w-4 h-4" /> <span className="text-xs font-medium">Revoke</span>
                        </button>
                     </td>
                   </tr>
                 ))
                ) : (
                    <tr>
                        <td colSpan={5} className="text-center p-8 text-gray-400 flex flex-col items-center">
                            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                            No customers found matching your search.
                        </td>
                    </tr>
                )}
               </tbody>
             </table>
         </div>
      </div>
    {isModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-bold text-navy-900">Add Customer</h3>
            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6">
            <form id="customerForm" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Temporary Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none" required />
              </div>
            </form>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition">Cancel</button>
            <button type="submit" form="customerForm" disabled={isSaving} className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-70">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isSaving ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default CustomerManager;
