

import React, { useState, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { X, Send, Loader2, FileText } from 'lucide-react';
import { api } from '../lib/api';

const QuoteModal = () => {
  const { isQuoteModalOpen, closeQuoteModal, quoteModalData, showToast } = useUI();
  const [formData, setFormData] = useState({
    parts: '',
    name: '',
    email: '',
    phone: '',
    timeline: 'Urgent (24h)'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isQuoteModalOpen) {
      setFormData(prev => ({ ...prev, parts: quoteModalData }));
    } else {
      // Reset form on close
      setFormData({ parts: '', name: '', email: '', phone: '', timeline: 'Urgent (24h)' });
    }
  }, [isQuoteModalOpen, quoteModalData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post<{ referenceNumber: string }>('/quotes/request/bulk', formData);
      const quoteNumber = response?.referenceNumber || 'RECEIVED';

      const g = (window as any).gtag;
      if (g) {
        const adsId = String((import.meta as any).env?.VITE_GOOGLE_ADS_ID || '');
        const leadLabel = String((import.meta as any).env?.VITE_GOOGLE_ADS_LEAD_LABEL || '');
        if (adsId && leadLabel) {
          g('event', 'conversion', { send_to: `${adsId}/${leadLabel}` });
        }
        try { g('event', 'generate_lead', { method: 'bulk_modal' }); } catch { }
        try { const conv = (window as any).gtag_report_conversion; if (conv) conv(); } catch { }
      }
      try {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
          event: 'quote_submit',
          method: 'bulk_modal',
          email: formData.email || '',
        });
      } catch { }

      showToast(`Quote Request ${quoteNumber} received! An agent will contact you shortly.`, 'success');
      closeQuoteModal();

    } catch (error) {
      console.error('Bulk Quote submission failed:', error);
      showToast('Could not submit quote request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isQuoteModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-scaleUp">
        <button
          onClick={closeQuoteModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-action-100 p-2 rounded-lg text-action-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy-900">Request Bulk Quote</h3>
              <p className="text-sm text-gray-500">Get volume pricing and availability within 1 hour.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Part Numbers / Requirements</label>
              <textarea
                required
                className="w-full border border-gray-300 bg-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-navy-900 outline-none min-h-[100px]"
                placeholder="List MPNs, quantities, or configuration details..."
                value={formData.parts}
                onChange={(e) => setFormData({ ...formData, parts: e.target.value })}
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Business Email</label>
                <input
                  type="email"
                  required
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Timeline</label>
                <select
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                >
                  <option>Urgent (24h)</option>
                  <option>3-5 Days</option>
                  <option>Future Project (Planning)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 bg-navy-900 hover:bg-navy-800 text-white font-bold py-3.5 rounded-lg shadow-lg transition transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? 'Sending Request...' : 'Submit Quote Request'}
            </button>

            <p className="text-center text-xs text-gray-400 mt-2">
              Protected by SSL. We respect your inbox privacy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;
