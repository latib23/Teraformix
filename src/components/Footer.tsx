
import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Lock, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useGlobalContent } from '../contexts/GlobalContent';
import { Product } from '../types';
import { fetchJson } from '../lib/api';

const PaymentIcons = ({ images }: { images?: Array<{ image: string; alt?: string }> }) => (
  <div className="flex items-center gap-2" aria-label="Accepted payment methods">
    {images && images.length > 0 ? (
      images.map((logo, idx) => (
        <img key={idx} src={logo.image} alt={logo.alt || 'Payment'} className="h-6 w-auto rounded bg-white shadow-sm" />
      ))
    ) : (
      <>
        {/* Visa */}
        <svg className="h-6 w-auto rounded bg-white shadow-sm" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="20" rx="2" fill="#fff" />
          <path d="M13.7 12.5h2.2l1.4-8.5h-2.2l-1.4 8.5zm-3.8 0H12L13.3 3H11l-1.5 6.8c0 .1-.1.2-.2.2H6.2l-.1-.6L9.4 3H7.1L3.7 12.5h2.4c.4 0 .7-.2.8-.6l.3-1.3h3.4l.3 1.9zM22.2 12.5h2.1l-1.3-8.5H21l-1.3 6.3-.6-3-1-3.3h-2.3l3.4 8.5h.1l1.9-8.5z" fill="#1A1F71" />
        </svg>
        {/* Mastercard */}
        <svg className="h-6 w-auto rounded bg-white shadow-sm" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="20" rx="2" fill="#fff" />
          <circle cx="11" cy="10" r="6" fill="#EB001B" />
          <circle cx="21" cy="10" r="6" fill="#F79E1B" fillOpacity="0.9" />
          <path d="M16 14a5.9 5.9 0 0 1-2.4-2.1 5.9 5.9 0 0 1-.5-2c0-.7.2-1.4.5-2 .6-.8 1.4-1.5 2.4-2 .9.5 1.8 1.2 2.4 2 .3.6.5 1.3.5 2s-.2 1.4-.5 2c-.6.9-1.5 1.6-2.4 2z" fill="#FF5F00" />
        </svg>
        {/* Amex */}
        <svg className="h-6 w-auto rounded bg-white shadow-sm" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="20" rx="2" fill="#2E77BC" />
          <path d="M20.7 11l-1.5-3.7H18l-1.5 3.7h-1.7l2.4-5.6h2l2.3 5.6h-1.8zm-7-2.4L13 6.8h-1.4v4.2h1.5V8.5l.8 2.5h1.1l.8-2.5v2.5h1.5V6.8h-1.4l-.7 2.1zM8.5 6.8H5v4.2h3.5v-1.3H6.5V9h1.8V7.8H6.5V8h2V6.8zm17 0h-3.5v4.2h1.5v-1.3h.8l1 1.3h1.9l-1.4-1.7c.5-.2.9-.7.9-1.3 0-.9-.7-1.2-1.2-1.2zm-.1 1.8h-.7V7.8h.8c.3 0 .5.1.5.4 0 .3-.2.4-.6.4z" fill="#fff" />
        </svg>
        {/* Discover */}
        <svg className="h-6 w-auto rounded bg-white shadow-sm" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="20" rx="2" fill="#fff" />
          <path d="M4 13h2.5c1.5 0 2.5-1 2.5-2.5S8 8 6.5 8H4v5zm1.2-3.8h1.1c.7 0 1.2.4 1.2 1.3 0 .8-.5 1.3-1.2 1.3H5.2V9.2zm13.7 0h1.2v3.8h1.2V9.2h1.2V8H18.9v5zm-9.2 0h1.2v3.8h1.2V9.2h1.2V8h-3.6v5zm5.5 3.9c1.5 0 2.5-1.1 2.5-2.6S16.5 8 15 8s-2.6 1.1-2.6 2.6 1 2.5 2.6 2.5zm0-1.1c-.8 0-1.3-.6-1.3-1.4 0-.9.5-1.4 1.3-1.4.8 0 1.3.6 1.3 1.4 0 .9-.5 1.4-1.3 1.4z" fill="#FF6000" />
        </svg>
      </>
    )}
  </div>
);

const Footer = () => {
  const { content } = useGlobalContent();
  const { general, footer } = content;

  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchJson<{ items: Product[]; total: number }>(`/products/paginated?limit=30&offset=0`);
        setProducts((res?.items || []) as Product[]);
      } catch {
        setProducts([]);
      }
    })();
  }, []);

  // Generate dynamic SEO links based on actual inventory
  const footerLinks = useMemo(() => {
    const links: { label: string; path: string }[] = [];

    // 1. Active Categories
    if (content.categories) {
      content.categories.filter(c => c.isActive).forEach(cat => {
        links.push({ label: `${cat.name} Solutions`, path: `/category/${cat.id}` });
      });
    }

    // 2. Brands (Extracted from inventory)
    const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
    brands.slice(0, 5).forEach(brand => {
      links.push({ label: `Buy ${brand}`, path: `/category?search=${encodeURIComponent(brand)}` });
    });

    // 3. Featured Products (Limit to avoid overcrowding)
    products.slice(0, 10).forEach(p => {
      // Create a concise label for the footer
      const shortName = p.name.length > 30 ? p.name.substring(0, 27) + '...' : p.name;
      links.push({ label: shortName, path: `/product/${p.sku}` });
    });

    return links.slice(0, 18); // Ensure we fill the grid nicely without overflow
  }, [content.categories, products]);

  return (
    <footer className="bg-navy-900 text-white pt-12 border-t border-navy-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Brand & identifiers */}
          <div>
            <h3 className="text-xl font-bold mb-4 tracking-tight">Server Tech Central</h3>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              {footer.aboutText}
            </p>

            <div className="bg-navy-800 rounded p-4 border border-navy-700">
              <h4 className="text-xs font-bold text-gray-200 uppercase mb-2 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-action-500" /> Government Identifiers
              </h4>
              <div className="flex justify-between text-xs text-gray-200 font-mono">
                <span>CAGE: <strong>{general.cageCode}</strong></span>
                <span>DUNS: <strong>{general.dunsNumber}</strong></span>
              </div>
            </div>
          </div>

          {/* Column 2: Products */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-100">Authorized Lines</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-action-500 rounded-full"></div> Cisco Enterprise</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-action-500 rounded-full"></div> Seagate Storage</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-action-500 rounded-full"></div> Fortinet Security</li>
              <li>Dell Technologies</li>
              <li>HPE</li>
            </ul>
          </div>

          {/* Column 3: Certifications */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-100">Compliance</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" /> ISO 9001 (Quality)
              </li>
              <li className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" /> ISO 14001 (Env)
              </li>
              <li className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" /> ISO 27001 (InfoSec)
              </li>
              <li>TAA Compliant</li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-100">Contact</h4>
            <p className="text-sm text-gray-300 mb-1">{general.phone}</p>
            <p className="text-sm text-gray-300">{general.email}</p>
            <div className="mt-4 text-xs text-gray-300">
              <p>Headquarters:</p>
              <p>{general.address}</p>
            </div>
            {footer.social && (
              <div className="mt-4">
                <h5 className="text-xs font-bold text-gray-300 uppercase mb-2">Follow Us</h5>
                <div className="flex items-center gap-3">
                  {footer.social.facebook ? (
                    <a href={footer.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded bg-navy-800 border border-navy-700 hover:bg-navy-700 transition">
                      <Facebook className="w-4 h-4 text-white" />
                    </a>
                  ) : null}
                  {footer.social.linkedin ? (
                    <a href={footer.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-2 rounded bg-navy-800 border border-navy-700 hover:bg-navy-700 transition">
                      <Linkedin className="w-4 h-4 text-white" />
                    </a>
                  ) : null}
                  {footer.social.twitter ? (
                    <a href={footer.social.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="p-2 rounded bg-navy-800 border border-navy-700 hover:bg-navy-700 transition">
                      <Twitter className="w-4 h-4 text-white" />
                    </a>
                  ) : null}
                  {footer.social.instagram ? (
                    <a href={footer.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded bg-navy-800 border border-navy-700 hover:bg-navy-700 transition">
                      <Instagram className="w-4 h-4 text-white" />
                    </a>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HTML Sitemap / Keyword Mesh */}
        <div className="border-t border-navy-800 pt-8 pb-8">
          <h4 className="text-xs font-bold text-gray-300 uppercase mb-4">Popular Hardware Searches</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-[11px] text-gray-300">
            {footerLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
                className="hover:text-white transition truncate block"
                title={link.label}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-navy-800 py-8 flex flex-col lg:flex-row justify-between items-center gap-6 text-xs text-gray-300">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span>&copy; {new Date().getFullYear()} Server Tech Central. All rights reserved.</span>
            <div className="hidden md:block w-px h-4 bg-navy-700"></div>
            <div id="amex-logo" style={{ width: 230, height: 50 }}>
              <img
                src="https://www.americanexpress.com/content/dam/amex/us/merchant/supplies-uplift/product/images/4_Card_color_horizontal.png"
                width="100%"
                height="100%"
                alt="American Express Accepted Here"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify_center gap-4 items-center">
            <Link to="/track" className="hover:text-white transition font-medium">Track Order</Link>
            <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition">Terms of Sale</Link>
            <Link to="/terms-and-conditions" className="hover:text-white transition">Terms & Conditions</Link>
            <Link to="/returns" className="hover:text-white transition">Return Policy</Link>
            <Link to="/warranty" className="hover:text-white transition">Warranty Policy</Link>
            <Link to="/about" className="hover:text-white transition">About Us</Link>
            <Link to="/contact" className="hover:text-white transition">Contact Us</Link>
            <Link to="/blog" className="hover:text-white transition">Blog</Link>
            <a
              href="https://www.iafcertsearch.org/certified-entity/cG4PRZ8w8KDgoIe7OuvfcNcO"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              ISO Certificates
            </a>
            <Link to="/sitemap" className="hover:text-white transition">Sitemap</Link>
            <Link to="/admin/login" className="flex items-center gap-1 text-gray-300 hover:text-white transition">
              <Lock className="w-3 h-3" /> Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
