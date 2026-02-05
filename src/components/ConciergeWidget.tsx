
import React, { useState } from 'react';
import { Box, Send, Loader2 } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { api } from '../lib/api';

interface ConciergeWidgetProps {
  variant?: 'default' | 'dark';
  transparent?: boolean;
}

const ConciergeWidget: React.FC<ConciergeWidgetProps> = ({ variant = 'default', transparent = false }) => {
  const isDark = variant === 'dark';
  const { showToast } = useUI();

  const [formData, setFormData] = useState({
    parts: '',
    email: '',
    timeline: 'Urgent (24h)'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerClasses = isDark
    ? 'bg-navy-800 border-navy-700'
    : transparent
      ? 'bg-white/80 backdrop-blur-md border-action-500'
      : 'bg-white border-action-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/quotes/request/concierge', formData);
      showToast('Sourcing request sent! We will be in touch shortly.', 'success');
      setFormData({ parts: '', email: '', timeline: 'Urgent (24h)' }); // Reset form
      try { const conv = (window as any).gtag_report_conversion; if (conv) conv(); } catch { }

    } catch (error) {
      console.error('Concierge submission failed:', error);
      showToast('Could not submit request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${containerClasses} rounded-lg shadow-2xl p-6 max-w-md border-t-4`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-navy-700' : 'bg-navy-50'}`}>
          <Box className={`w-6 h-6 ${isDark ? 'text-action-500' : 'text-navy-900'}`} />
        </div>
        <div>
          <h2 className={`font-bold ${isDark ? 'text-white' : 'text-navy-900'} text-lg`}>Concierge Sourcing</h2>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Can't find it? We will.</p>
        </div>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="part-numbers" className={`block text-xs font-semibold uppercase mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Part Number(s)</label>
          <textarea
            id="part-numbers"
            required
            value={formData.parts}
            onChange={(e) => setFormData({ ...formData, parts: e.target.value })}
            className={`w-full border rounded-md p-3 text-sm focus:ring-2 focus:ring-navy-800 focus:outline-none ${isDark ? 'bg-navy-900 border-navy-600 text-white placeholder-gray-500' : 'bg-white border-gray-300'}`}
            rows={3}
            placeholder="Paste MPNs or Descriptions here..."
            aria-label="List part numbers or descriptions"
          ></textarea>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className={`block text-xs font-semibold uppercase mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full border rounded-md p-2.5 text-sm ${isDark ? 'bg-navy-900 border-navy-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder="work@company.com"
            />
          </div>
          <div>
            <label htmlFor="timeline" className={`block text-xs font-semibold uppercase mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Timeline</label>
            <select
              id="timeline"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              className={`w-full border rounded-md p-2.5 text-sm ${isDark ? 'bg-navy-900 border-navy-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option>Urgent (24h)</option>
              <option>3-5 Days</option>
              <option>Planning</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-action-600 hover:bg-action-500 disabled:bg-gray-400 text-white font-bold rounded-md transition shadow-lg flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
          {isSubmitting ? 'Submitting...' : 'Start Sourcing Request'}
        </button>
      </form>
    </div>
  );
};

export default ConciergeWidget;
