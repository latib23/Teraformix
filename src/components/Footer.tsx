import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Facebook,
  Instagram,
  Linkedin,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Twitter,
} from 'lucide-react';
import { useGlobalContent } from '../contexts/GlobalContent';
import { Product } from '../types';
import { fetchJson } from '../lib/api';

const Footer = () => {
  const { content } = useGlobalContent();
  const { general, footer, settings } = content;
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetchJson<{ items: Product[]; total: number }>('/products/paginated?limit=12&offset=0');
        setProducts(response?.items || []);
      } catch {
        setProducts([]);
      }
    })();
  }, []);

  const catalogLinks = useMemo(() => {
    const categories = content.categories
      .filter((category) => category.isActive)
      .slice(0, 6)
      .map((category) => ({ label: category.name, path: `/category/${category.id}` }));

    const brands = Array.from(new Set(products.map((product) => product.brand).filter(Boolean)))
      .slice(0, 4)
      .map((brand) => ({
        label: `${brand} hardware`,
        path: `/category?search=${encodeURIComponent(brand)}`,
      }));

    return [...categories, ...brands].slice(0, 8);
  }, [content.categories, products]);

  const socialLinks = [
    { href: footer.social?.linkedin, label: 'LinkedIn', icon: Linkedin },
    { href: footer.social?.twitter, label: 'Twitter', icon: Twitter },
    { href: footer.social?.facebook, label: 'Facebook', icon: Facebook },
    { href: footer.social?.instagram, label: 'Instagram', icon: Instagram },
  ].filter((item) => item.href);

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-700">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-9 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-400">Procurement support</p>
            <h2 className="mt-2 text-2xl font-bold">Need a validated infrastructure quote?</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Send a BOM or work directly with our sales engineering team for compatibility, lead-time, and volume pricing.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              to="/upload-bom"
              className="inline-flex h-11 items-center justify-center border border-slate-700 px-5 text-sm font-bold text-white transition hover:border-white"
            >
              Upload BOM
            </Link>
            <Link
              to="/contact"
              className="inline-flex h-11 items-center justify-center gap-2 bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-500"
            >
              Contact sales
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-slate-200 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-5 sm:px-6 sm:first:pl-0">
            <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-700" />
            <div>
              <div className="text-sm font-bold text-slate-900">Verified supply chain</div>
              <div className="text-xs text-slate-500">Genuine OEM hardware and clean serials</div>
            </div>
          </div>
          <div className="flex items-center gap-3 py-5 sm:px-6">
            <Award className="h-6 w-6 shrink-0 text-emerald-700" />
            <div>
              <div className="text-sm font-bold text-slate-900">ISO-certified operations</div>
              <div className="text-xs text-slate-500">9001, 14001, and 27001 standards</div>
            </div>
          </div>
          <div className="flex items-center gap-3 py-5 sm:px-6 sm:last:pr-0">
            <ArrowRight className="h-6 w-6 shrink-0 text-emerald-700" />
            <div>
              <div className="text-sm font-bold text-slate-900">Commercial terms</div>
              <div className="text-xs text-slate-500">Purchase orders and qualified Net terms</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.logoText}
                className="h-10 w-[180px] object-contain"
              />
            ) : (
              <div className="text-xl font-black text-slate-950">{settings.logoText}</div>
            )}
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-600">{footer.aboutText}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-l-2 border-emerald-600 pl-4 font-mono text-xs text-slate-600">
              <span>CAGE: <strong className="text-slate-900">{general.cageCode}</strong></span>
              <span>DUNS: <strong className="text-slate-900">{general.dunsNumber}</strong></span>
            </div>
            {socialLinks.length > 0 ? (
              <div className="mt-6 flex items-center gap-2">
                {socialLinks.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center border border-slate-300 text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-950">Catalog</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/category" className="hover:text-emerald-700">All products</Link></li>
              <li><Link to="/configurator" className="hover:text-emerald-700">Server builder</Link></li>
              {catalogLinks.slice(0, 5).map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-emerald-700">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-950">Procurement</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/upload-bom" className="hover:text-emerald-700">Upload a BOM</Link></li>
              <li><Link to="/track" className="hover:text-emerald-700">Track an order</Link></li>
              <li><Link to="/how-our-hardware-is-prepared" className="hover:text-emerald-700">Hardware preparation</Link></li>
              <li><Link to="/warranty" className="hover:text-emerald-700">Warranty</Link></li>
              <li><Link to="/returns" className="hover:text-emerald-700">Returns</Link></li>
              <li><Link to="/account" className="hover:text-emerald-700">Customer account</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-sm font-bold text-slate-950">Sales and support</h3>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <a href={`tel:${general.phone}`} className="font-semibold text-slate-900 hover:text-emerald-700">
                  {general.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <a href={`mailto:${general.email}`} className="break-all hover:text-emerald-700">{general.email}</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span className="max-w-xs leading-6">{general.address}</span>
              </li>
            </ul>
            <p className="mt-6 text-xs leading-5 text-slate-500">
              Major credit cards accepted. Purchase orders and Net terms are available for qualified organizations.
            </p>
          </div>
        </div>

        {catalogLinks.length > 5 ? (
          <div className="mt-10 border-t border-slate-200 pt-6">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
              <span className="font-bold text-slate-700">Popular hardware:</span>
              {catalogLinks.slice(5).map((link) => (
                <Link key={link.path} to={link.path} className="hover:text-emerald-700">{link.label}</Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-5 border-t border-slate-200 pt-6 text-xs text-slate-500 lg:flex-row lg:items-center lg:justify-between">
          <span>&copy; {new Date().getFullYear()} Teraformix. All rights reserved.</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-900">Terms of sale</Link>
            <Link to="/terms-and-conditions" className="hover:text-slate-900">Terms and conditions</Link>
            <Link to="/about" className="hover:text-slate-900">Company</Link>
            <Link to="/blog" className="hover:text-slate-900">Insights</Link>
            <Link to="/sitemap" className="hover:text-slate-900">Sitemap</Link>
            <Link to="/admin/login" className="flex items-center gap-1 hover:text-slate-900">
              <Lock className="h-3 w-3" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
