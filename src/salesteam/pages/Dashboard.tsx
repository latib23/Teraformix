import React, { useState, useEffect } from 'react';
import { fetchJson } from '../../lib/api';
import { DollarSign, Target, TrendingUp, Calendar, BarChart2, PieChart } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, loading, subtitle }: any) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-1">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
        {loading ? (
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-navy-900">{value}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const ProgressCard = ({ title, data, loading, type }: { title: string, data: any, loading: boolean, type: 'month' | 'quarter' }) => {
    if (loading) return <div className="bg-white p-6 rounded-lg h-40 animate-pulse"></div>;
    if (!data) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                    {type === 'month' ? <Calendar className="w-5 h-5 text-action-600" /> : <BarChart2 className="w-5 h-5 text-blue-600" />}
                    {title}
                </h3>
                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">{data.progress.toFixed(1)}% Done</span>
            </div>
            
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Goal</span>
                        <span className="font-bold text-navy-900">${data.target.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Achieved</span>
                        <span className="font-bold text-green-600">${data.value.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Remaining</span>
                        <span className="font-bold text-orange-500">${data.remaining.toLocaleString()}</span>
                    </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${type === 'month' ? 'bg-gradient-to-r from-action-500 to-green-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                        style={{ width: `${data.progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

interface SalesStats {
  monthly: { value: number; target: number; remaining: number; progress: number; };
  quarterly: { value: number; target: number; remaining: number; progress: number; };
}

const SalesDashboard = () => {
    const [stats, setStats] = useState<SalesStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            try {
                const data = await fetchJson<SalesStats>('/dashboard/sales');
                setStats(data);
            } catch (error) {
                console.error("Failed to load sales stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="space-y-8">
            <div className="pb-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-navy-900">Sales Performance</h1>
                <p className="text-gray-500 mt-1">Track your Monthly and Quarterly goals.</p>
            </div>
            
            {/* High Level Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard 
                    title="This Month Sales" 
                    value={stats ? formatCurrency(stats.monthly.value) : '$0'} 
                    subtitle="Current month to date"
                    icon={DollarSign} 
                    color="bg-action-600" 
                    loading={loading} 
                />
                <StatCard 
                    title="This Quarter Sales" 
                    value={stats ? formatCurrency(stats.quarterly.value) : '$0'} 
                    subtitle="Current quarter to date"
                    icon={PieChart} 
                    color="bg-navy-700" 
                    loading={loading} 
                />
            </div>

            {/* Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProgressCard 
                    title="Monthly Target" 
                    type="month"
                    data={stats?.monthly} 
                    loading={loading} 
                />
                <ProgressCard 
                    title="Quarterly Target" 
                    type="quarter"
                    data={stats?.quarterly} 
                    loading={loading} 
                />
            </div>
        </div>
    );
};

export default SalesDashboard;