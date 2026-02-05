
import React, { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
const Header = lazy(() => import('../components/Header'));
import Hero from '../components/Hero';
const Footer = lazy(() => import('../components/Footer'));
const ProductCard = lazy(() => import('../components/ProductCard'));
import { fetchJson } from '../lib/api';
import { useGlobalContent } from '../contexts/GlobalContent';
import { Product } from '../types';
import { Shield, Globe, CheckCircle, BarChart3, Building2, GraduationCap, Database, BadgeCheck, HardDrive, Network, Cpu, Layers, Server } from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';
import TrustBox from '../components/TrustBox';
import Image from '../components/Image';

const HomePage = () => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      const initial = (window as any).INITIAL_DATA?.featuredItems;
      if (initial && Array.isArray(initial) && initial.length > 0) {
        setProducts(initial);
        setLoading(false);
        // Optional: clear it to prevent reuse issues if any, implies single use
        // (window as any).INITIAL_DATA.featuredItems = null; 
        return;
      }
      setLoading(true);
      try {
        const res = await fetchJson<{ items: Product[]; total: number }>(`/products/paginated?limit=8&offset=0`);
        setProducts((res?.items || []) as Product[]);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { content } = useGlobalContent();

  // Blog posts from Global Content
  const blogPosts = React.useMemo(() => {
    return (content.blogPosts || [])
      .filter((p: any) => p && p.isPublished)
      .slice(0, 3)
      .map((p: any) => ({
        ...p,
        coverImage: p.image,
        category: p.tags?.[0] || 'Insight',
        publishedAt: p.publishDate
      }));
  }, [content.blogPosts]);
  const productList = products as Product[] || [];
  const categories = content.categories || [];
  const { cageCode, dunsNumber } = content.general;
  const partnerLogos = ((content.home as any)?.partnerLogos || []) as Array<{ image: string; alt?: string; url?: string }>;


  // Scroll animation tracking
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Scroll observer for fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setVisibleSections(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const [showHeader, setShowHeader] = React.useState(false);
  React.useEffect(() => {
    const reveal = () => setShowHeader(true);
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(reveal);
    } else {
      setTimeout(reveal, 300);
    }
  }, []);

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Server Tech Central",
    "url": "https://servertechcentral.com",
    "logo": "https://servertechcentral.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-800-555-0199",
      "contactType": "Sales",
      "areaServed": "US",
      "availableLanguage": "English"
    },
    "sameAs": [
      "https://www.linkedin.com/company/servertechcentral",
      "https://twitter.com/servertechcentral"
    ]
  };

  // Helper to get icon based on name (if image is missing)
  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('server')) return <Server className="w-6 h-6" />;
    if (n.includes('storage') || n.includes('drive')) return <HardDrive className="w-6 h-6" />;
    if (n.includes('network') || n.includes('switch')) return <Network className="w-6 h-6" />;
    if (n.includes('component') || n.includes('part') || n.includes('cpu')) return <Cpu className="w-6 h-6" />;
    return <Layers className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Enterprise Hardware Reseller | Servers, Storage & Networking | Server Tech Central"
        description="Leading B2B reseller of enterprise hardware. Buy refurbished and new Dell PowerEdge, HPE ProLiant, and Cisco networking gear. Same-day shipping available."
        canonicalUrl="https://servertechcentral.com"
        preloadImages={[String((content.home as any)?.heroImage || '')].filter(Boolean)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      {showHeader ? (
        <Suspense fallback={<div style={{ height: 64, backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} />}>
          <Header />
        </Suspense>
      ) : (
        <div style={{ height: 64, backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} />
      )}
      <Hero />

      {/* Trustpilot Widget */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <TrustBox />
        </div>
      </div>

      {/* Trust Strip - ISO & Partners */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-y border-gray-200 py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">{(content.home as any)?.trustTitle || 'Trusted Certifications & Partners'}</h3>
          </div>
          <div className="flex flex-col lg:flex-row justify-between items-center gap-10">

            {/* Certifications Left */}
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 border border-gray-200 shadow-sm" title="Quality Management">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <span className="block font-semibold text-navy-900">ISO 9001</span>
                  <span className="text-xs text-gray-500 font-normal">Quality</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 border border-gray-200 shadow-sm" title="Environmental Management">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <span className="block font-semibold text-navy-900">ISO 14001</span>
                  <span className="text-xs text-gray-500 font-normal">Environmental</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 border border-gray-200 shadow-sm" title="Information Security">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <span className="block font-semibold text-navy-900">ISO 27001</span>
                  <span className="text-xs text-gray-500 font-normal">Security</span>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-8 transition-all duration-500 ${partnerLogos.length > 0 ? 'hidden' : 'opacity-80'}`}>
              <div className="h-10 w-auto text-gray-600 flex items-center hover:opacity-100 hover:text-navy-900" title="Cisco Partner">
                <svg viewBox="0 0 64 32" className="h-full w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 19.3c-1.7 0-3.1-1.4-3.1-3.1s1.4-3.1 3.1-3.1 3.1 1.4 3.1 3.1-1.4 3.1-3.1 3.1zm0-5.4c-1.2 0-2.3 1-2.3 2.3s1 2.3 2.3 2.3 2.3-1 2.3-2.3-1.1-2.3-2.3-2.3zm15.6 5.4c-1.7 0-3.1-1.4-3.1-3.1s1.4-3.1 3.1-3.1 3.1 1.4 3.1 3.1-1.4 3.1-3.1 3.1zm0-5.4c-1.2 0-2.3 1-2.3 2.3s1 2.3 2.3 2.3 2.3-1 2.3-2.3-1-2.3-2.3-2.3zm15.6 5.4c-1.7 0-3.1-1.4-3.1-3.1s1.4-3.1 3.1-3.1 3.1 1.4 3.1 3.1-1.4 3.1-3.1 3.1zm0-5.4c-1.2 0-2.3 1-2.3 2.3s1 2.3 2.3 2.3 2.3-1 2.3-2.3-1-2.3-2.3-2.3zM7.7 16.2c-1.7 0-3.1 1.4-3.1 3.1s1.4 3.1 3.1 3.1 3.1-1.4 3.1-3.1-1.4-3.1-3.1-3.1zm0 5.4c-1.2 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zm46.8-5.4c-1.7 0-3.1 1.4-3.1 3.1s1.4 3.1 3.1 3.1 3.1-1.4 3.1-3.1-1.4-3.1-3.1-3.1zm0 5.4c-1.2 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zM15.5 9.7V2.2h-1.7v7.5h1.7zm15.6 0V2.2h-1.7v7.5h1.7zm15.6 0V2.2h-1.7v7.5h1.7zM7.7 15.1V7.5H6v7.6h1.7zm46.8 0V7.5h-1.7v7.6h1.7zM23.3 9.7V5.9h-1.7v3.8h1.7zm15.6 0V5.9h-1.7v3.8h1.7z" />
                </svg>
                <span className="ml-2 text-xs font-bold">Partner</span>
              </div>

              <div className="h-8 w-auto text-gray-600 flex items-center hover:opacity-100 hover:text-navy-900" title="Seagate Partner">
                <svg viewBox="0 0 120 32" className="h-full w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.3 15.8c-4.5 0-7.8-2.2-7.8-6.4 0-4.6 4.2-6.7 8.5-6.7 3 0 5.2.7 6.9 1.6l.7-2.7C23.8.8 21.3 0 18 0 11.2 0 4.7 3.5 4.7 10c0 6 4.7 9 10.7 9 4.9 0 8.2 2.2 8.2 6.5 0 4.8-4.5 7-9 7-3.2 0-6.2-.8-7.9-1.9l-.8 2.8c1.9.9 5 1.7 8.7 1.7 7.2 0 13.9-3.7 13.9-10.2 0-6.3-4.9-9.1-11.2-9.1zM0 13.3h2.7v10H0v-10zm112.9-1.5c-1.7 0-3.1.6-4.2 1.9V0h-2.8v23.3h2.8v-8.9c0-2.3 1.7-3.5 3.9-3.5 2.1 0 3.2 1.1 3.2 3.4v9h2.8v-9.6c0-3.2-2-5.2-5.7-5.2zm-16.7 5.4v-9H93.4v2.4h2.8v6.6c0 2.4 1.1 3.6 3.2 3.6 1.4 0 2.4-.5 3.2-1.2l1.4 2c-1.3 1.1-2.9 1.7-5 1.7-3.7 0-5.6-2-5.6-5.6V2.7h2.8V0h-2.8V-2.5h-2.7V0H88v2.7h2.6v10c0 5.2 2.7 8 8 8 2.8 0 5-1 6.7-2.6l-1.6-2c-1.4 1.2-3 1.9-4.8 1.9-1.7-.1-2.7-.8-2.7-2.8z" />
                </svg>
              </div>

              <div className="h-8 w-auto text-gray-600 flex items-center hover:opacity-100 hover:text-navy-900" title="Fortinet Authorized">
                <svg viewBox="0 0 100 30" className="h-full w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.8 7.2h-6.2v4.8h5.5v3.8h-5.5v10.7H6.2V15.8H.7v-3.8h5.5V6.1C6.2 2.3 8.7 0 12.8 0c2 0 3.5.4 4 .6l-.1 6.6zM33.5 13.9c0 7.2-5 13-12.6 13-7.6 0-12.6-5.8-12.6-13s5-13 12.6-13c7.7 0 12.6 5.8 12.6 13zm-4.8 0c0-4.8-3.1-9-7.8-9-4.7 0-7.8 4.2-7.8 9 0 4.8 3.1 9 7.8 9 4.7 0 7.8-4.2 7.8-9zm13.3-3h-1.2c-2.9 0-3.8 1.7-3.8 4.3v11.3h-4.5V8.3h4.5v2.2c.9-1.6 2.5-2.6 4.6-2.6h.4v3zm8.8 8.3v6h-3.7v-6c0-2.1-1-3.2-2.8-3.2-1.9 0-3.3 1.2-3.3 3.5v5.7h-4.5V8.3h4.5v1.9c.9-1.4 2.6-2.2 4.6-2.2 3.4 0 5.2 2 5.2 5.2V11zm3.5-7.8h4.5v14.3h-4.5V11.4zM54.3 6c1.5 0 2.6 1.1 2.6 2.5S55.8 11 54.3 11 51.7 9.9 51.7 8.5 52.8 6 54.3 6zm23.9 5.4v3.9h-4.5v5.5c0 1.3.5 1.8 1.6 1.8.6 0 1.1-.1 1.4-.2l.2 3.6c-.7.3-1.9.6-3.4.6-3.1 0-4.3-1.8-4.3-4.7v-6.6h-2.6v-3.9h2.6V8.7l4.5-1.4v4.1h4.5zm12.4 5.7h-8.8c.2 3 2.2 4.7 4.8 4.7 1.9 0 3.3-.7 4.1-1.8l2.7 2.1c-1.6 2.3-4.1 3.4-6.9 3.4-5.1 0-8.9-3.6-8.9-9.1 0-5.1 3.5-9 8.3-9 5.3 0 7.8 4.1 7.8 8.5v1.2zm-4-3c-.2-2.4-1.7-3.6-3.8-3.6-2.2 0-3.9 1.3-4.3 3.6h8.1z" />
                </svg>
              </div>
            </div>
            {partnerLogos.length > 0 && (
              <div className="flex items-center gap-8 transition-all duration-500 opacity-100">
                {partnerLogos.map((logo, idx) => {
                  const img = <Image src={logo.image} alt={logo.alt || 'Partner'} width={128} height={32} className="h-8 w-auto object-contain grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition" />;
                  return (
                    <div key={idx} className="flex items-center hover:scale-105">
                      {logo.url ? (
                        <a href={logo.url} title={logo.alt || 'Partner'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                          {img}
                        </a>
                      ) : (
                        img
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <section
        id="why-section"
        ref={el => sectionRefs.current['why-section'] = el}
        className={`py-16 bg-white transition-all duration-1000 ${visibleSections.has('why-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-900 mb-4">{(content.home as any)?.whyTitle || 'Why Procurement Teams Trust Us'}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{(content.home as any)?.whyDescription || 'We understand that downtime is not an option. Our infrastructure is built to support yours with speed, reliability, and financial flexibility.'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(((content.home as any)?.whyCards) || [
              { title: 'Global Logistics Network', description: 'With distribution centers in New York, California, and Texas, we offer same-day shipping on 95% of in-stock inventory. We provide blind drop-shipping and international pallet freight to data centers worldwide.' },
              { title: 'Rigorous QA Testing', description: 'Every server and drive that leaves our facility undergoes a 24-hour stress test. Our certified engineers verify firmware updates, clear logs, and ensure strict cosmetic standards for a "like-new" deployment experience.' },
              { title: 'Financial Services', description: 'We streamline procurement for enterprise clients. Access Net 30 terms, volume discounts, and detailed BOM (Bill of Materials) auditing. We accept University and Government Purchase Orders instantly.' }
            ]).slice(0, 3).map((card: any, idx: number) => (
              <div
                key={idx}
                className="p-8 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 hover:border-action-200"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${idx === 0 ? 'bg-blue-100 text-blue-700' : idx === 1 ? 'bg-action-100 text-action-600' : 'bg-orange-100 text-orange-600'}`}>
                  {idx === 0 ? <Globe className="w-6 h-6" /> : idx === 1 ? <CheckCircle className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">{card.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main
        id="featured-section"
        ref={el => sectionRefs.current['featured-section'] = el}
        className={`bg-gray-50 py-16 border-t border-gray-200 transition-all duration-1000 ${visibleSections.has('featured-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-navy-900">{(content.home as any)?.featuredTitle || 'Featured Inventory'}</h2>
              <p className="text-gray-500 mt-1">{(content.home as any)?.featuredSubtitle || 'High-demand components ready to ship.'}</p>
            </div>
            <Link to="/category" className="text-action-600 font-semibold hover:underline">{(content.home as any)?.featuredViewAllText || 'View All →'}</Link>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading catalog...</div>
          ) : (
            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 animate-pulse">
                      <div className="h-48 w-full bg-gray-200 rounded mb-4" />
                      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded mb-6" />
                      <div className="h-6 w-24 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </Suspense>
          )}
        </div>
      </main>

      {/* Explore by Category Section */}
      <section
        id="category-section"
        ref={el => sectionRefs.current['category-section'] = el}
        className={`py-16 bg-white border-t border-gray-200 transition-all duration-1000 ${visibleSections.has('category-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-navy-900">{(content.home as any)?.exploreTitle || 'Explore by Category'}</h2>
            <p className="text-gray-500 mt-2">{(content.home as any)?.exploreSubtitle || 'Browse our specialized hardware divisions'}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.filter(c => c.isActive).slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="group p-6 border border-gray-200 rounded-xl hover:border-action-500 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center bg-gray-50 hover:bg-white transform hover:-translate-y-2 hover:scale-105"
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mb-4 group-hover:bg-action-100 group-hover:text-action-600 transition overflow-hidden">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    getCategoryIcon(cat.name)
                  )}
                </div>
                <h3 className="font-bold text-navy-900 group-hover:text-action-600 transition">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-2 line-clamp-1">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts Section */}
      {blogPosts.length > 0 && (
        <section
          id="blog-section"
          ref={el => sectionRefs.current['blog-section'] = el}
          className={`py-16 bg-gray-50 border-t border-gray-200 transition-all duration-1000 ${visibleSections.has('blog-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold text-navy-900 mb-2">Latest Insights</h2>
                <p className="text-gray-600">Stay updated with industry trends and hardware guides</p>
              </div>
              <Link to="/blog" className="text-action-600 font-semibold hover:underline flex items-center gap-1">
                View All Articles →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogPosts.map((post, idx) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300"
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  {post.coverImage && (
                    <div className="aspect-video overflow-hidden bg-gray-100">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                      <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {post.category && (
                        <>
                          <span>•</span>
                          <span className="text-action-600 font-semibold">{post.category}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-navy-900 mb-3 group-hover:text-action-600 transition line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                      {post.excerpt || post.content?.substring(0, 150) + '...'}
                    </p>
                    <span className="text-action-600 font-semibold text-sm group-hover:underline">
                      Read More →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Industry Solutions Section */}
      <section
        id="industry-section"
        ref={el => sectionRefs.current['industry-section'] = el}
        className={`py-20 bg-navy-950 text-white transition-all duration-1000 ${visibleSections.has('industry-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-action-500 font-bold tracking-wider uppercase text-sm mb-2 block">{(content.home as any)?.verticalsHeaderTagline || 'Public Sector Speed'}</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">{(content.home as any)?.publicSectorTitle || 'Fast Hardware for Public Sector Timelines'}</h2>
              <div className="space-y-6 text-gray-300 leading-relaxed">
                {(((content.home as any)?.publicSectorParagraphs) || [
                  'Government, education, healthcare, and research institutions need enterprise hardware fast, but procurement moves slow. Server Tech Central solves this.',
                  'We stock both legacy components for aging infrastructure and cutting-edge servers for AI workloads, then handle the compliance complexity that delays public sector IT. TAA compliance for federal contracts. E-Rate processes for schools. Audit documentation for institutional buyers. Security vetting for classified systems.',
                  "We deliver same-day on the hardware while managing the regulatory requirements that typically add weeks to timelines. When your infrastructure supports national security, student learning, patient care, or research operations, waiting isn't realistic. We eliminate the wait."
                ]).map((t: string, i: number) => (<p key={i}>{t}</p>))}
                <div className="flex gap-4 mt-6 items-center text-sm font-mono text-gray-400 bg-navy-950/50 p-4 rounded border border-navy-700 inline-block">
                  <span className="block">CAGE: <span className="text-white">{cageCode}</span></span>
                  <span className="w-px h-4 bg-gray-600"></span>
                  <span className="block">DUNS: <span className="text-white">{dunsNumber}</span></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {(((content.home as any)?.verticalCards) || [
                { title: 'Hyperscale Data Centers', description: 'Pallets of compute nodes and NVMe storage shipped same-day, because cloud capacity waits for no one.' },
                { title: 'Federal & Local Government', description: 'TAA-compliant hardware with secure chain of custody and GSA-ready account management. Federal procurement without federal delays.' },
                { title: 'Education & Research', description: 'HPC clusters for breakthrough research and reliable infrastructure for student networks, E-Rate ready, shipped fast.' }
              ]).slice(0, 3).map((card: any, idx: number) => (
                <div key={idx} className="bg-navy-800 p-6 rounded-lg border border-navy-700 flex items-start gap-4">
                  {idx === 0 ? <Database className="w-8 h-8 text-blue-400 mt-1" /> : idx === 1 ? <Building2 className="w-8 h-8 text-action-500 mt-1" /> : <GraduationCap className="w-8 h-8 text-orange-500 mt-1" />}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-400">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<div style={{ height: 96 }} />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default HomePage;
