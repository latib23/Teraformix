import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useGlobalContent } from '../../contexts/GlobalContent';
import SEOHead from '../../components/SEO/SEOHead';
import { Phone, Mail, MapPin, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

const ContactPage = () => {
  const { content } = useGlobalContent();
  const details = content.general;
  const text = (content as any).contactPage?.content || '## Contact Us\n\nInformation not available.';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  });

  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) return;

    setStatus('LOADING');
    try {
      await api.post('/quotes/request/contact', form);
      setStatus('SUCCESS');
      setForm({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
    } catch (error) {
      console.error(error);
      setStatus('ERROR');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEOHead
        title="Contact Us | Server Tech Central"
        description="Get in touch with Server Tech Central for sales and support."
        canonicalUrl="https://servertechcentral.com/contact"
      />
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-14xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column: Info & Text */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h1 className="text-3xl font-bold text-navy-900 mb-6">Contact Us</h1>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-navy-50 rounded-lg text-navy-700">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</div>
                    <div className="text-lg font-medium text-navy-900">{details.phone}</div>
                    <div className="text-sm text-gray-500 mt-1">Mon-Fri 9am-6pm CST</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-navy-50 rounded-lg text-navy-700">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</div>
                    <div className="text-lg font-medium text-navy-900">{details.email}</div>
                    <div className="text-sm text-gray-500 mt-1">24/7 Support</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-navy-50 rounded-lg text-navy-700">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Address</div>
                    <div className="text-lg font-medium text-navy-900">{details.address}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-navy-900 mb-4">About Server Tech Central</h3>
              <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed text-sm">
                {text.split('\n').map((line: string, i: number) => {
                  if (line.startsWith('## ')) return <h4 key={i} className="text-lg font-bold text-navy-800 mt-4 mb-2">{line.replace('## ', '')}</h4>;
                  if (line.startsWith('### ')) return <h5 key={i} className="text-base font-bold text-navy-800 mt-3 mb-1">{line.replace('### ', '')}</h5>;
                  if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.replace('- ', '')}</li>;
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i} className="mb-2">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 h-fit">
            <h2 className="text-2xl font-bold text-navy-900 mb-2">Send us a Message</h2>
            <p className="text-gray-500 mb-6">Fill out the form below and our team will get back to you within 24 hours.</p>

            {status === 'SUCCESS' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                <p className="text-green-700 mb-6">Thank you for contacting us. We will be in touch shortly.</p>
                <button
                  onClick={() => setStatus('IDLE')}
                  className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-navy-900">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-navy-900">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-navy-900">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-navy-900">Company Name</label>
                    <input
                      type="text"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition"
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-navy-900">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition"
                    placeholder="How can we help?"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-navy-900">Message *</label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition resize-none"
                    placeholder="Tell us more about your needs..."
                  />
                </div>

                {status === 'ERROR' && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Failed to send message. Please try again.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'LOADING'}
                  className="w-full bg-navy-900 text-white font-bold py-3 rounded-lg hover:bg-navy-800 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-navy-900/20"
                >
                  {status === 'LOADING' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {status === 'LOADING' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
