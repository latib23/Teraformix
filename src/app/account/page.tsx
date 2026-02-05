
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { auth } from '../../lib/auth';
import { api } from '../../lib/api';
import { Order, FormSubmission, SubmissionType } from '../../types';
import { Package, FileText, Clock, CheckCircle, Truck, AlertTriangle, ChevronDown, ChevronUp, MapPin, Search } from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
  const s = status.toUpperCase();
  if (s === 'PROCESSING' || s === 'NEW') return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Processing</span>;
  if (s === 'SHIPPED' || s === 'QUOTE SENT' || s === 'QUOTE_READY') return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck className="w-3 h-3" /> {s === 'SHIPPED' ? 'Shipped' : 'Quote Ready'}</span>;
  if (s === 'DELIVERED' || s === 'COMPLETED') return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Completed</span>;
  if (s === 'PENDING_APPROVAL' || s === 'PENDING') return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" /> Pending</span>;
  return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold w-fit">{status}</span>;
};

const AccountPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.getUser());
  const [activeTab, setActiveTab] = useState<'orders' | 'requests'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const userId = auth.getUserId();
    setLoading(true);
    (async () => {
      if (!userId) return;
      try {
        const fetchedOrders = await api.get<Array<Order>>('/orders/my');
        setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);

        const fetchedQuotes = await api.get<Array<any>>('/quotes/my');
        const mapped: FormSubmission[] = (Array.isArray(fetchedQuotes) ? fetchedQuotes : []).map((q: any): FormSubmission => ({
          id: q.id,
          type: (q.type === 'BOM_UPLOAD' ? 'BOM_UPLOAD' : q.type === 'BULK_QUOTE' ? 'BULK_QUOTE' : 'CONCIERGE') as SubmissionType,
          submittedAt: q.createdAt,
          sourceUrl: '',
          status: (q.status === 'REVIEWED' ? 'QUOTE_READY' : q.status === 'ACCEPTED' ? 'COMPLETED' : 'PENDING') as FormSubmission['status'],
          data: {
            name: q.guestName,
            email: (q.user?.email) || q.guestEmail,
            phone: q.guestPhone,
            company: q.guestCompany,
            parts: q.submissionData?.parts,
            timeline: q.submissionData?.timeline,
            fileName: q.submissionData?.fileName,
            notes: q.submissionData?.notes,
            quoteNumber: q.referenceNumber,
          }
        }));
        setRequests(mapped);
      } catch (_e) {
        setOrders([]);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    })();

  }, [navigate, user.email]);

  const toggleExpand = (id: string) => {
      setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-navy-900">My Account</h1>
                    <p className="text-gray-500 mt-1">Welcome back, {user.name}</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'orders' ? 'bg-navy-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <div className="flex items-center gap-2"><Package className="w-4 h-4" /> My Orders</div>
                    </button>
                    <button 
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'requests' ? 'bg-navy-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Quote Requests</div>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                        <div className="h-64 w-full bg-gray-100 rounded"></div>
                    </div>
                </div>
            ) : (
                <>
                    {/* ORDERS TAB */}
                    {activeTab === 'orders' && (
                        <div className="space-y-4">
                            {orders.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-navy-900">No Orders Yet</h3>
                                    <p className="text-gray-500 mb-6">Start building your infrastructure today.</p>
                                    <button onClick={() => navigate('/category')} className="bg-action-600 text-white px-6 py-2 rounded font-bold hover:bg-action-500 transition">Browse Catalog</button>
                                </div>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div 
                                            className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-gray-50 transition border-b border-gray-100"
                                            onClick={() => toggleExpand(order.id)}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-bold text-navy-900">{order.id}</span>
                                                    <StatusBadge status={order.status} />
                                                </div>
                                                <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()} • {order.items?.length} Items</span>
                                            </div>
                                            <div className="flex items-center gap-6 mt-4 md:mt-0">
                                                <span className="text-lg font-bold text-navy-900">${Number(order.total).toLocaleString()}</span>
                                                {expandedId === order.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                            </div>
                                        </div>
                                        
                                        {expandedId === order.id && (
                                            <div className="bg-gray-50 p-6 border-t border-gray-200 animate-fadeIn">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><MapPin className="w-3 h-3" /> Shipping Address</h4>
                                                        <div className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                                                            <p className="font-bold">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                                                            <p>{order.shippingAddress?.street}</p>
                                                            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Method</h4>
                                                        <div className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                                                            {order.paymentMethod === 'PO' ? (
                                                                <p className="font-mono">Purchase Order: <strong>{order.poNumber}</strong></p>
                                                            ) : (
                                                                <p>Credit Card</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Items Ordered</h4>
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left">Product</th>
                                                                <th className="px-4 py-2 text-center">Qty</th>
                                                                <th className="px-4 py-2 text-right">Price</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {order.items?.map((item: any, idx: number) => (
                                                                <tr key={idx} className="border-b last:border-0">
                                                                    <td className="px-4 py-3">
                                                                        <div className="font-medium text-navy-900">{item.name}</div>
                                                                        <div className="text-xs text-gray-500 font-mono">{item.sku}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                                    <td className="px-4 py-3 text-right font-medium">${((item.basePrice || item.price) * item.quantity).toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* REQUESTS TAB */}
                    {activeTab === 'requests' && (
                        <div className="space-y-4">
                            {requests.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-navy-900">No Quote Requests</h3>
                                    <p className="text-gray-500 mb-6">Need a custom configuration or bulk pricing?</p>
                                    <button onClick={() => navigate('/upload-bom')} className="bg-navy-900 text-white px-6 py-2 rounded font-bold hover:bg-navy-800 transition">Upload BOM</button>
                                </div>
                            ) : (
                                requests.map(req => (
                                    <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-lg font-bold text-navy-900">{req.type === 'BOM_UPLOAD' ? 'BOM Upload' : 'Concierge Request'}</span>
                                                <StatusBadge status={req.status} />
                                            </div>
                                            <p className="text-sm text-gray-500 font-mono mb-2">Ref: {req.data?.quoteNumber || req.id}</p>
                                            {req.data?.parts && (
                                                <p className="text-sm text-gray-600 line-clamp-1 max-w-md">"{req.data.parts}"</p>
                                            )}
                                            {req.data?.fileName && (
                                                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                                    <FileText className="w-3 h-3" /> {req.data.fileName}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 md:mt-0 text-right">
                                            <p className="text-xs text-gray-400 mb-1">{new Date(req.submittedAt).toLocaleDateString()}</p>
                                            {req.status === 'QUOTE_READY' && (
                                                <button className="bg-green-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-green-500 transition">Download Quote</button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountPage;
