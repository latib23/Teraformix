import React, { useState, useEffect } from 'react';
import { X, Search, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';

const ExitIntentModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasShown, setHasShown] = useState(false);
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        query: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        // Check if we've already shown it this session
        const sessionShown = sessionStorage.getItem('exit_intent_shown');
        if (sessionShown) {
            setHasShown(true);
            return;
        }

        const handleMouseLeave = (e: MouseEvent) => {
            // Show if mouse leaves top of viewport
            if (e.clientY <= 0) {
                setIsOpen(true);
                setHasShown(true);
                sessionStorage.setItem('exit_intent_shown', 'true');
            }
        };

        // Handler for tab visibility change (switching tabs)
        // Note: This often triggers when user minimizes or switches tabs, but we can't show a modal *after* they switch.
        // However, we can ensure if they come back after switching, it might show? 
        // Actually, classic exit intent is mouseout. Visibility change is harder to interrupt.
        // User request mentioned "change the tab". We can't interrupt a tab switch.
        // But we can trigger on mouseout which usually precedes a tab switch/close on desktop.

        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [hasShown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            // Reuse the bulk quote endpoint or similar
            await api.post('/quotes/request/bulk', {
                parts: `Product Search Request: ${formData.query}`,
                email: formData.email,
                phone: formData.phone,
                timeline: 'Urgent - Product Not Found'
            });

            setStatus('success');
            setTimeout(() => {
                setIsOpen(false);
                // Reset status for next time? No, we only show once per session usually.
            }, 3000);

        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-scaleUp">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {status === 'success' ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-navy-900 mb-2">Request Received!</h3>
                        <p className="text-gray-600">
                            We'll check our off-market inventory and email you shortly.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row">
                        {/* Left/Top Decor */}
                        <div className="bg-navy-900 text-white p-6 md:w-1/3 flex flex-col justify-center items-center text-center">
                            <div className="bg-white/10 p-3 rounded-full mb-4">
                                <Search className="w-8 h-8 text-action-400" />
                            </div>
                            <h3 className="font-bold text-lg leading-tight">Can't find what you need?</h3>
                            <p className="text-xs text-gray-300 mt-2">
                                Our global inventory changes daily. We likely have it in stock.
                            </p>
                        </div>

                        {/* Form */}
                        <div className="p-6 md:w-2/3">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">What are you looking for?</label>
                                    <textarea
                                        required
                                        rows={2}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none resize-none"
                                        placeholder="Part number, description, model..."
                                        value={formData.query}
                                        onChange={e => setFormData({ ...formData, query: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                                        placeholder="name@company.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone (Optional)</label>
                                    <input
                                        type="tel"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                                        placeholder="(555) 123-4567"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                {status === 'error' && (
                                    <p className="text-xs text-red-600">Something went wrong. Please try again.</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    className="w-full bg-action-600 hover:bg-action-700 text-white font-bold py-2.5 rounded-lg shadow transition flex items-center justify-center gap-2 text-sm"
                                >
                                    {status === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                    Check Availability
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExitIntentModal;
