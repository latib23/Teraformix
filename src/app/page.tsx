
import React, { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
const Header = lazy(() => import('../components/Header'));
import { fetchJson } from '../lib/api';
import { useGlobalContent } from '../contexts/GlobalContent';
import { Product } from '../types';
import {
  Server, HardDrive, Network, Cpu, ShieldCheck, Zap,
  Recycle, Truck, Settings, ArrowRight, ChevronRight,
  Terminal, Database, Globe
} from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';
import TrustBox from '../components/TrustBox';
import Image from '../components/Image';
import { useUI } from '../contexts/UIContext';

// New: Industrial "Tech Spec" Card for Products
const TechSpecCard = ({ product }: { product: Product }) => {
  const { openQuoteModal } = useUI();

  return (
    <div className="group relative bg-navy-900 border border-navy-700 hover:border-action-500 transition-all duration-300 flex flex-col overflow-hidden">
      <div className="absolute top-0 right-0 p-3 z-10">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-sm ${product.stockStatus === 'IN_STOCK' ? 'bg-action-900/50 text-action-400 border border-action-500/30' : 'bg-orange-900/50 text-orange-400 border border-orange-500/30'}`}>
          {product.stockStatus === 'IN_STOCK' ? 'IN STOCK' : 'LEAD TIME'}
        </span>
      </div>

      <div className="p-6 flex-grow flex items-center justify-center bg-gradient-to-b from-navy-800 to-navy-900">
        <Link to={`/product/${product.sku}`} className="block relative w-full aspect-[4/3]">
          <Image
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-overlay opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        </Link>
      </div>

      <div className="p-4 border-t border-navy-800 bg-navy-950 px-5">
        <div className="flex justify-between items-start gap-4 mb-2">
          <div>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">{product.brand || 'Enterprise'}</p>
            <Link to={`/product/${product.sku}`} className="font-bold text-gray-200 text-sm leading-tight group-hover:text-action-400 transition line-clamp-2">
              {product.name}
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="font-mono text-xs text-gray-500">{product.sku}</div>
          <div className="tria-button">
            <button
              onClick={() => openQuoteModal(product.name)}
              className="text-xs font-bold text-action-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              CONFIGURE <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { content } = useGlobalContent();
  const { openQuoteModal } = useUI();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchJson<{ items: Product[] }>(`/products/paginated?limit=4&offset=0`);
        setProducts(res?.items || []);
      } catch { }
    })();
  }, []);

  const { heroTitle } = content.home;

  return (
    <div className="min-h-screen bg-navy-950 text-gray-200 selection:bg-action-500 selection:text-white font-sans">
      <SEOHead
        title="Thinking Ahead. | Teraformix Enterprise"
        description="The source for renewed enterprise infrastructure."
        canonicalUrl="https://teraformix.com"
      />
      <Suspense fallback={<div className="h-16 bg-navy-900" />}>
        <Header />
      </Suspense>

      {/* --- RE-ARCHITECTED HERO: "The Command Center" --- */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Abstract Cyber Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16,185,129,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-12 h-[1px] bg-action-500"></span>
              <span className="text-action-400 font-mono text-sm tracking-widest uppercase">Infrastructure Refined</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none mb-8">
              BUILD.<br />
              DEPLOY.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-action-400 to-teal-600">SCALE.</span>
            </h1>

            <div className="flex flex-col md:flex-row gap-6 items-start mt-12">
              <div className="bg-navy-900/80 backdrop-blur border border-navy-700 p-8 rounded-sm max-w-md w-full hover:border-action-500/50 transition-colors group">
                <Terminal className="w-8 h-8 text-action-500 mb-4 group-hover:animate-pulse" />
                <h3 className="text-xl font-bold text-white mb-2">Start Configuration</h3>
                <p className="text-sm text-gray-400 mb-6">Select a base platform to customize your build.</p>

                <div className="grid grid-cols-2 gap-2">
                  <Link to="/configurator?model=dell-r740xd-lff" className="px-4 py-2 bg-navy-950 border border-navy-800 text-xs font-bold text-center hover:bg-white hover:text-navy-900 transition-colors">DELL POWEREDGE</Link>
                  <Link to="/configurator?model=hpe-dl380-gen10" className="px-4 py-2 bg-navy-950 border border-navy-800 text-xs font-bold text-center hover:bg-white hover:text-navy-900 transition-colors">HPE PROLIANT</Link>
                  <Link to="/configurator?model=cisco-c240-m5" className="px-4 py-2 bg-navy-950 border border-navy-800 text-xs font-bold text-center hover:bg-white hover:text-navy-900 transition-colors">CISCO UCS</Link>
                  <Link to="/configurator" className="px-4 py-2 bg-action-600 border border-action-600 text-white text-xs font-bold text-center hover:bg-action-500 transition-colors">CUSTOM BOM</Link>
                </div>
              </div>

              <div className="hidden lg:block h-full w-px bg-gradient-to-b from-navy-700 via-action-900 to-transparent"></div>

              <div className="pt-4 max-w-sm">
                <p className="text-lg text-gray-300 leading-relaxed font-light">
                  {content.home.heroSubtitle || "We supply the world's data centers with certified refurbished hardware. 3-Year Warranty included."}
                </p>
                <div className="mt-8 flex items-center gap-8">
                  <div>
                    <div className="text-2xl font-bold text-white">500k+</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Parts In Stock</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">99.9%</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">QC Pass Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- NEW SECTION: "Bento Grid" Categories --- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-bold text-navy-950 tracking-tight">Core Infrastructure</h2>
            <Link to="/category" className="text-sm font-bold text-action-600 hover:text-navy-900 flex items-center gap-2">
              FULL CATALOG <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[800px] md:h-[600px]">
            {/* Large Feature: Servers */}
            <Link to="/category/servers" className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-sm bg-gray-100 min-h-[300px]">
              <Image
                src="https://images.unsplash.com/photo-1558494949-ef526b0042a0?auto=format&fit=crop&w=1000"
                alt="Servers"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-navy-950/40 group-hover:bg-navy-950/20 transition-colors"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="text-3xl font-bold text-white mb-2">Servers</h3>
                <p className="text-gray-200">Rack, Tower & Blade Systems</p>
              </div>
            </Link>

            {/* Medium: Storage */}
            <Link to="/category/storage" className="md:col-span-2 relative group overflow-hidden rounded-sm bg-navy-900">
              <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                <Database className="w-32 h-32 text-action-900" />
              </div>
              <div className="absolute top-6 left-6 z-10">
                <h3 className="text-2xl font-bold text-white">Storage Arrays</h3>
              </div>
              <div className="absolute bottom-6 right-6">
                <div className="bg-action-500 text-white rounded-full p-2 group-hover:rotate-45 transition-transform"><ArrowRight className="w-4 h-4" /></div>
              </div>
            </Link>

            {/* Small: Networking */}
            <Link to="/category/networking" className="relative group overflow-hidden rounded-sm bg-gray-100 p-6 flex flex-col justify-between hover:bg-gray-200 transition-colors border border-gray-200">
              <Network className="w-10 h-10 text-navy-900 mb-4" />
              <div>
                <h3 className="text-xl font-bold text-navy-900">Networking</h3>
                <p className="text-sm text-gray-500 mt-1">Switches & Routers</p>
              </div>
            </Link>

            {/* Small: Components */}
            <Link to="/category/components" className="relative group overflow-hidden rounded-sm bg-gray-100 p-6 flex flex-col justify-between hover:bg-gray-200 transition-colors border border-gray-200">
              <Cpu className="w-10 h-10 text-navy-900 mb-4" />
              <div>
                <h3 className="text-xl font-bold text-navy-900">Components</h3>
                <p className="text-sm text-gray-500 mt-1">CPUs, RAM, Drives</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* --- FEATURE: "The Renewed Promise" (Direct Renewtech Inspiration) --- */}
      <section className="py-24 bg-navy-900 border-y border-navy-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-navy-800 -skew-x-12 opacity-50"></div>

        <div className="container mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Recycle className="w-5 h-5 text-action-500" />
              <span className="text-action-500 font-bold uppercase tracking-widest text-sm">Certified Refurbished</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Performance without the Premium.
            </h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              Our "Teraformix Renewed" program restores enterprise hardware to factory-like condition.
              Rigorous 24-hour stress testing, latest firmware updates, and cosmetic refinishing ensures
              you get 100% of the performance at 40% of the cost.
            </p>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="border-l-2 border-action-500 pl-4">
                <div className="text-2xl font-bold text-white">3 Year</div>
                <div className="text-sm text-gray-500">Comprehensive Warranty</div>
              </div>
              <div className="border-l-2 border-action-500 pl-4">
                <div className="text-2xl font-bold text-white">ISO 9001</div>
                <div className="text-sm text-gray-500">Quality Certified</div>
              </div>
            </div>

            <Link to="/warranty" className="text-white border-b border-action-500 pb-1 hover:text-action-400 transition-colors inline-flex items-center gap-2">
              Read our restoration process <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative">
            <div className="bg-navy-950 p-8 rounded-sm border border-navy-800 shadow-2xl">
              <div className="flex items-center gap-4 mb-6 border-b border-navy-800 pb-4">
                <ShieldCheck className="w-6 h-6 text-action-500" />
                <h3 className="font-bold text-white">Quality Assurance Checklist</h3>
              </div>
              <ul className="space-y-4">
                {["Visual Inspection & Cleaning", "Component Level Diagnostics", "Firmware & BIOS Updates", "24-Hr Load Testing", "Secure Data Erasure (NIST 800-88)"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-action-900/50 text-action-500 flex items-center justify-center text-[10px] font-bold">✓</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- INVENTORY FEED: "Live Manifest" Style --- */}
      <section className="py-24 bg-navy-950">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-navy-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                Live Inventory Feed
              </h2>
              <p className="text-gray-500 mt-2 font-mono text-xs">UPDATED: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              {['Most Popular', 'New Arrivals', 'Clearance'].map((tab, i) => (
                <button key={i} className={`px-4 py-2 text-xs font-bold rounded-sm ${i === 0 ? 'bg-white text-navy-900' : 'text-gray-400 hover:text-white'}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map(p => (
              <TechSpecCard key={p.id} product={p} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/category" className="inline-block px-12 py-4 border border-navy-700 text-gray-300 font-bold hover:bg-white hover:text-navy-900 transition-all uppercase tracking-widest text-sm">
              Load Full Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* --- SERVICES BAR --- */}
      <section className="py-16 bg-gradient-to-r from-action-900 to-navy-900 text-white">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="px-4 py-4">
            <Truck className="w-10 h-10 mx-auto mb-4 text-action-300" />
            <h3 className="font-bold text-lg mb-2">Same Day Shipping</h3>
            <p className="text-sm text-blue-100 opacity-80">Order by 4PM EST for immediate dispatch from our TX facility.</p>
          </div>
          <div className="px-4 py-4">
            <Globe className="w-10 h-10 mx-auto mb-4 text-action-300" />
            <h3 className="font-bold text-lg mb-2">International Freight</h3>
            <p className="text-sm text-blue-100 opacity-80">We ship to 150+ countries with proper customs documentation.</p>
          </div>
          <div className="px-4 py-4">
            <ShieldCheck className="w-10 h-10 mx-auto mb-4 text-action-300" />
            <h3 className="font-bold text-lg mb-2">Government POs</h3>
            <p className="text-sm text-blue-100 opacity-80">CAGE Code: {content.general.cageCode}. We accept Net 30 from qualified agencies.</p>
          </div>
        </div>
      </section>

      {/* Footer is handled by layout, but we include TrustBox here as a final signal */}
      <div className="bg-navy-950 border-t border-navy-900 py-8">
        <div className="container mx-auto px-4">
          <TrustBox />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
