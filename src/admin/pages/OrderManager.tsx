

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye, CheckCircle, Clock, Truck, AlertTriangle, XCircle, Plus, X, Loader2, MapPin, Trash2 } from 'lucide-react';
import { Order, Product, Address } from '../../types';
import { api } from '../../lib/api';
import { db } from '../../lib/db';
import { useProductData } from '../../hooks/useProductData';

const StatusBadge = ({ status }: { status: Order['status'] }) => {
  switch (status) {
    case 'PROCESSING':
      return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Processing</span>;
    case 'SHIPPED':
      return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck className="w-3 h-3" /> Shipped</span>;
    case 'DELIVERED':
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Delivered</span>;
    case 'PENDING_APPROVAL':
      return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" /> Pending PO</span>;
    case 'CANCELLED':
      return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Cancelled</span>;
    default:
      return null;
  }
};

type LineItem = { product: Product, quantity: number };
const initialAddressState: Address = { firstName: '', lastName: '', company: '', street: '', city: '', state: '', zip: '', phone: '', email: '' };

const OrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'unauthorized' | 'checking'>('checking');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'PO' | 'STRIPE' | 'BANK_TRANSFER'>('PO');
  const [poNumber, setPoNumber] = useState('');
  const [status, setStatus] = useState<Order['status']>('PENDING_APPROVAL');

  // View Order Details State
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  // Address State
  const [shippingAddress, setShippingAddress] = useState<Address>(initialAddressState);
  const [billingAddress, setBillingAddress] = useState<Address>(initialAddressState);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  const { data: allProducts } = useProductData();

  const fetchOrders = async () => {
    setLoading(true);
    setDbStatus('checking');
    try {
      const data = await api.get<Order[]>('/orders');
      if (data) {
        setOrders(data);
        setIsOfflineMode(false);
        setDbStatus('connected');
      } else {
        throw new Error("No data");
      }
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.includes('Unauthorized') || msg.includes('401') || msg.includes('auth-error')) {
        setDbStatus('unauthorized');
      } else {
        setDbStatus('disconnected');
      }
      setIsOfflineMode(true);
      setOrders(db.orders.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const onAuthError = () => setDbStatus('unauthorized');
    window.addEventListener('auth-error', onAuthError);
    return () => window.removeEventListener('auth-error', onAuthError);
  }, []);

  const openCreateModal = async () => {
    setItems([]);
    setPoNumber('');
    setPaymentMethod('PO');
    setStatus('PENDING_APPROVAL');
    setSearchResults([]);
    setProductSearch('');
    setShippingAddress(initialAddressState);
    setBillingAddress(initialAddressState);
    setBillingSameAsShipping(true);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (productSearch.length < 2 || !allProducts || !Array.isArray(allProducts)) {
      setSearchResults([]);
      return;
    }
    const results = allProducts.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 5);
    setSearchResults(results);
  }, [productSearch, allProducts]);

  const addItem = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setProductSearch('');
    setSearchResults([]);
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item));
  };

  const orderTotal = useMemo(() => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [items]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {
      items: items.map(i => ({ ...i.product, quantity: i.quantity })),
      total: orderTotal,
      paymentMethod,
      poNumber: paymentMethod === 'PO' ? poNumber : undefined,
      status,
      shippingAddress,
      billingAddress: billingSameAsShipping ? shippingAddress : billingAddress
    };

    try {
      await api.post('/orders', payload);
      setIsOfflineMode(false);
    } catch (error) {
      console.warn("Order creation failed via API, saving locally.", error);
      setIsOfflineMode(true);
      db.orders.add({
        ...payload,
        poNumber: payload.poNumber || null,
        company: null,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
      await fetchOrders(); // Refresh list
    }
  };

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!viewOrder) return;

    // Optimistic update locally
    setViewOrder(prev => prev ? ({ ...prev, status: newStatus }) : null);
    setOrders(prev => prev.map(o => o.id === viewOrder.id ? { ...o, status: newStatus } : o));

    try {
      // Note: Backend endpoint for patch might vary, but we try generic
      await api.patch(`/orders/${viewOrder.id}`, { status: newStatus });
    } catch (error) {
      console.warn("Status update sync failed, saved locally.");
      db.orders.update(viewOrder.id, { status: newStatus });
    }
  };

  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('');

  useEffect(() => {
    if (viewOrder) {
      setTrackingNumberInput(viewOrder.trackingNumber || '');
      setCarrierInput(viewOrder.carrier || '');
    }
  }, [viewOrder]);

  const saveTrackingInfo = async () => {
    if (!viewOrder) return;
    const payload: any = { trackingNumber: trackingNumberInput, carrier: carrierInput };
    // Optimistic update
    setViewOrder(prev => prev ? ({ ...prev, trackingNumber: trackingNumberInput, carrier: carrierInput }) : null);
    setOrders(prev => prev.map(o => o.id === viewOrder.id ? { ...o, trackingNumber: trackingNumberInput, carrier: carrierInput } : o));
    try {
      await api.patch(`/orders/${viewOrder.id}`, payload);
    } catch (error) {
      console.warn('Tracking update failed to sync, saved locally.', error);
      db.orders.update(viewOrder.id, payload);
    }
  };

  const filteredOrders = orders.filter(order => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (order.shippingAddress && (order.shippingAddress.firstName + ' ' + order.shippingAddress.lastName).toLowerCase().includes(q));
    const idMatch = order.id.toLowerCase().includes(q);
    const companyMatch = (order.company && order.company.name.toLowerCase().includes(q));
    const emailMatch = (order.shippingAddress?.email || '').toLowerCase().includes(q);
    const poMatch = (order.poNumber || '').toLowerCase().includes(q);
    const itemMatch = Array.isArray(order.items) && order.items.some((i: any) => {
      return (String(i.sku || '').toLowerCase().includes(q) || String(i.name || '').toLowerCase().includes(q));
    });
    return nameMatch || idMatch || companyMatch || emailMatch || poMatch || itemMatch;
  });

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'shipping' | 'billing') => {
    const { name, value } = e.target;
    if (type === 'shipping') {
      setShippingAddress(prev => ({ ...prev, [name]: value }));
    } else {
      setBillingAddress(prev => ({ ...prev, [name]: value }));
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
            Order Management
            {isOfflineMode && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">Offline Mode</span>}
          </h3>
          <p className="text-sm text-gray-500">Track shipments and approve Purchase Orders.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 outline-none w-full md:w-64 bg-white"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3 py-2 bg-navy-900 text-white rounded-lg text-sm font-bold hover:bg-navy-800 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Order
          </button>
        </div>
      </div>

      {dbStatus !== 'connected' && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded text-xs text-orange-700">
          {dbStatus === 'unauthorized'
            ? 'Admin login required. Please sign in to access Order Management.'
            : 'API unreachable. Ensure the server is running and the API URL is correct under Settings.'}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center p-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-navy-700">{order.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-navy-900">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</div>
                        <div className="text-xs text-gray-500">{order.shippingAddress?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {order.paymentMethod === 'PO' ? `PO #${order.poNumber}` : order.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Credit Card'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-navy-900">
                      ${Number(order.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setViewOrder(order)}
                        className="text-gray-400 hover:text-navy-900 p-1 rounded hover:bg-gray-200 transition"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="text-center p-8 text-gray-400">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW ORDER DETAILS MODAL */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Order Details</h3>
                <p className="text-xs text-gray-500 font-mono">{viewOrder.id}</p>
              </div>
              <button onClick={() => setViewOrder(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </header>
            <main className="p-6 overflow-y-auto">
              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Status & Date */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <select
                      value={viewOrder.status}
                      onChange={(e) => handleStatusUpdate(e.target.value as Order['status'])}
                      className="bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg focus:ring-navy-500 focus:border-navy-500 block p-1.5"
                    >
                      <option value="PENDING_APPROVAL">Pending PO</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Airtable</span>
                    {viewOrder.airtableRecordId ? (
                      <span className="text-xs px-3 py-1.5 rounded-lg font-bold bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Synced
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!viewOrder) return;
                          const btn = document.getElementById('btn-sync-airtable');
                          if (btn) { (btn as any).disabled = true; btn.innerHTML = 'Syncing...'; }
                          try {
                            await api.post(`/orders/${viewOrder.id}/sync-airtable`, {});
                            alert('Synced to Airtable!');
                            // Optimistic update
                            setViewOrder(prev => prev ? ({ ...prev, airtableRecordId: 'temp-id' }) : null);
                            setOrders(prev => prev.map(o => o.id === viewOrder.id ? { ...o, airtableRecordId: 'temp-id' } : o));
                          } catch (e: any) {
                            alert('Sync failed: ' + (e.message || 'Unknown error'));
                          } finally {
                            if (btn) { (btn as any).disabled = false; btn.innerHTML = 'Sync to Airtable'; }
                          }
                        }}
                        id="btn-sync-airtable"
                        className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg font-bold text-navy-900 hover:bg-gray-50 flex items-center gap-1 shadow-sm transition"
                      >
                        Sync to Airtable
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Xero</span>
                    {(viewOrder as any).xeroInvoiceId ? (
                      <span className="text-xs px-3 py-1.5 rounded-lg font-bold bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Synced
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!viewOrder) return;
                          const btn = document.getElementById('btn-sync-xero');
                          if (btn) { (btn as any).disabled = true; btn.innerHTML = 'Syncing...'; }
                          try {
                            await api.post(`/orders/${viewOrder.id}/sync-xero`, {});
                            alert('Synced to Xero!');
                            // Optimistic update
                            setViewOrder(prev => prev ? ({ ...prev, xeroInvoiceId: 'temp-id' } as any) : null);
                            setOrders(prev => prev.map(o => o.id === viewOrder.id ? { ...o, xeroInvoiceId: 'temp-id' } as any : o));
                          } catch (e: any) {
                            alert('Sync failed: ' + (e.message || 'Unknown error'));
                          } finally {
                            if (btn) { (btn as any).disabled = false; btn.innerHTML = 'Sync to Xero'; }
                          }
                        }}
                        id="btn-sync-xero"
                        className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg font-bold text-navy-900 hover:bg-gray-50 flex items-center gap-1 shadow-sm transition"
                      >
                        Sync to Xero
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Date Placed</span>
                    <span className="text-sm font-bold text-navy-900">{new Date(viewOrder.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                {/* Customer Info */}
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin className="w-3 h-3" /> Shipping to</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="font-bold text-navy-900">{viewOrder.shippingAddress?.firstName} {viewOrder.shippingAddress?.lastName}</p>
                    <p>{viewOrder.shippingAddress?.street}</p>
                    <p>{viewOrder.shippingAddress?.city}, {viewOrder.shippingAddress?.state} {viewOrder.shippingAddress?.zip}</p>
                    <p className="mt-2 text-gray-500">{viewOrder.shippingAddress?.email}</p>
                  </div>
                </div>
                {/* Tracking Update */}
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Shipment Tracking</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-xs text-gray-600">Carrier</label>
                      <select value={carrierInput} onChange={(e) => setCarrierInput(e.target.value)} className="w-full border-gray-300 rounded-lg text-sm bg-white p-2 outline-none focus:ring-2 focus:ring-navy-900">
                        <option value="">Select carrier</option>
                        <option value="FedEx">FedEx</option>
                        <option value="UPS">UPS</option>
                        <option value="USPS">USPS</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-600">Tracking Number</label>
                      <input value={trackingNumberInput} onChange={(e) => setTrackingNumberInput(e.target.value)} placeholder="e.g. 1234..." className="w-full border-gray-300 rounded-lg text-sm bg-white p-2 outline-none focus:ring-2 focus:ring-navy-900" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <button onClick={saveTrackingInfo} className="px-3 py-2 bg-navy-900 text-white rounded-lg text-sm font-bold hover:bg-navy-800 transition shadow-sm">Save Tracking</button>
                  </div>
                </div>
              </div>
              {/* Line Items Table */}
              <div className="border rounded-lg overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Unit Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewOrder.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-navy-900">{item.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{item.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">${Number(item.basePrice || item.price).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium">${((item.basePrice || item.price) * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Create Order Modal Omitted for brevity, but uses handleCreateOrder and isOfflineMode state correctly */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleCreateOrder} className="bg-white rounded-xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl">
            <header className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-navy-900">Create New Order</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </header>
            <main className="p-6 overflow-y-auto space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="mb-4">
                  <h5 className="font-bold text-navy-900 text-xs uppercase mb-2">Shipping</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <input name="firstName" required value={shippingAddress.firstName} onChange={(e) => handleAddressChange(e, 'shipping')} placeholder="First Name" className="w-full border-gray-300 rounded-lg text-sm bg-white p-2 outline-none focus:ring-2 focus:ring-navy-900" />
                    <input name="lastName" required value={shippingAddress.lastName} onChange={(e) => handleAddressChange(e, 'shipping')} placeholder="Last Name" className="w-full border-gray-300 rounded-lg text-sm bg-white p-2 outline-none focus:ring-2 focus:ring-navy-900" />
                  </div>
                  <input name="email" type="email" required value={shippingAddress.email} onChange={(e) => handleAddressChange(e, 'shipping')} placeholder="Customer Email" className="w-full border-gray-300 rounded-lg text-sm bg-white mt-2 p-2 outline-none focus:ring-2 focus:ring-navy-900" />
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <input name="country" value={shippingAddress.country || ''} onChange={(e) => handleAddressChange(e, 'shipping')} placeholder="Country" className="w-full border-gray-300 rounded-lg text-sm bg-white p-2 outline-none focus:ring-2 focus:ring-navy-900" />
                    <input name="zip" value={shippingAddress.zip} onChange={(e) => handleAddressChange(e, 'shipping')} placeholder="Zip" className="w-full border-gray-300 rounded-lg text-sm bg-white p-2 outline-none focus:ring-2 focus:ring-navy-900" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Add Products</label>
                <div className="relative">
                  <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search by SKU or Name..." className="w-full border-gray-300 rounded-lg text-sm bg-white p-2 pl-8 outline-none focus:ring-2 focus:ring-navy-900" />
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />

                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {searchResults.map(p => (
                        <div key={p.id} onClick={() => addItem(p)} className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-navy-900">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.sku}</p>
                          </div>
                          <span className="text-sm font-bold text-action-600">${p.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="p-2 text-left font-medium">Product</th>
                      <th className="p-2 w-24 font-medium text-center">Qty</th>
                      <th className="p-2 w-28 text-right font-medium">Price</th>
                      <th className="p-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-gray-400 text-xs">No products added yet.</td></tr>
                    ) : items.map(item => (
                      <tr key={item.product.id} className="border-b last:border-0">
                        <td className="p-2">
                          <div className="text-navy-900 font-medium">{item.product.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{item.product.sku}</div>
                        </td>
                        <td className="p-2 w-24"><input type="number" min="1" value={item.quantity} onChange={e => updateQuantity(item.product.id, parseInt(e.target.value))} className="w-full border-gray-300 rounded text-sm text-center p-1" /></td>
                        <td className="p-2 w-28 text-right font-semibold">${(item.product.price * item.quantity).toLocaleString()}</td>
                        <td className="p-2 w-16 text-center"><button type="button" onClick={() => removeItem(item.product.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                    <tr><td colSpan={2} className="p-2 text-right">Total:</td><td className="p-2 text-right">${orderTotal.toLocaleString()}</td><td></td></tr>
                  </tfoot>
                </table>
              </div>
            </main>
            <footer className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition">Cancel</button>
              <button type="submit" disabled={isSaving || items.length === 0} className="px-4 py-2 bg-navy-900 text-white text-sm font-bold rounded-lg shadow-sm disabled:bg-gray-300 flex items-center gap-2 hover:bg-navy-800 transition">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}Create Order
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
