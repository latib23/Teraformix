import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
const Header = lazy(() => import('../../components/Header'));
const Footer = lazy(() => import('../../components/Footer'));
import { useGlobalContent } from '../../contexts/GlobalContent';
import { fetchJson } from '../../lib/api';
const ProductCard = lazy(() => import('../../components/ProductCard'));
const QuoteBeatingForm = lazy(() => import('../../components/QuoteBeatingForm'));
import SEOHead from '../../components/SEO/SEOHead';
import Image from '../../components/Image';
import { ShieldCheck, Award, Clock, CreditCard, Phone, Mail, CheckCircle, ChevronDown, ChevronUp, HelpCircle, ChevronRight } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';

const LandingPage = () => {
  const { slug } = useParams();
  const { content } = useGlobalContent();
  const { openQuoteModal } = useUI();
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [showHeader, setShowHeader] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const collection = useMemo(() => {
    const list = content.landingCollections || [];
    return list.find((c: any) => c.slug === slug);
  }, [content.landingCollections, slug]);

  useEffect(() => {
    const reveal = () => setShowHeader(true);
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(reveal);
    } else {
      setTimeout(reveal, 300);
    }

    (async () => {
      const ids = collection?.productIds || [];
      if (!ids.length) {
        setFeatured([]);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetchJson<any[]>(`/products/by-ids?ids=${ids.join(',')}`);
        setFeatured(Array.isArray(res) ? res : []);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [collection]);

  const trackCta = (type: string, context: string) => {
    try {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: 'cta_click', type, context });
    } catch {}
  };

  const handleRequestQuote = () => {
    openQuoteModal();
  };

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50">
        {showHeader ? (
          <Suspense fallback={<div style={{ height: 64, backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} />}> 
            <Header />
          </Suspense>
        ) : (
          <div style={{ height: 64, backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} />
        )}
        <main className="container mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold text-navy-900">Collection Not Found</h1>
          <p className="text-gray-600 mt-2">This landing collection has not been configured yet.</p>
        </main>
        <Suspense fallback={<div style={{ height: 200 }} />}> 
          <Footer />
        </Suspense>
      </div>
    );
  }

  return (
    <div>
      <SEOHead title={`${collection.title} | Server Tech Central`} description={collection.description} />
      {showHeader ? (
        <Suspense fallback={<div style={{ height: 64, backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} />}> 
          <Header />
        </Suspense>
      ) : (
        <div style={{ height: 64, backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} />
      )}
      <main className="bg-white">
        <section className="relative">
          {collection.bannerImage ? (
            <div className="w-full overflow-hidden">
              <Image src={collection.bannerImage} alt={collection.title} className="w-full h-full object-cover" priority width={1000} height={370} />
            </div>
          ) : (
            <div className="h-48 w-full bg-gradient-to-r from-navy-900 to-action-600" />
          )}
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-navy-900">{collection.heroTitle}</h1>
                <p className="text-gray-600 mt-2 max-w-2xl">{collection.heroSubtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <a href={`tel:${content.general.phone}`} onClick={() => trackCta('call', 'hero')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition">
                  <Phone className="w-4 h-4" /> Call {content.general.phone}
                </a>
                <button onClick={() => { trackCta('quote', 'hero'); openQuoteModal(); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-action-600 text-white hover:bg-action-500 transition">
                  <CheckCircle className="w-4 h-4" /> Request Quote
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <p className="text-gray-700 max-w-3xl leading-relaxed">{collection.description}</p>
          <h3 className="mt-6 text-xs font-bold text-gray-600 uppercase tracking-wide">Trusted Certifications & Assurances</h3>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="flex items-center gap-3 text-sm bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 inline-flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="font-medium text-navy-900">3-Year Advanced Replacement Warranty</span>
            </div>
            <a
              href="https://www.iafcertsearch.org/certified-entity/cG4PRZ8w8KDgoIe7OuvfcNcO"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm bg-white border border-action-300 text-navy-900 rounded-full px-4 py-2 shadow-sm hover:bg-action-50 transition"
              aria-label="Verify ISO 9001, 14001, 27001 certificates"
            >
              <Award className="w-4 h-4 text-action-600" /> Verify ISO Certificates <ChevronRight className="w-4 h-4 text-action-600" />
            </a>
            <div className="flex items-center gap-3 text-sm bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 inline-flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
              <span className="font-medium text-navy-900">Same‑Day Shipping by 3:00 PM CT</span>
            </div>
            <div className="flex items-center gap-3 text-sm bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 inline-flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </span>
              <span className="font-medium text-navy-900">Major Credit Cards Accepted • Net 30 PO</span>
            </div>
            <div className="flex items-center gap-3 text-sm bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <span className="font-mono text-xs text-gray-500">CAGE</span>
              <span className="font-medium text-navy-900">{content.general.cageCode}</span>
            </div>
            <div className="flex items-center gap-3 text-sm bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <span className="font-mono text-xs text-gray-500">DUNS</span>
              <span className="font-medium text-navy-900">{content.general.dunsNumber}</span>
            </div>
          </div>
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div className="text-sm text-blue-800">Enterprise procurement? Email <a className="underline font-medium" href={`mailto:${content.general.email}`}>{content.general.email}</a> for immediate assistance.</div>
          </div>
        </section>



        <section className="container mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold text-navy-900 mb-4">Featured Products</h2>
          {loading ? (
            <div className="text-gray-500">Loading products...</div>
          ) : error ? (
            <div className="text-orange-700 bg-orange-50 p-4 rounded">Could not load products.</div>
          ) : featured.length === 0 ? (
            <div className="bg-navy-900 text-white rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm">
                <div className="font-bold text-lg">Tell us what you need</div>
                <div className="mt-1 text-gray-200">If the exact part isn’t listed, we’ll source it and send a formal quote fast.</div>
              </div>
              <div className="flex items-center gap-3">
                <a href="/upload-bom" onClick={() => trackCta('bom', 'featured_empty')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-navy-900 hover:bg-gray-100 transition">Upload BOM</a>
                <button onClick={() => { trackCta('quote', 'featured_empty'); openQuoteModal(); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-action-600 text-white hover:bg-action-500 transition">Request Quote</button>
                <a href={`tel:${content.general.phone}`} onClick={() => trackCta('call', 'featured_empty')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-800 text-white hover:bg-navy-700 transition">Call {content.general.phone}</a>
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"><div className="h-48 bg-gray-100 rounded" /><div className="h-48 bg-gray-100 rounded" /><div className="h-48 bg-gray-100 rounded" /></div>}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </Suspense>
          )}
        </section>

        {Array.isArray(collection.logos) && collection.logos.length > 0 && (
          <section className="container mx-auto px-4 pb-12">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3">Trusted by Professionals</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 items-center">
              {collection.logos.map((l: any, idx: number) => (
                <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm hover:bg-action-50 hover:border-action-300 transition">
                  <Image src={l.imageUrl} alt={l.name} className="max-h-10 object-contain" />
                </div>
              ))}
            </div>
          </section>
        )}

        {Array.isArray(collection.testimonials) && collection.testimonials.length > 0 && (
          <section className="bg-white">
            <div className="container mx-auto px-4 pb-12">
              <h3 className="text-sm font-bold text-navy-900 mb-4">What our customers say</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {collection.testimonials.map((t: any, idx: number) => (
                  <div key={idx} className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-700">“{t.quote}”</p>
                    <div className="mt-3 text-sm font-bold text-navy-900">{t.author}</div>
                    <div className="text-xs text-gray-500">{[t.role, t.company].filter(Boolean).join(' • ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto bg-action-50 rounded-xl p-8 border-2 border-action-100 shadow-md">
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded-xl animate-pulse" />}>
              <QuoteBeatingForm />
            </Suspense>
          </div>
        </section>

        <section className="bg-gray-50">
          <div className="container mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <h3 className="text-sm font-bold text-navy-900">Operational Excellence</h3>
                <p className="text-sm text-gray-600 mt-2">ISO 9001, 14001, 27001 processes, serialized QA, and full burn‑in testing for mission‑critical reliability.</p>
              </div>
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <h3 className="text-sm font-bold text-navy-900">Procurement Ready</h3>
                <p className="text-sm text-gray-600 mt-2">Formal quotes, POs, tax‑exempt handling, and invoicing support for public and private sector.</p>
              </div>
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <h3 className="text-sm font-bold text-navy-900">Fulfillment Speed</h3>
                <p className="text-sm text-gray-600 mt-2">Same‑day dispatch for in‑stock items; real tracking and proactive communication.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container mx-auto px-4 pb-12">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-action-600" />
              <h3 className="text-sm font-bold text-navy-900">Frequently Asked Questions</h3>
            </div>
            <div className="divide-y divide-gray-200 bg-gray-50 border border-gray-200 rounded-lg">
              {(collection.faqs && collection.faqs.length ? collection.faqs : [
                { question: 'How fast is delivery?', answer: 'In‑stock items ship same day if ordered by 3:00 PM CT. Transit is typically 2‑5 business days in the continental US. Expedited options are available.' },
                { question: 'What warranty is included?', answer: 'Standard 3‑Year Advanced Replacement Warranty on most hardware. Extended coverage up to 5 years available. OEM warranties apply where noted.' },
                { question: 'What is your return/refund policy?', answer: 'Returns accepted within 30 days of delivery. Defective items receive full replacement or refund. Non‑defective returns may be subject to a restocking fee.' },
                { question: 'Do you support Net 30 Purchase Orders?', answer: 'Yes. We accept Net 30 POs for qualified organizations upon credit approval, including government, education, and enterprise.' },
                { question: 'Do you ship internationally?', answer: 'Yes. We offer international express and economy services with DDP options on request. Palletized freight is available for bulk shipments.' }
              ]).map((f, idx) => (
                <div key={idx}>
                  <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100" onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}>
                    <span className="font-medium text-navy-900 text-sm">{f.question}</span>
                    {openFaqIndex === idx ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-4 pb-4 text-sm text-gray-700">{f.answer}</div>
                  )}
                </div>
              ))}
            </div>
            {(() => {
              const items = (collection.faqs && collection.faqs.length ? collection.faqs : [
                { question: 'How fast is delivery?', answer: 'In‑stock items ship same day if ordered by 3:00 PM CT. Transit is typically 2‑5 business days in the continental US. Expedited options are available.' },
                { question: 'What warranty is included?', answer: 'Standard 3‑Year Advanced Replacement Warranty on most hardware. Extended coverage up to 5 years available. OEM warranties apply where noted.' },
                { question: 'What is your return/refund policy?', answer: 'Returns accepted within 30 days of delivery. Defective items receive full replacement or refund. Non‑defective returns may be subject to a restocking fee.' },
                { question: 'Do you support Net 30 Purchase Orders?', answer: 'Yes. We accept Net 30 POs for qualified organizations upon credit approval, including government, education, and enterprise.' },
                { question: 'Do you ship internationally?', answer: 'Yes. We offer international express and economy services with DDP options on request. Palletized freight is available for bulk shipments.' }
              ]).map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } }));
              const data = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items };
              return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
            })()}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-12">
          <div className="bg-navy-900 text-white rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm">
              <div className="font-bold text-lg">Tell us what you need</div>
              <div className="mt-1 text-gray-200">If the exact part isn’t listed, we’ll source it and send a formal quote fast.</div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/upload-bom" onClick={() => trackCta('bom', 'cta_banner')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-navy-900 hover:bg-gray-100 transition">Upload BOM</a>
              <button onClick={() => { trackCta('quote', 'cta_banner'); openQuoteModal(); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-action-600 text-white hover:bg-action-500 transition">Request Quote</button>
              <a href={`tel:${content.general.phone}`} onClick={() => trackCta('call', 'cta_banner')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-800 text-white hover:bg-navy-700 transition">Call {content.general.phone}</a>
            </div>
          </div>
        </section>
      </main>
      
      <Suspense fallback={<div style={{ height: 200 }} />}> 
        <Footer />
      </Suspense>
    </div>
  );
};

export default LandingPage;
