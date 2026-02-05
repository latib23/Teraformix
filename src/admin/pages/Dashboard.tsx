
import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Users, Package, Loader2 } from 'lucide-react';
import { fetchJson } from '../../lib/api';
import { Order } from '../../types';
import { Link } from 'react-router-dom';
import { auth } from '../../lib/auth';

const StatCard = ({ title, value, icon: Icon, color, loading }: any) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        {loading ? (
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
        ) : (
          <h3 className="text-2xl font-bold text-navy-900">{value}</h3>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  recentOrders: Order[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'unauthorized' | 'checking'>('checking');

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setDbStatus('checking');
      try {
        const user = auth.getUser();
        const role = user?.role || 'BUYER';
        const endpoint = role === 'SUPER_ADMIN' ? '/dashboard/stats' : '/dashboard/sales';

        const data = await fetchJson<DashboardStats>(endpoint);
        setStats(data);
        setDbStatus('connected');
      } catch (error: any) {
        console.error("Failed to load dashboard stats from API.", error);
        const msg = String(error?.message || '');
        if (msg.includes('Not allowed by CORS')) setDbStatus('disconnected');
        else if (msg.includes('Unauthorized') || msg.includes('401') || msg.includes('auth-error')) setDbStatus('unauthorized');
        else setDbStatus('disconnected');
      } finally {
        setLoading(false);
      }
    };
    loadStats();

    const onAuthError = () => setDbStatus('unauthorized');
    window.addEventListener('auth-error', onAuthError);
    return () => window.removeEventListener('auth-error', onAuthError);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : '$0.00'}
          icon={DollarSign}
          color="bg-action-600"
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={stats ? stats.totalOrders.toLocaleString() : '0'}
          icon={ShoppingCart}
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard
          title="Total Customers"
          value={stats ? stats.totalCustomers.toLocaleString() : '0'}
          icon={Users}
          color="bg-purple-500"
          loading={loading}
        />
        <StatCard
          title="Low Stock SKUs"
          value={stats ? stats.lowStockCount.toLocaleString() : '0'}
          icon={Package}
          color="bg-orange-500"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders Stub */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-navy-900 mb-4">Recent Orders</h3>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map(order => (
                    <tr key={order.id} className="group hover:bg-gray-50">
                      <td className="py-3 font-mono text-xs text-navy-700">
                        <Link to="/admin/orders" className="hover:underline">{order.id.substring(0, 8).toUpperCase()}</Link>
                      </td>
                      <td className="py-3 font-medium text-gray-700">{order.company?.name || order.shippingAddress?.firstName || 'Guest'}</td>
                      <td className="py-3 font-semibold text-navy-800">{formatCurrency(order.total)}</td>
                      <td className="py-3 text-xs"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">{order.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">
                      {dbStatus === 'disconnected' ? 'Cannot fetch orders while offline.' : 'No recent orders found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-navy-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Connectivity</span>
              <span className={`flex items-center gap-1.5 text-xs font-bold ${dbStatus === 'connected' ? 'text-green-600' : dbStatus === 'checking' ? 'text-gray-500' : 'text-orange-500'}`}>
                <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-green-500' : dbStatus === 'checking' ? 'bg-gray-400 animate-pulse' : 'bg-orange-500'}`}></div>
                {dbStatus === 'connected' ? 'Operational' : dbStatus === 'checking' ? 'Connecting...' : dbStatus === 'unauthorized' ? 'Login Required' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database Connection</span>
              <span className={`flex items-center gap-1.5 text-xs font-bold ${dbStatus === 'connected' ? 'text-green-600' : dbStatus === 'checking' ? 'text-gray-500' : 'text-orange-500'}`}>
                <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-green-500' : dbStatus === 'checking' ? 'bg-gray-400 animate-pulse' : 'bg-orange-500'}`}></div>
                {dbStatus === 'connected' ? 'Active' : dbStatus === 'checking' ? 'Connecting...' : dbStatus === 'unauthorized' ? 'Login Required' : 'Offline'}
              </span>
            </div>

            {dbStatus !== 'connected' && !loading && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded text-xs text-orange-700">
                {dbStatus === 'unauthorized'
                  ? (<><strong>Admin Login Required:</strong> Please sign in to access dashboard data.</>)
                  : (<><strong>API Unreachable:</strong> The application could not connect to the backend server. Ensure the server is running and the API URL is configured in Settings.</>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
