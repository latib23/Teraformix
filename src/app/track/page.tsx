
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Search, Package, FileText, Loader2, CheckCircle, Clock, AlertCircle, ArrowRight, Truck } from 'lucide-react';
import { db } from '../../lib/db';
import { api } from '../../lib/api';
import { Order, FormSubmission } from '../../types';

type TrackResult = 
  | { type: 'ORDER', data: Order }
  | { type: 'QUOTE', data: FormSubmission }
  | null;

const TrackPage = () => {
  const [refNumber, setRefNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackResult>(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [polling, setPolling] = useState<boolean>(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);
    setHasSearched(false);

    try {
        const lowerRef = refNumber.trim();
        const lowerEmail = email.trim().toLowerCase();

        // Try backend: Orders
        try {
          const o = await api.post<any>('/orders/track', { referenceNumber: lowerRef, email: lowerEmail });
          if (o && (o as any).found) {
            const data = (o as any).data;
            setResult({ type: 'ORDER', data: {
              id: data.id,
              company: null,
              total: Number(data.total) || 0,
              paymentMethod: 'STRIPE',
              status: data.status,
              items: [],
              createdAt: data.createdAt,
              shippingAddress: data.shippingAddress,
              billingAddress: data.billingAddress,
            } as any });
            return;
          }
        } catch (_e) { /* continue to quotes */ }

        // Try backend: Quotes
        try {
          const q = await api.post<any>('/quotes/track', { referenceNumber: lowerRef, email: lowerEmail });
          if (q && (q as any).found) {
            const m = (q as any).data;
            const mapped: FormSubmission = {
              id: m.id,
              type: m.type,
              submittedAt: m.createdAt,
              sourceUrl: '',
              status: m.status === 'REVIEWED' ? 'QUOTE_READY' : m.status === 'ACCEPTED' ? 'COMPLETED' : m.status === 'REJECTED' ? 'ARCHIVED' : 'PENDING',
              data: {
                name: '',
                email: lowerEmail,
                company: '',
                phone: '',
                parts: m.submissionData?.parts,
                timeline: m.submissionData?.timeline,
                fileName: m.submissionData?.fileName,
                quoteNumber: m.referenceNumber,
              }
            };
            setResult({ type: 'QUOTE', data: mapped });
            return;
          }
        } catch (_e) { /* fall through */ }

        setError('No record found matching that Reference Number and Email.');

    } catch (err) {
        setError('An error occurred while tracking. Please try again.');
    } finally {
        setIsLoading(false);
        setHasSearched(true);
    }
  };

  React.useEffect(() => {
    if (!result || !hasSearched) return;
    if (polling) return;
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const lowerRef = refNumber.trim();
        const lowerEmail = email.trim().toLowerCase();
        if (result.type === 'ORDER') {
          const o = await api.post<any>('/orders/track', { referenceNumber: lowerRef, email: lowerEmail });
          if (o && (o as any).found) {
            const data = (o as any).data;
            setResult({ type: 'ORDER', data: {
              id: data.id,
              company: null,
              total: Number(data.total) || 0,
              paymentMethod: 'STRIPE',
              status: data.status,
              items: [],
              createdAt: data.createdAt,
              shippingAddress: data.shippingAddress,
              billingAddress: data.billingAddress,
            } as any });
          }
        } else {
          const q = await api.post<any>('/quotes/track', { referenceNumber: lowerRef, email: lowerEmail });
          if (q && (q as any).found) {
            const m = (q as any).data;
            const mapped: FormSubmission = {
              id: m.id,
              type: m.type,
              submittedAt: m.createdAt,
              sourceUrl: '',
              status: m.status === 'REVIEWED' ? 'QUOTE_READY' : m.status === 'ACCEPTED' ? 'COMPLETED' : m.status === 'REJECTED' ? 'ARCHIVED' : 'PENDING',
              data: {
                name: '',
                email: lowerEmail,
                company: '',
                phone: '',
                parts: m.submissionData?.parts,
                timeline: m.submissionData?.timeline,
                fileName: m.submissionData?.fileName,
                quoteNumber: m.referenceNumber,
              }
            };
            setResult({ type: 'QUOTE', data: mapped });
          }
        }
      } catch { /* ignore */ }
    }, 10000);
    return () => { clearInterval(interval); setPolling(false); };
  }, [result, hasSearched]);

  // Helper for Status Timeline
  const renderTimeline = (status: string, type: 'ORDER' | 'QUOTE') => {
      const steps = type === 'ORDER' 
        ? ['Processing', 'Shipped', 'Delivered']
        : ['Received', 'In Review', 'Quote Ready'];
      
      const statusMap: Record<string, number> = {
          // Orders
          'PENDING_APPROVAL': 0,
          'PROCESSING': 0,
          'SHIPPED': 1,
          'DELIVERED': 2,
          'CANCELLED': -1,
          // Quotes
          'PENDING': 0,
          'QUOTE_READY': 2,
          'COMPLETED': 2,
          'ARCHIVED': -1
      };

      const currentStep = statusMap[status] ?? 0;
      const isCancelled = status === 'CANCELLED' || status === 'REJECTED';

      if (isCancelled) {
          return (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-red-700 flex items-center gap-3 mb-6">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-bold">This request has been cancelled.</span>
              </div>
          );
      }

      return (
          <div className="relative flex justify-between mb-8 mt-4">
              {/* Progress Bar Background */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
              
              {/* Active Progress */}
              <div 
                className="absolute top-1/2 left-0 h-1 bg-action-500 -translate-y-1/2 z-0 transition-all duration-1000"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              ></div>

              {steps.map((step, idx) => {
                  const isCompleted = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                      <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isCompleted ? 'bg-action-500 border-action-500 text-white' : 'bg-white border-gray-300 text-gray-300'}`}>
                              {isCompleted ? <CheckCircle className="w-5 h-5" /> : <div className="w-2 h-2 bg-current rounded-full"></div>}
                          </div>
                          <span className={`text-xs font-bold ${isCurrent ? 'text-navy-900' : 'text-gray-400'}`}>{step}</span>
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-16 flex flex-col items-center">
        <div className="text-center max-w-2xl mb-10">
            <h1 className="text-3xl font-bold text-navy-900 mb-3">Track Order or Quote</h1>
            <p className="text-gray-500">Enter your reference number (ORD-... or QTE-...) and email address to check the real-time status of your request.</p>
        </div>

        <div className="w-full max-w-xl bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
                <form onSubmit={handleTrack} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-navy-900 mb-1">Reference Number</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                value={refNumber}
                                onChange={(e) => setRefNumber(e.target.value)}
                                placeholder="e.g. QTE-172930-4821"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 outline-none font-mono text-sm"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-navy-900 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="procurement@company.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 outline-none text-sm"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold py-3.5 rounded-lg shadow-md transition flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Track Status'}
                    </button>
                </form>
            </div>

            {/* Results Section */}
            <div className="bg-gray-50 min-h-[100px]">
                {isLoading && (
                    <div className="flex items-center justify-center h-32 text-gray-500 gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" /> Searching database...
                    </div>
                )}

                {!isLoading && hasSearched && !result && error && (
                    <div className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mb-3">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-navy-900">Not Found</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">{error}</p>
                    </div>
                )}

                {!isLoading && result && (
                    <div className="p-8 animate-fadeIn">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-action-600">
                                    {result.type === 'ORDER' ? <Package className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{result.type === 'ORDER' ? 'Order' : 'Quote Request'}</span>
                                    <span className="block text-xl font-mono font-bold text-navy-900 tracking-tight">
                                        {result.type === 'ORDER' ? ((result as any).data?.referenceNumber || result.data.id) : (result.data.data?.quoteNumber || 'Unknown')}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs text-gray-500">Date</span>
                                <span className="font-medium text-navy-900">
                                    {result.type === 'ORDER' 
                                        ? new Date(result.data.createdAt).toLocaleDateString() 
                                        : new Date(result.data.submittedAt).toLocaleDateString()
                                    }
                                </span>
                            </div>
                        </div>

                        {renderTimeline(result.data.status, result.type)}

                        <div className="bg-white border border-gray-200 rounded-lg p-5 mt-6">
                            <h4 className="text-sm font-bold text-navy-900 mb-3 border-b border-gray-100 pb-2">Details</h4>
                            
                                    {result.type === 'ORDER' ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Status</span>
                                                <span className="font-bold text-navy-900">{result.data.status}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Total</span>
                                                <span className="font-bold text-navy-900">${Number(result.data.total).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Items</span>
                                                <span className="font-medium text-navy-900">{result.data.items?.length || 0} Product(s)</span>
                                            </div>
                                            {result.data.status === 'SHIPPED' && (
                                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between bg-blue-50 p-3 rounded">
                                                    <span className="text-blue-700 font-bold flex items-center gap-2"><Truck className="w-4 h-4"/> Shipment in transit</span>
                                                    <span className="font-mono text-blue-800">Contact support for tracking details</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Status</span>
                                                <span className="font-bold text-navy-900">
                                                    {result.data.status === 'QUOTE_READY' ? 'Quote Ready' : result.data.status === 'COMPLETED' ? 'Completed' : result.data.status === 'ARCHIVED' ? 'Archived' : 'Received'}
                                                </span>
                                            </div>
                                    <div className="text-sm">
                                        <span className="text-gray-600 block mb-1">Request</span>
                                        <p className="font-medium text-navy-900 line-clamp-2 bg-gray-50 p-2 rounded border border-gray-100">
                                            {result.data.data?.parts || result.data.data?.fileName || "BOM Upload"}
                                        </p>
                                    </div>
                                    {result.data.status === 'QUOTE_READY' && (
                                        <div className="mt-4">
                                            <button className="w-full py-2 bg-action-600 text-white text-sm font-bold rounded hover:bg-action-500 transition">
                                                Download Official Quote (PDF)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 text-center">
                            <Link to="/account" className="text-sm font-semibold text-navy-700 hover:text-action-600 flex items-center justify-center gap-1">
                                Login to view full history <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackPage;
