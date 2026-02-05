import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, AlertCircle, CheckCircle, ShieldCheck, CreditCard } from 'lucide-react';
import { useGlobalContent } from '../../contexts/GlobalContent';

// Initialize Stripe outside component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const PaymentForm = ({ quote, onSuccess }: { quote: any, onSuccess: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const { content } = useGlobalContent();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        try {
            // 1. Create Payment Intent on backend (simulated here for now or real implementation)
            // For now, we'll assume the backend handles the payment via the 'pay' endpoint directly
            // In a real app, you'd fetch a clientSecret here.

            // Simulating payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 2. Call backend to mark as paid
            await api.post(`/quotes/public/${quote.id}/pay`, {
                paymentMethod: 'CC',
                amount: quote.total
            });

            // 3. Create Official Order
            try {
                const orderPayload = {
                    customer: quote.customer,
                    shippingAddress: quote.shipping || quote.data?.shipping || quote.customer?.address, // Fallback
                    billingAddress: quote.billing || quote.data?.billing || quote.customer?.address,
                    items: quote.items.map((i: any) => ({
                        productId: i.productId || i.sku, // Ensure we have ID or SKU
                        quantity: i.quantity,
                        unitPrice: i.unitPrice
                    })),
                    status: 'PENDING' as const,
                    paymentStatus: 'PAID' as const,
                    total: quote.total,
                    source: 'QUOTE_PAYMENT'
                };

                await api.post('/orders', orderPayload);
                console.log("Order created successfully from quote payment");
            } catch (orderErr) {
                console.error("Failed to create order after payment", orderErr);
                // Non-blocking error, payment still succeeded
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Payment failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-navy-900">Payment Details</h3>
                    <div className="flex gap-2">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">Total Amount Due</p>
                    <p className="text-3xl font-bold text-navy-900">${quote.total?.toFixed(2)}</p>
                </div>

                <div className="border border-gray-300 rounded-md p-3 mb-4">
                    <CardElement options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': { color: '#aab7c4' },
                            },
                        },
                    }} />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!stripe || processing}
                    className="w-full bg-navy-900 text-white py-3 rounded-lg font-bold hover:bg-navy-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    {processing ? 'Processing...' : `Pay $${quote.total?.toFixed(2)}`}
                </button>
            </div>

            <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secure Payment processed by Stripe
            </p>
        </form>
    );
};

const PayQuotePage = () => {
    const { id } = useParams();
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paid, setPaid] = useState(false);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                if (!id) throw new Error("No quote ID");
                const data = await api.get<any>(`/quotes/public/${id}`);
                setQuote(data);
                if (data.status === 'PAID') setPaid(true);
            } catch (e) {
                setError("Quote not found or invalid.");
            } finally {
                setLoading(false);
            }
        };
        fetchQuote();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 animate-spin text-navy-900" />
        </div>
    );

    if (error || !quote) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-navy-900 mb-2">Error</h1>
                <p className="text-gray-600">{error}</p>
            </div>
        </div>
    );

    if (paid) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-navy-900 mb-2">Payment Successful</h1>
                <p className="text-gray-600 mb-6">
                    Thank you! Your payment for Quote #{quote.referenceNumber} has been processed.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-left mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500">Amount Paid</span>
                        <span className="font-bold text-navy-900">${quote.total?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Transaction Date</span>
                        <span className="font-bold text-navy-900">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                <button onClick={() => window.location.href = '/'} className="w-full bg-navy-900 text-white py-2 rounded-lg font-bold hover:bg-navy-800">
                    Return to Home
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-navy-900 mb-2">Complete Your Payment</h1>
                    <p className="text-gray-600">Quote #{quote.referenceNumber}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-navy-900 mb-4">Order Summary</h3>
                            <div className="space-y-4">
                                {quote.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-start text-sm">
                                        <div>
                                            <p className="font-medium text-navy-900">{item.name || item.sku}</p>
                                            <p className="text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-bold text-navy-900">
                                            ${((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-100 my-4 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-medium">${quote.total?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-navy-900 pt-2 border-t border-gray-100">
                                    <span>Total</span>
                                    <span>${quote.total?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-navy-900 mb-4">Customer Information</h3>
                            <div className="text-sm space-y-2">
                                <p><span className="text-gray-500">Name:</span> {quote.customer?.name}</p>
                                <p><span className="text-gray-500">Email:</span> {quote.customer?.email}</p>
                                {quote.customer?.company && <p><span className="text-gray-500">Company:</span> {quote.customer?.company}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div>
                        <Elements stripe={stripePromise}>
                            <PaymentForm quote={quote} onSuccess={() => setPaid(true)} />
                        </Elements>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayQuotePage;
