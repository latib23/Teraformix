import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  FileDown,
  FileText,
  Headphones,
  MapPin,
  MessageSquare,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  X,
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import ProductCard from '../../components/ProductCard';
import Image from '../../components/Image';
import SEOHead from '../../components/SEO/SEOHead';
import JsonLd from '../../components/SEO/JsonLd';
import ProductLoading from './loading';
import { useProductData } from '../../hooks/useProductData';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useUI } from '../../contexts/UIContext';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { fetchJson } from '../../lib/api';
import { mockProducts } from '../../lib/mockData';
import { safeJsonScript } from '../../lib/security';

const QuoteBeatingForm = lazy(() => import('../../components/QuoteBeatingForm'));

type Review = {
  author: string;
  reviewBody: string;
  ratingValue: string;
  datePublished: string;
};

const ShippingTimer = React.memo(() => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; label: string } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const texasDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
      const currentDay = texasDate.getDay();
      const target = new Date(texasDate);
      target.setHours(15, 0, 0, 0);
      let label = 'Today';

      if (currentDay === 6) {
        target.setDate(target.getDate() + 2);
        label = 'Monday';
      } else if (currentDay === 0) {
        target.setDate(target.getDate() + 1);
        label = 'Monday';
      } else if (texasDate > target) {
        target.setDate(target.getDate() + (currentDay === 5 ? 3 : 1));
        label = currentDay === 5 ? 'Monday' : 'Tomorrow';
      }

      const difference = target.getTime() - texasDate.getTime();
      if (difference < 0) return setTimeLeft(null);

      setTimeLeft({
        days: Math.floor(difference / 86_400_000),
        hours: Math.floor((difference % 86_400_000) / 3_600_000),
        minutes: Math.floor((difference % 3_600_000) / 60_000),
        label,
      });
    };

    calculateTime();
    const interval = window.setInterval(calculateTime, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="flex items-start gap-3 border-y border-slate-200 py-4">
      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
      <div>
        <p className="text-sm font-bold text-slate-900">
          Order within {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{timeLeft.hours} hr {timeLeft.minutes} min
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Estimated dispatch {timeLeft.label === 'Today' ? 'today' : `on ${timeLeft.label}`} from our Texas facility.
        </p>
      </div>
    </div>
  );
});

const getFallbackOverview = (category: string | undefined, productName: string) => {
  if (category?.toLowerCase().includes('server')) {
    return `${productName} is built for demanding data-center compute, virtualization, and private-cloud workloads. The platform is prepared for reliable deployment with enterprise support and lifecycle continuity in mind.`;
  }
  if (category?.toLowerCase().includes('storage')) {
    return `${productName} is designed for sustained enterprise storage workloads where data integrity, predictable throughput, and serviceability are essential.`;
  }
  if (category?.toLowerCase().includes('network')) {
    return `${productName} supports resilient, low-latency network deployments and is suited to modern core, distribution, and edge architectures.`;
  }
  return `${productName} is a genuine enterprise hardware component prepared for production use and backed by Teraformix quality assurance.`;
};

const ProductPage = () => {
  const { sku } = useParams<{ sku: string }>();
  const { data, loading } = useProductData(sku);
  const product = data && !Array.isArray(data) ? data as Product : null;
  const { addToCart, cart } = useCart();
  const { openQuoteModal, showToast } = useUI();
  const { content } = useGlobalContent();

  const [activeTab, setActiveTab] = useState<'overview' | 'specifications' | 'compatibility' | 'warranty'>('overview');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [quantity, setQuantity] = useState(1);
  const [isStockQuoteOpen, setIsStockQuoteOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isBeatQuoteOpen, setIsBeatQuoteOpen] = useState(false);
  const [skuCopied, setSkuCopied] = useState(false);
  const [reviewForm, setReviewForm] = useState({ author: '', rating: 5, body: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [sku]);

  useEffect(() => {
    if (!product) return;
    try {
      const analytics = (window as any).gtag;
      if (analytics) {
        analytics('event', 'view_item', {
          items: [{
            item_id: product.sku,
            item_name: product.name,
            price: product.price,
            item_category: product.category,
          }],
        });
      }
    } catch {
      // Analytics must never block the product page.
    }
  }, [product?.category, product?.name, product?.price, product?.sku]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (!product?.category) {
        setRelatedProducts([]);
        return;
      }

      setLoadingRelated(true);
      try {
        const response = await fetchJson<{ items: Product[]; total: number }>(
          `/products/paginated?limit=8&category=${encodeURIComponent(product.category)}`,
        );
        if (!cancelled) {
          setRelatedProducts(
            (response?.items || [])
              .filter((item) => item.id !== product.id && item.sku !== product.sku)
              .slice(0, 4),
          );
        }
      } catch {
        if (!cancelled) {
          setRelatedProducts(
            (mockProducts as Product[])
              .filter((item) => item.category === product.category && item.sku !== product.sku)
              .slice(0, 4),
          );
        }
      } finally {
        if (!cancelled) setLoadingRelated(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [product?.category, product?.id, product?.sku]);

  const specifications = useMemo(() => {
    if (!product) return [];
    const entries = Object.entries(product.specs || {}).filter(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      return !normalizedKey.includes('review')
        && !normalizedKey.includes('schema')
        && !normalizedKey.includes('image')
        && typeof value !== 'object';
    });

    if (product.weight) entries.push(['Weight', product.weight]);
    if (product.dimensions) entries.push(['Dimensions', product.dimensions]);
    return entries;
  }, [product]);

  const reviews = useMemo<Review[]>(() => {
    if (!product) return [];
    const rawReviews = (product as any)?.schema?.reviews;
    let parsedReviews: any[] = [];

    if (Array.isArray(rawReviews)) {
      parsedReviews = rawReviews;
    } else if (typeof rawReviews === 'string') {
      try {
        const parsed = JSON.parse(rawReviews);
        parsedReviews = Array.isArray(parsed) ? parsed : [];
      } catch {
        parsedReviews = [];
      }
    }

    return parsedReviews
        .filter((review: any) => review && review.status === 'APPROVED')
        .map((review: any) => ({
          author: String(review.author || 'Verified buyer'),
          reviewBody: String(review.reviewBody || ''),
          ratingValue: String(review.ratingValue || '5'),
          datePublished: String(review.datePublished || ''),
        }));
  }, [product?.id]);

  if (loading) return <ProductLoading />;
  if (!product) return <Navigate to="/404" replace />;

  const categorySlug = product.category ? product.category.toLowerCase().replace(/\s+/g, '-') : '';
  const stockLevel = typeof product.stockLevel === 'number' ? product.stockLevel : 0;
  const inStock = product.stockStatus === 'IN_STOCK';
  const maxQuantity = stockLevel > 0 ? stockLevel : 999;
  const overview = product.overview || getFallbackOverview(product.category, product.name);
  const productSearchText = `${product.name} ${product.category || ''} ${product.description || ''}`;
  const productImageFallback = /\b(ddr|rdimm|dimm|memory|ram)\b/i.test(productSearchText)
    ? '/product-assets/ddr5-ecc-rdimm.jpg'
    : undefined;
  const productImageSource = productImageFallback && product.image.includes('semiconductor.samsung.com')
    ? productImageFallback
    : product.image;
  const keySpecifications = specifications.slice(0, 4);
  const condition = String((product.specs as Record<string, unknown> | undefined)?.Condition || 'New');
  const schemaRating = Number((product as any)?.schema?.ratingValue);
  const averageRating = Number.isFinite(schemaRating) && schemaRating > 0
    ? schemaRating
    : reviews.length > 0
      ? reviews.reduce((total, review) => total + (Number(review.ratingValue) || 0), 0) / reviews.length
      : null;
  const schemaReviewCount = Number((product as any)?.schema?.reviewCount);
  const reviewCount = Number.isFinite(schemaReviewCount) && schemaReviewCount > 0 ? schemaReviewCount : reviews.length;

  const productFaqs = [
    {
      q: 'Is this genuine OEM hardware?',
      a: `Yes. This ${product.name} is verified as genuine ${product.brand || 'OEM'} hardware and is prepared with a clean serial number for deployment.`,
    },
    {
      q: 'How is the product prepared before shipping?',
      a: 'Hardware is visually inspected, verified against its listing, safely packaged, and checked for the applicable firmware or functional requirements before dispatch.',
    },
    {
      q: 'What warranty and return coverage is included?',
      a: product.warranty || 'A standard 3-year Teraformix hardware warranty and 30-day return window apply unless the quote or listing states otherwise.',
    },
  ];

  const handleAddToCart = () => {
    const cartItem = cart.find((item: any) => item.id === product.id);
    const currentQuantity = cartItem ? cartItem.quantity : 0;

    if (inStock && stockLevel > 0 && currentQuantity + quantity > stockLevel) {
      setIsStockQuoteOpen(true);
      return;
    }

    try {
      const analytics = (window as any).gtag;
      analytics?.('event', 'add_to_cart', {
        items: [{
          item_id: product.sku,
          item_name: product.name,
          price: product.price,
          quantity,
        }],
      });
    } catch {
      // Analytics must never block cart actions.
    }

    addToCart(product, quantity);
    setQuantity(1);
  };

  const handleCopySku = async () => {
    try {
      await navigator.clipboard.writeText(product.sku);
      setSkuCopied(true);
      window.setTimeout(() => setSkuCopied(false), 1800);
    } catch {
      showToast('Part number could not be copied.', 'error');
    }
  };

  const handleReviewSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmittingReview(true);
    try {
      await fetchJson(`/products/${product.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          author: reviewForm.author,
          ratingValue: reviewForm.rating,
          reviewBody: reviewForm.body,
        }),
      });
      showToast('Review submitted for approval.', 'success');
      setIsReviewOpen(false);
      setReviewForm({ author: '', rating: 5, body: '' });
    } catch {
      showToast('Review could not be submitted.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://teraformix.com/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category || 'Products',
        item: categorySlug ? `https://teraformix.com/category/${categorySlug}` : 'https://teraformix.com/category',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://teraformix.com/product/${product.sku}`,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: productFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'compatibility', label: 'Compatibility' },
    { id: 'warranty', label: 'Warranty' },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <SEOHead
        title={product.metaTitle || `${product.name} ${product.sku} | Teraformix`}
        description={product.metaDescription || `${product.name} (${product.sku}) genuine ${product.brand || 'OEM'} enterprise hardware with procurement support and warranty coverage.`}
        canonicalUrl={`https://teraformix.com/product/${product.sku}`}
        type="product"
        image={product.image}
        price={product.price}
        availability={inStock ? 'instock' : 'backorder'}
      />
      <JsonLd data={product} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonScript(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonScript(faqSchema) }} />

      {isStockQuoteOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="relative w-full max-w-md bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsStockQuoteOpen(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close stock notice"
            >
              <X className="h-5 w-5" />
            </button>
            <PackageCheck className="h-9 w-9 text-emerald-700" />
            <h2 className="mt-5 text-xl font-bold text-slate-950">Quantity requires validation</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              We currently show {stockLevel} units available. Our procurement team can verify additional stock and volume pricing.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsStockQuoteOpen(false);
                openQuoteModal(`${product.name} (${product.sku}) - ${quantity} units requested`);
              }}
              className="mt-6 w-full bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Request availability quote
            </button>
          </div>
        </div>
      ) : null}

      {isReviewOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="relative w-full max-w-lg bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsReviewOpen(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close review form"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-950">Write a product review</h2>
            <p className="mt-2 text-sm text-slate-500">Reviews are moderated before publication.</p>
            <form onSubmit={handleReviewSubmit} className="mt-6 space-y-5">
              <label className="block text-sm font-semibold text-slate-700">
                Your name
                <input
                  required
                  value={reviewForm.author}
                  onChange={(event) => setReviewForm((current) => ({ ...current, author: event.target.value }))}
                  className="mt-2 h-11 w-full border border-slate-300 px-3 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </label>
              <fieldset>
                <legend className="text-sm font-semibold text-slate-700">Rating</legend>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewForm((current) => ({ ...current, rating }))}
                      aria-label={`${rating} star rating`}
                    >
                      <Star className={`h-7 w-7 ${rating <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm font-semibold text-slate-700">
                Review
                <textarea
                  required
                  rows={5}
                  value={reviewForm.body}
                  onChange={(event) => setReviewForm((current) => ({ ...current, body: event.target.value }))}
                  className="mt-2 w-full border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {isSubmittingReview ? 'Submitting review...' : 'Submit review'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {isBeatQuoteOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsBeatQuoteOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close price request"
            >
              <X className="h-5 w-5" />
            </button>
            <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Loading price request...</div>}>
              <QuoteBeatingForm productName={product.name} />
            </Suspense>
          </div>
        </div>
      ) : null}

      <Header />
      <Breadcrumbs
        items={[
          { label: product.category || 'Products', path: categorySlug ? `/category/${categorySlug}` : '/category' },
          { label: product.sku, path: `/product/${product.sku}` },
        ]}
      />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 xl:gap-10">
              <div className="lg:col-span-6 xl:col-span-5">
                <figure className="overflow-hidden border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase ${inStock ? 'text-emerald-800' : 'text-amber-800'}`}>
                      <span className={`h-2 w-2 ${inStock ? 'bg-emerald-600' : 'bg-amber-500'}`} />
                      {inStock ? 'Ready to ship' : 'Sourced to order'}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{condition} condition</span>
                  </div>
                  <div className="flex aspect-[4/3] items-center justify-center bg-white p-5 sm:p-8">
                    <Image
                      src={productImageSource}
                      fallbackSrc={productImageFallback}
                      alt={`${product.name} ${product.sku}`}
                      className="h-full w-full object-contain"
                      width={760}
                      height={570}
                      priority
                    />
                  </div>
                  <figcaption className="flex items-start gap-2 border-t border-slate-200 px-4 py-3 text-xs leading-5 text-slate-500">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    Product identity, condition, and part number are verified before fulfillment. Appearance may vary by manufacturing lot.
                  </figcaption>
                </figure>

                <div className="grid grid-cols-3 border-x border-b border-slate-200 bg-slate-50">
                  {[
                    ['OEM', product.brand || 'Verified'],
                    ['Condition', condition],
                    ['Ships from', 'Texas, USA'],
                  ].map(([label, value]) => (
                    <div key={label} className="border-r border-slate-200 px-3 py-4 last:border-r-0 sm:px-4">
                      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
                      <p className="mt-1 text-xs font-bold text-slate-950 sm:text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 xl:col-span-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase">
                  <span className="text-emerald-700">{product.brand || 'Enterprise hardware'}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-500">{product.category || 'Products'}</span>
                </div>

                <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950 lg:text-[34px]">{product.name}</h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {averageRating ? (
                    <>
                      <div className="flex text-amber-400" aria-label={`Rated ${averageRating.toFixed(1)} out of 5`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-4 w-4 ${star <= Math.round(averageRating) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <a href="#reviews" className="text-sm font-semibold text-emerald-700 hover:underline">
                        {averageRating.toFixed(1)} from {reviewCount} verified review{reviewCount === 1 ? '' : 's'}
                      </a>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      Quality inspected
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-y border-slate-200 py-3">
                  <span className="text-xs font-semibold text-slate-500">Manufacturer part number</span>
                  <span className="font-mono text-xs font-bold text-slate-900">{product.sku}</span>
                  <button
                    type="button"
                    onClick={handleCopySku}
                    className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                    aria-label="Copy manufacturer part number"
                    title="Copy part number"
                  >
                    {skuCopied ? <Check className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <p className="mt-5 text-[15px] leading-7 text-slate-600">
                  {product.description || overview}
                </p>

                {keySpecifications.length > 0 ? (
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase text-slate-500">Key specifications</h2>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${inStock ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {inStock ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        {inStock ? `${stockLevel || 'Stock'} available` : 'Lead time applies'}
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 border border-slate-200 bg-slate-50">
                      {keySpecifications.map(([label, value], index) => (
                        <div
                          key={label}
                          className={`min-h-[84px] p-4 ${index % 2 === 0 ? 'border-r border-slate-200' : ''} ${index < 2 ? 'border-b border-slate-200' : ''}`}
                        >
                          <dt className="text-[11px] font-semibold uppercase text-slate-500">{label}</dt>
                          <dd className="mt-2 text-sm font-bold text-slate-950">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('specifications');
                    document.getElementById('product-information')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:underline"
                >
                  See complete technical specifications
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <aside className="lg:col-span-12 xl:col-span-3">
                <div className="sticky top-28 overflow-hidden border border-slate-300 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
                  <div className="bg-slate-950 p-5 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase text-emerald-400">
                        {product.showPrice ? 'Direct purchase' : 'Commercial request'}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                        <span className={`h-1.5 w-1.5 ${inStock ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {inStock ? 'Available' : 'Lead time'}
                      </span>
                    </div>
                    {product.showPrice ? (
                      <div className="mt-3 text-3xl font-bold">${product.price.toLocaleString()}</div>
                    ) : (
                      <>
                        <h2 className="mt-3 text-2xl font-bold">Get your formal quote</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">Pricing, lead time, freight, and terms in one response.</p>
                      </>
                    )}
                  </div>

                  <div className="p-5">
                    <ShippingTimer />

                    <dl className="space-y-3 border-b border-slate-200 py-5 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">Availability</dt>
                        <dd className={`font-bold ${inStock ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {inStock ? `${stockLevel || 'Limited'} in stock` : 'Confirm lead time'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">Ground shipping</dt>
                        <dd className="font-bold text-slate-900">Free</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">Warranty</dt>
                        <dd className="font-bold text-slate-900">{product.warranty || '3 years'}</dd>
                      </div>
                    </dl>

                    {product.showPrice && inStock ? (
                      <div className="mt-5">
                        <label className="text-xs font-bold uppercase text-slate-500" htmlFor="product-quantity">Quantity</label>
                        <div className="mt-2 grid h-11 grid-cols-[44px_1fr_44px] border border-slate-300">
                          <button
                            type="button"
                            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                            className="flex items-center justify-center border-r border-slate-300 text-slate-700 hover:bg-slate-50"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            id="product-quantity"
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={quantity}
                            onChange={(event) => setQuantity(Math.min(maxQuantity, Math.max(1, Number(event.target.value) || 1)))}
                            className="w-full text-center font-bold text-slate-950 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                            className="flex items-center justify-center border-l border-slate-300 text-slate-700 hover:bg-slate-50"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          className="mt-3 flex w-full items-center justify-center gap-2 bg-emerald-700 px-4 py-3.5 font-bold text-white hover:bg-emerald-800"
                        >
                          <ShoppingCart className="h-5 w-5" />
                          Add to cart
                        </button>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => openQuoteModal(`${product.name} (SKU: ${product.sku})`)}
                      className={`${product.showPrice && inStock ? 'mt-3 border border-slate-300 bg-white text-slate-900 hover:border-slate-900' : 'mt-5 bg-emerald-700 text-white hover:bg-emerald-800'} w-full px-4 py-3.5 font-bold`}
                    >
                      {product.showPrice ? 'Request volume quote' : 'Request pricing and availability'}
                    </button>
                    <p className="mt-2 text-center text-[11px] leading-5 text-slate-500">Typical response within one business hour.</p>

                    {product.showPrice ? (
                      <button
                        type="button"
                        onClick={() => setIsBeatQuoteOpen(true)}
                        className="mt-3 w-full border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:border-slate-900"
                      >
                        Submit a competitor price
                      </button>
                    ) : null}

                    <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
                      <a
                        href={`tel:${content.general.phone}`}
                        className="flex items-start gap-3 text-sm font-bold text-slate-900 hover:text-emerald-700"
                      >
                        <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                        <span>
                          {content.general.phone}
                          <span className="mt-0.5 block text-xs font-normal text-slate-500">Technical compatibility support</span>
                        </span>
                      </a>
                      <div className="flex items-start gap-3 text-sm text-slate-700">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                        <span>
                          Austin, Texas
                          <span className="mt-0.5 block text-xs text-slate-500">Domestic and export fulfillment</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-slate-200 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[
              { icon: ShieldCheck, title: 'Genuine OEM', detail: 'Serial and part verification' },
              { icon: Award, title: '3-year warranty', detail: 'Hardware replacement coverage' },
              { icon: Truck, title: 'Worldwide fulfillment', detail: 'Professional export documentation' },
              { icon: FileText, title: 'Purchase orders', detail: 'Terms for qualified organizations' },
            ].map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex items-center gap-3 py-6 sm:px-6 sm:first:pl-0">
                <Icon className="h-6 w-6 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-sm font-bold text-slate-950">{title}</p>
                  <p className="mt-1 text-xs text-slate-500">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="product-information" className="mx-auto max-w-[1360px] scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="border-b border-slate-200">
            <div className="flex gap-7 overflow-x-auto" role="tablist" aria-label="Product information">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 py-4 text-sm font-bold ${activeTab === tab.id ? 'border-emerald-700 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12 py-10 lg:grid-cols-12">
            <article className="lg:col-span-8" role="tabpanel">
              {activeTab === 'overview' ? (
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-700">Product overview</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">Built for reliable enterprise deployment</h2>
                  <p className="mt-5 max-w-4xl whitespace-pre-line text-base leading-8 text-slate-600">{overview}</p>
                  <div className="mt-8 grid grid-cols-1 border border-slate-200 sm:grid-cols-3">
                    {[
                      ['Authenticate', 'OEM identity, serial, and part number verification.'],
                      ['Validate', 'Condition and listing details checked before release.'],
                      ['Protect', 'ESD-safe packing and shipment preparation.'],
                    ].map(([title, detail], index) => (
                      <div key={title} className="border-b border-slate-200 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                        <span className="text-xs font-bold text-emerald-700">0{index + 1}</span>
                        <h3 className="mt-2 font-bold text-slate-950">{title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === 'specifications' ? (
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-700">Technical data</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">Product specifications</h2>
                  {specifications.length > 0 ? (
                    <dl className="mt-7 border-t border-slate-200">
                      {specifications.map(([label, value]) => (
                        <div key={label} className="grid grid-cols-1 gap-2 border-b border-slate-200 py-4 text-sm sm:grid-cols-[minmax(180px,1fr)_2fr]">
                          <dt className="font-bold text-slate-800">{label}</dt>
                          <dd className="text-slate-600">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-5 text-slate-600">Detailed specifications are available from our technical sales team.</p>
                  )}
                </div>
              ) : null}

              {activeTab === 'compatibility' ? (
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-700">Compatibility</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">Confirm your deployment requirements</h2>
                  <p className="mt-5 max-w-4xl whitespace-pre-line text-base leading-8 text-slate-600">
                    {product.compatibility || 'Compatibility depends on system generation, firmware, backplane, and controller configuration. Share your current platform or BOM with our technical team for validation before ordering.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => openQuoteModal(`Compatibility check for ${product.name} (${product.sku})`)}
                    className="mt-7 bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Request compatibility check
                  </button>
                </div>
              ) : null}

              {activeTab === 'warranty' ? (
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-700">Coverage</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">Warranty and returns</h2>
                  <p className="mt-5 max-w-4xl text-base leading-8 text-slate-600">
                    {product.warranty || 'This product includes a standard 3-year Teraformix hardware warranty. Eligible unopened items may be returned within 30 days with an approved RMA.'}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-4">
                    <Link to="/warranty" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:underline">
                      Warranty policy <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/returns" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:underline">
                      Return policy <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : null}
            </article>

            <aside className="lg:col-span-4">
              <div className="border-l-2 border-emerald-700 pl-6">
                <Building2 className="h-7 w-7 text-emerald-700" />
                <h2 className="mt-4 text-lg font-bold text-slate-950">Procurement ready</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {[
                    'Formal quotes and volume pricing',
                    'Purchase orders and qualified Net terms',
                    'Asset reporting and serial capture',
                    'Domestic and international freight support',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-slate-200 pt-5 font-mono text-xs text-slate-500">
                  <p>CAGE: {content.general.cageCode}</p>
                  <p className="mt-1">DUNS: {content.general.dunsNumber}</p>
                </div>
              </div>

              {product.datasheet ? (
                <a
                  href={product.datasheet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 flex items-center justify-between border border-slate-300 p-4 text-sm font-bold text-slate-900 hover:border-slate-900"
                >
                  Download product datasheet
                  <FileDown className="h-5 w-5 text-emerald-700" />
                </a>
              ) : null}
            </aside>
          </div>
        </section>

        <section id="reviews" className="scroll-mt-24 border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-[1360px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-700">Customer validation</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Feedback from infrastructure teams</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:border-slate-900"
              >
                Write a review
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div className="border-l-4 border-emerald-700 bg-white p-6">
                <p className="text-xs font-bold uppercase text-slate-500">Overall rating</p>
                <div className="mt-3 text-5xl font-bold text-slate-950">{averageRating ? averageRating.toFixed(1) : '—'}</div>
                {averageRating ? (
                  <div className="mt-3 flex text-amber-400" aria-label={`Rated ${averageRating.toFixed(1)} out of 5`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'fill-current' : 'text-slate-200'}`} />
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {reviewCount > 0 ? `Based on ${reviewCount} approved customer reviews.` : 'No approved product reviews yet.'}
                </p>
                <div className="mt-6 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
                  Reviews are linked to completed orders and moderated before publication.
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {reviews.slice(0, 3).map((review, index) => {
                    const rating = Number(review.ratingValue) || 5;
                    return (
                      <article key={`${review.author}-${index}`} className="flex min-h-[250px] flex-col border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`h-4 w-4 ${star <= Math.round(rating) ? 'fill-current' : 'text-slate-200'}`} />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-500">{rating.toFixed(1)}</span>
                        </div>
                        <blockquote className="mt-5 flex-grow text-sm leading-6 text-slate-700">
                          &ldquo;{review.reviewBody}&rdquo;
                        </blockquote>
                        <div className="mt-5 border-t border-slate-200 pt-4">
                          <p className="text-sm font-bold text-slate-950">{review.author}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-700" />
                            Verified buyer{review.datePublished ? `, ${review.datePublished}` : ''}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[250px] items-center justify-center border border-slate-200 bg-white p-8 text-center">
                  <div>
                    <MessageSquare className="mx-auto h-7 w-7 text-emerald-700" />
                    <p className="mt-4 font-bold text-slate-950">Be the first to review this product</p>
                    <p className="mt-2 text-sm text-slate-500">Share deployment and compatibility feedback with other buyers.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-20">
          <div className="lg:col-span-8">
            <p className="text-xs font-bold uppercase text-emerald-700">Common questions</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Product FAQ</h2>
            <div className="mt-7 border-t border-slate-200">
              {productFaqs.map((faq, index) => (
                <div key={faq.q} className="border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-5 py-5 text-left"
                    aria-expanded={openFaq === index}
                  >
                    <span className="font-bold text-slate-900">{faq.q}</span>
                    {openFaq === index
                      ? <ChevronUp className="h-5 w-5 shrink-0 text-slate-500" />
                      : <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />}
                  </button>
                  {openFaq === index ? (
                    <p className="max-w-3xl pb-5 text-sm leading-7 text-slate-600">{faq.a}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <aside className="bg-slate-950 p-7 text-white lg:col-span-4">
            <MessageSquare className="h-7 w-7 text-emerald-400" />
            <h2 className="mt-4 text-xl font-bold">Still validating the part?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Send the system model, current configuration, or BOM and our technical sales team will help confirm fit.
            </p>
            <button
              type="button"
              onClick={() => openQuoteModal(`Technical question about ${product.name} (${product.sku})`)}
              className="mt-6 inline-flex items-center gap-2 bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500"
            >
              Ask technical sales
              <ArrowRight className="h-4 w-4" />
            </button>
          </aside>
        </section>

        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-700">Continue sourcing</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Related {product.category || 'products'}</h2>
              </div>
              <Link
                to={categorySlug ? `/category/${categorySlug}` : '/category'}
                className="hidden items-center gap-2 text-sm font-bold text-emerald-700 hover:underline sm:flex"
              >
                View category
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {loadingRelated ? (
                [1, 2, 3, 4].map((item) => <div key={item} className="h-[360px] animate-pulse border border-slate-200 bg-white" />)
              ) : relatedProducts.length > 0 ? (
                relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))
              ) : (
                <div className="col-span-full border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  No related products are currently listed.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;
