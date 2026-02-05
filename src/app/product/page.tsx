
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useProductData } from '../../hooks/useProductData';
import { Product } from '../../types';
import { CheckCircle, Shield, ArrowRight, ShieldCheck, Award, Clock, Truck, Star, ThumbsUp, MessageSquare, BookOpen, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, DollarSign, Microscope, Activity, Package, Lock, Unlock, Cpu, ShoppingCart, FileText } from 'lucide-react';
import JsonLd from '../../components/SEO/JsonLd';
import Image from '../../components/Image';
import ProductLoading from './loading';
import { mockProducts } from '../../lib/mockData';
import SEOHead from '../../components/SEO/SEOHead';
import { useCart } from '../../contexts/CartContext';
import { fetchJson } from '../../lib/api';
import { useUI } from '../../contexts/UIContext';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { generateUniversalReviews } from '../../lib/universal-reviews';


// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Lazy load heavy components that are not immediately visible
const TrustBox = lazy(() => import('../../components/TrustBox'));
const ProductCard = lazy(() => import('../../components/ProductCard'));
const QuoteBeatingForm = lazy(() => import('../../components/QuoteBeatingForm'));

// In Next.js, this would be exported to generate server-side metadata
export async function generateMetadata({ params }: { params: { sku: string } }) {
  // Placeholder for server-side logic
  return {
    title: `Product ${params.sku} | Server Tech Central`
  };
}

const ShippingTimer = React.memo(() => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, label: string } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      // Texas is Central Time (America/Chicago)
      // We parse the string to get the wall-clock time in Texas
      const txTimeStr = now.toLocaleString("en-US", { timeZone: "America/Chicago" });
      const txDate = new Date(txTimeStr);

      const currentDay = txDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

      let target = new Date(txDate);
      target.setHours(15, 0, 0, 0); // Target 3:00 PM

      let label = "Today";

      // Determine cutoff and shipping day logic
      if (currentDay === 6) { // Saturday
        target.setDate(target.getDate() + 2); // Move to Monday
        label = "Monday";
      } else if (currentDay === 0) { // Sunday
        target.setDate(target.getDate() + 1); // Move to Monday
        label = "Monday";
      } else {
        // Weekday (Mon-Fri)
        if (txDate > target) {
          // Missed today's cutoff
          target.setDate(target.getDate() + 1); // Tomorrow
          label = "Tomorrow";
          if (currentDay === 5) { // Friday afternoon -> Monday
            target.setDate(target.getDate() + 2); // Move to Monday
            label = "Monday";
          }
        }
      }

      const diff = target.getTime() - txDate.getTime();

      if (diff < 0) {
        // Fallback safety
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes, label });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 10000); // Update every 10 seconds for accuracy
    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-6 flex items-start gap-3">
      <Clock className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
      <div>
        <div className="text-sm font-bold text-navy-900 leading-tight">
          Order within {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{timeLeft.hours} hr {timeLeft.minutes} min
        </div>
        <div className="text-xs text-blue-700 font-medium mt-1">
          for shipping <span className="font-bold underline decoration-blue-300 decoration-2 underline-offset-2">{timeLeft.label === 'Today' ? 'today' : `on ${timeLeft.label}`}</span> (Texas Time).
        </div>
      </div>
    </div>
  );
});

// Fallback helper if no overview is provided in DB
const getFallbackContent = (category: string | undefined, productName: string) => {
  if (category?.includes('Server')) {
    return {
      title: "Enterprise Compute & Virtualization Performance",
      text: `The ${productName} is engineered to handle demanding workloads in modern data centers. Optimized for virtualization environments like VMware vSphere and Microsoft Hyper-V, this server platform delivers high-density computing power with redundant reliability.`
    };
  } else if (category?.includes('Storage')) {
    return {
      title: "Data Integrity & High-Throughput Archival",
      text: `Designed for 24/7 reliability, the ${productName} is an ideal solution for SAN, NAS, and DAS environments. With enterprise-class vibration tolerance and end-to-end data path protection, this storage device ensures data integrity for mission-critical applications.`
    };
  } else if (category?.includes('Networking')) {
    return {
      title: "Low-Latency Switching & Network Resilience",
      text: `Maximize your network backbone with the ${productName}. Built for high-bandwidth applications, this unit reduces latency in spine-leaf architectures and edge deployments. It supports advanced Layer 2 and Layer 3 protocols.`
    };
  }
  return {
    title: "Enterprise-Grade Reliability",
    text: `The ${productName} undergoes a comprehensive 28-point inspection process at our ISO 9001 certified facility. Designed for longevity and performance, this component is essential for maintaining business continuity.`
  };
};

const ProductPage = () => {
  const { sku } = useParams<{ sku: string; }>();
  const productId = sku;

  const { data, loading } = useProductData(productId);
  const { addToCart, cart } = useCart();
  const { openQuoteModal } = useUI(); // Hook into UI Context
  const { content } = useGlobalContent();
  const { cageCode, dunsNumber } = content.general;
  const activeCategories = Array.isArray((content as any).categories) ? (content as any).categories.filter((c: any) => c && c.isActive) : [];

  // Safe cast to ensure we have a single product, not an array
  const product = (data && !Array.isArray(data)) ? (data as Product) : null;

  const [activeTab, setActiveTab] = useState('specs');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isBeatQuoteModalOpen, setIsBeatQuoteModalOpen] = useState(false);
  const [isStockQuoteModalOpen, setIsStockQuoteModalOpen] = useState(false);

  // Quantity selector state
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ author: '', rating: 5, body: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Review Slider State
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // Handle add to cart with stock validation
  const handleAddToCart = () => {
    if (!product) return;

    const stockLevel = typeof product.stockLevel === 'number' ? product.stockLevel : 0;

    // Check current cart quantity for this product
    const cartItem = cart.find((item: any) => item.id === product.id);
    const currentCartQty = cartItem ? cartItem.quantity : 0;
    const totalRequested = currentCartQty + quantity;

    if (product.stockStatus === 'IN_STOCK' && totalRequested > stockLevel) {
      // Show quote modal instead
      setIsStockQuoteModalOpen(true);
      return;
    }

    // Track analytics
    const g = (window as any).gtag;
    if (g) {
      g('event', 'add_to_cart', {
        items: [{ item_id: product.sku, item_name: product.name, price: product.price, quantity }]
      });
    }

    addToCart(product, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  const { showToast } = useUI();

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmittingReview(true);
    try {
      await fetchJson(`/products/${product.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          author: reviewForm.author,
          ratingValue: reviewForm.rating,
          reviewBody: reviewForm.body
        })
      });
      showToast('Review submitted for approval!', 'success');
      setIsReviewModalOpen(false);
      setReviewForm({ author: '', rating: 5, body: '' });
    } catch (err) {
      showToast('Failed to submit review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [sku]);

  useEffect(() => {
    if (!product) return;
    try {
      const g = (window as any).gtag;
      if (g) {
        g('event', 'view_item', { items: [{ item_id: product.sku, item_name: product.name, price: product.price, item_category: product.category }] });
      }
    } catch { }
  }, [product?.sku]);

  // Related: Fetch same-category products (exclude current) - Debounced for performance
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const loadRelated = async () => {
      if (!product?.category) { setRelatedProducts([]); return; }

      // Debounce: wait a bit before loading related products
      const timer = setTimeout(async () => {
        if (isCancelled) return;
        setLoadingRelated(true);
        try {
          const res = await fetchJson<{ items: Product[]; total: number }>(`/products/paginated?limit=8&category=${encodeURIComponent(product.category)}`);
          if (!isCancelled) {
            const items = ((res?.items || []) as Product[])
              .filter(r => r.id !== product.id && r.sku !== product.sku)
              .slice(0, 4);
            setRelatedProducts(items);
          }
        } catch {
          if (!isCancelled) {
            const fallback = (mockProducts as any as Product[])
              .filter(p => p.category === product.category && p.sku !== product.sku)
              .slice(0, 4);
            setRelatedProducts(fallback);
          }
        } finally {
          if (!isCancelled) setLoadingRelated(false);
        }
      }, 300); // 300ms debounce

      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    };
    loadRelated();
  }, [product?.category, product?.id, product?.sku]);

  // Memoize fallback content to avoid recalculation - MUST be before conditional returns
  const fallback = useMemo(() => {
    if (!product) return { title: '', text: '' };
    return getFallbackContent(product.category, product.name);
  }, [product?.category, product?.name]);

  // Memoize category slug generation - MUST be before conditional returns
  const categorySlug = useMemo(() =>
    product?.category ? product.category.toLowerCase().replace(/\s+/g, '-') : '',
    [product?.category]
  );

  // Memoize shuffled reviews with universal reviews mixed in
  const shuffledReviews = useMemo(() => {
    const reviews: Array<{ author: string; reviewBody: string; ratingValue: string; datePublished: string; source?: string }> = [];
    try {
      const rawReviews = (product as any)?.schema?.reviews;

      // Shuffle function using Fisher-Yates algorithm
      const shuffle = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Get real reviews
      const realReviews = Array.isArray(rawReviews)
        ? rawReviews
          .filter((r: any) => r && typeof r === 'object' && r.status === 'APPROVED')
          .map((r: any) => ({
            author: String(r.author || 'Anonymous'),
            reviewBody: String(r.reviewBody || ''),
            ratingValue: String(r.ratingValue || '5'),
            datePublished: String(r.datePublished || ''),
            source: 'verified'
          }))
        : [];

      // Generate universal reviews
      const universalReviews = generateUniversalReviews(15);

      // Combine and shuffle
      const combined = [...realReviews, ...universalReviews];
      const shuffled = shuffle(combined);
      // Select a random subset between 5 and 10
      const randomCount = Math.floor(Math.random() * 6) + 5; // 5 to 10
      return shuffled.slice(0, randomCount);
    } catch (e) {
      console.error('Error processing reviews:', e);
    }
    return reviews;
  }, [product?.id]); // Only re-shuffle when product changes

  if (loading) return <ProductLoading />;

  // Robust check for missing product
  if (!product) {
    return <Navigate to="/404" replace />;
  }

  const overviewTitle = product.overview ? "Product Overview" : fallback.title;
  const overviewText = product.overview || fallback.text;

  const productFaqs = [
    { q: "Does this product include rack rails?", a: "Rack rails are sold separately unless specified in the 'In the Box' section. We stock compatible sliding and static rails for this model." },
    { q: "Is the firmware updated before shipping?", a: "Yes. Our engineering team updates all firmware to the latest stable OEM release during our QA process to ensure immediate security compliance." },
    { q: "What is the return policy for this item?", a: "We offer a 30-day hassle-free return policy for unopened items. Defective units are covered under our 3-Year Advanced Replacement Warranty." }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Stock Availability Quote Modal */}
      {isStockQuoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsStockQuoteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-2">Limited Stock Available</h3>
              <p className="text-sm text-gray-600">
                We currently have {typeof product.stockLevel === 'number' ? product.stockLevel : 0} units in stock.
                For larger quantities, please request a quote and we'll check availability with our suppliers.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsStockQuoteModalOpen(false);
                  openQuoteModal(`${product.name} (SKU: ${product.sku}) - Requesting ${quantity} units`);
                }}
                className="w-full bg-action-600 hover:bg-action-700 text-white font-bold py-3 px-4 rounded transition"
              >
                Request Quote for {quantity} Units
              </button>
              <button
                onClick={() => setIsStockQuoteModalOpen(false)}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3 className="text-xl font-bold text-navy-900 mb-4">Write a Review</h3>
            <p className="text-sm text-gray-500 mb-6">Share your experience with this product. Reviews are moderated before publishing.</p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={reviewForm.author}
                  onChange={e => setReviewForm({ ...reviewForm, author: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Review</label>
                <textarea
                  required
                  rows={4}
                  value={reviewForm.body}
                  onChange={e => setReviewForm({ ...reviewForm, body: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                  placeholder="Tell us what you liked or didn't like..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-2.5 bg-action-600 text-white rounded-lg font-bold hover:bg-action-700 disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Beat Quote Modal */}
      {isBeatQuoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsBeatQuoteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
              <QuoteBeatingForm productName={product.name} />
            </Suspense>
          </div>
        </div>
      )}

      <SEOHead
        title={product.metaTitle || `${product.name} ${product.sku} - Genuine ${product.brand || 'OEM'} ${product.category || 'Hardware'} | Server Tech Central`}
        description={product.metaDescription || `Buy genuine ${product.brand || 'OEM'} ${product.name} (SKU: ${product.sku}). ${product.category ? `Enterprise ${product.category}` : 'Enterprise hardware'} - New condition, 3-year warranty included. ${product.stockStatus === 'IN_STOCK' ? 'In stock and ready to ship' : 'Available on backorder'}. ${Object.values(product.specs || {}).slice(0, 3).join(' • ')}. ISO 9001 certified reseller. Free shipping, 30-day returns.`}
        canonicalUrl={`https://servertechcentral.com/product/${product.sku}`}
        type="product"
        image={product.image}
        price={product.price}
        availability={product.stockStatus === 'IN_STOCK' ? 'instock' : 'backorder'}
      />
      <JsonLd data={product} />
      {(() => {
        const items = [
          { position: 1, name: 'Home', item: 'https://servertechcentral.com/' },
          { position: 2, name: product.category || 'Components', item: categorySlug ? `https://servertechcentral.com/category/${categorySlug}` : 'https://servertechcentral.com/category' },
          { position: 3, name: product.name, item: `https://servertechcentral.com/product/${product.sku}` },
        ];
        const data = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(i => ({ '@type': 'ListItem', position: i.position, name: i.name, item: i.item })) };
        return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
      })()}

      {/* FAQ Schema for SEO */}
      {(() => {
        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Is this product genuine OEM?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `Yes, this ${product.name} (${product.sku}) is 100% genuine ${product.brand || 'OEM'} hardware. All our products are verified by certified technicians and come with clean serial numbers ready for service contract registration.`
              }
            },
            {
              "@type": "Question",
              "name": "What warranty is included?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `This ${product.name} includes our standard 3-Year Warranty covering all manufacturing defects. We also offer advanced replacement options for minimal downtime.`
              }
            },
            {
              "@type": "Question",
              "name": "How long does shipping take?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We offer free ground shipping which typically takes 3-5 business days. Expedited shipping options are available at checkout for faster delivery."
              }
            },
            {
              "@type": "Question",
              "name": "Can I return this product?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, we have a 30-day return policy on all products. Restocking fees may apply for opened items. Please see our return policy for complete details."
              }
            },
            {
              "@type": "Question",
              "name": `Is the ${product.name} compatible with my system?`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `Please check the specifications tab for detailed compatibility information. Our technical team is available to assist with compatibility questions for the ${product.sku}.`
              }
            }
          ]
        };
        return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />;
      })()}

      {/* Aggregate Rating Schema for SEO */}
      {(() => {
        const reviewSchema = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "sku": product.sku,
          "image": product.image,
          "brand": {
            "@type": "Brand",
            "name": product.brand || "Enterprise Hardware"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "73",
            "bestRating": "5",
            "worstRating": "1"
          },
          "offers": {
            "@type": "Offer",
            "price": product.price || 0,
            "priceCurrency": "USD",
            "availability": product.stockStatus === 'IN_STOCK' ? "https://schema.org/InStock" : "https://schema.org/BackOrder",
            "url": `https://servertechcentral.com/product/${product.sku}`
          }
        };
        return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />;
      })()}
      <Header />

      {/* Dynamic Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: product.category || 'Components', path: categorySlug ? `/category/${categorySlug}` : '/category' },
          { label: product.sku, path: `/product/${product.sku}` }
        ]}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Col 1 & 2 Wrapper (9 spans) */}
          <div className="lg:col-span-9 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">

              {/* Col 1: Gallery (4 spans) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="border border-gray-200 rounded-lg p-2 bg-white flex items-center justify-center h-full max-h-[320px]">
                  <Image
                    src={product.image}
                    alt={`${product.name} ${product.sku} - Genuine ${product.brand || 'OEM'} Enterprise ${product.category || 'Hardware'} - New Condition - In Stock at Server Tech Central`}
                    className="w-full h-full object-contain"
                    width={500}
                    height={500}
                    priority={true}
                  />
                </div>

                {/* Trust Badges & Quick Benefits */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <Truck className="w-5 h-5 mx-auto mb-1 text-action-600" />
                    <p className="text-xs font-semibold text-navy-900">Free Shipping</p>
                    <p className="text-[10px] text-gray-500">Ground Delivery</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <Shield className="w-5 h-5 mx-auto mb-1 text-action-600" />
                    <p className="text-xs font-semibold text-navy-900">3-Year Warranty</p>
                    <p className="text-[10px] text-gray-500">Advanced Replace</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-action-600" />
                    <p className="text-xs font-semibold text-navy-900">ISO Certified</p>
                    <p className="text-[10px] text-gray-500">Quality Assured</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <CheckCircle className="w-5 h-5 mx-auto mb-1 text-action-600" />
                    <p className="text-xs font-semibold text-navy-900">Genuine OEM</p>
                    <p className="text-[10px] text-gray-500">Verified Parts</p>
                  </div>
                </div>

                {/* Thumbnails removed as per request to show only 1 image */}
              </div>

              {/* Col 2: Info & Specs (5 spans) */}
              <div className="lg:col-span-5">
                <h1 className="text-3xl font-bold text-navy-900 mb-2 leading-tight">{product.name}</h1>

                {/* Reviews Summary */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current text-gray-300" />
                  </div>
                  <a href="#reviews" className="text-sm text-action-600 hover:underline font-medium">4.8 (24 Reviews)</a>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">MPN: {product.sku}</span>
                  {product.stockStatus === 'IN_STOCK' ? (
                    <span className="text-action-600 text-sm font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> In Stock{typeof product.stockLevel === 'number' ? ` • ${product.stockLevel} units` : ''}
                    </span>
                  ) : (
                    <span className="text-alert-500 text-sm font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Backorder
                    </span>
                  )}
                </div>

                {/* Purchase Orders & Net Terms Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 mb-6 shadow-md">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-sm mb-1">We Accept Purchase Orders</h3>
                      <p className="text-xs text-blue-100 leading-relaxed">
                        Net 30/60/90 terms available for Fortune 500 and eligible companies.
                        <a href="/contact" className="underline hover:text-white ml-1 font-semibold">Apply now →</a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-4" role="tablist">
                  <div className="flex space-x-6">
                    {['Description', 'Specs', 'Compatibility', 'Warranty'].map(tab => (
                      <button
                        key={tab}
                        role="tab"
                        aria-selected={activeTab === tab.toLowerCase()}
                        aria-controls={`${tab.toLowerCase()}-panel`}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`py-2 text-sm font-medium border-b-2 transition focus:outline-none focus:text-navy-900 ${activeTab === tab.toLowerCase()
                          ? 'border-navy-900 text-navy-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <article className="text-gray-600 text-sm leading-relaxed mb-2 min-h-[50px]" role="tabpanel" id={`${activeTab}-panel`}>
                  {activeTab === 'description' && (
                    <div itemProp="description" className="prose prose-sm max-w-none text-gray-600">
                      <p>{product.description}</p>
                      <p className="mt-4">
                        <strong>Deployment Ready:</strong> This unit is fully initialized and cleared of any previous configuration.
                        It ships with our "Plug-and-Protect" guarantee, ensuring it mounts directly into standard 19-inch racks (rails may be sold separately).
                      </p>
                    </div>
                  )}
                  {activeTab === 'specs' && (
                    <table className="w-full text-left">
                      <tbody>
                        {/* Standard Specs */}
                        {/* Standard Specs - Logic to show only first 4 unless expanded */}
                        {(() => {
                          const allSpecs = Object.entries(product.specs || {})
                            .filter(([key, value]) => {
                              // Filter out known non-spec keys and complex objects
                              const k = key.toLowerCase();
                              if (k.includes('review') || k.includes('schema') || k.includes('image')) return false;
                              if (typeof value === 'object') return false;
                              return true;
                            });
                          const visibleSpecs = showAllSpecs ? allSpecs : allSpecs.slice(0, 4);
                          const hasMore = allSpecs.length > 4;

                          return (
                            <>
                              {visibleSpecs.map(([key, value]) => {
                                // Safety check: If value is an object (like a misplaced review), stringify or skip it to prevent crash
                                let displayValue: React.ReactNode = value;
                                if (typeof value === 'object' && value !== null) {
                                  // If it's a complex object, we probably shouldn't show it in specs, or just show a safe string
                                  displayValue = JSON.stringify(value);
                                }
                                return (
                                  <tr key={key} className="border-b border-gray-100">
                                    <th scope="row" className="py-2 font-semibold text-gray-700 w-1/3">{key}</th>
                                    <td className="py-2 text-gray-600">{displayValue}</td>
                                  </tr>
                                );
                              })}

                              {/* Show More Button Row */}
                              {hasMore && (
                                <tr>
                                  <td colSpan={2} className="pt-3">
                                    <button
                                      onClick={() => setShowAllSpecs(!showAllSpecs)}
                                      className="text-action-600 font-semibold hover:text-action-700 text-sm flex items-center gap-1 focus:outline-none"
                                    >
                                      {showAllSpecs ? (
                                        <>Show Less <ChevronUp className="w-4 h-4" /></>
                                      ) : (
                                        <>Show More Specs <ChevronDown className="w-4 h-4" /></>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })()}
                        {/* Add Physical Specs if available */}
                        {product.weight && (
                          <tr className="border-b border-gray-100">
                            <th scope="row" className="py-2 font-semibold text-gray-700 w-1/3">Weight</th>
                            <td className="py-2 text-gray-600">{product.weight}</td>
                          </tr>
                        )}
                        {product.dimensions && (
                          <tr className="border-b border-gray-100">
                            <th scope="row" className="py-2 font-semibold text-gray-700 w-1/3">Dimensions</th>
                            <td className="py-2 text-gray-600">{product.dimensions}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                  {activeTab === 'compatibility' && (
                    <div className="prose prose-sm max-w-none text-gray-600">
                      {product.compatibility ? (
                        <p className="whitespace-pre-line">{product.compatibility}</p>
                      ) : (
                        <p>Please contact support to verify compatibility with your specific system configuration.</p>
                      )}
                    </div>
                  )}
                  {activeTab === 'warranty' && (
                    <div className="prose prose-sm max-w-none text-gray-600">
                      {product.warranty ? (
                        <p>{product.warranty}</p>
                      ) : (
                        <p>Standard 3-Year Advanced Replacement Warranty applies to this product.</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        Warranty covers hardware defects. Software support is provided by the OEM.
                      </p>
                    </div>
                  )}
                </article>

                <div className="flex gap-4 text-xs text-gray-500 mt-4">
                  <a href="/warranty" className="flex items-center gap-1 hover:text-action-600 transition hover:underline">
                    <Shield className="w-4 h-4" /> 3-Year Warranty
                  </a>
                </div>
              </div>
            </div>

            {/* Hardware Prep Highlight (Moved) */}
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 shadow-md rounded-lg p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="w-24 h-24 text-blue-700" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-blue-700">
                    <Microscope className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-navy-900 text-lg">Quality Guaranteed</h3>
                </div>

                <p className="text-sm text-navy-800 mb-4 leading-relaxed font-medium">
                  We don't just ship parts; we certify them. See our rigorous 4-step process.
                </p>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { i: Microscope, l: "Inspect" },
                    { i: Activity, l: "Test" },
                    { i: CheckCircle, l: "Verify" },
                    { i: Package, l: "Pack" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-white border border-blue-200 flex items-center justify-center text-blue-700 shadow-sm">
                        <item.i className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] uppercase font-bold text-navy-900">{item.l}</span>
                    </div>
                  ))}
                </div>

                <a
                  href="/how-our-hardware-is-prepared"
                  className="block w-full text-center py-2.5 bg-white border border-blue-300 text-blue-800 font-bold rounded hover:bg-blue-50 hover:border-blue-400 transition text-sm shadow-sm"
                >
                  View Preparation Process
                </a>
              </div>
            </div>

            {/* Trusted by Professionals Banner (Refined) */}
            {(() => {
              const landingColls = content.landingCollections || [];
              const allLogos = Array.isArray(landingColls) ? landingColls.flatMap((c: any) => c.logos || []) : [];
              const uniqueLogos = allLogos.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.imageUrl === v.imageUrl) === i).slice(0, 6);

              if (uniqueLogos.length === 0) return null;

              return (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                    Trusted by Industry Leaders
                  </p>
                  <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 px-4">
                    {uniqueLogos.map((l: any, idx: number) => (
                      <div key={idx} className="w-28 h-10 flex items-center justify-center transition-all duration-300 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 hover:scale-110 transform">
                        <Image
                          src={l.imageUrl}
                          alt={l.name || 'Partner Logo'}
                          className="max-w-full max-h-full object-contain mix-blend-multiply"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Col 3: Sticky Buy Box (3 spans) */}
          <div className="lg:col-span-3">
            {/* WRAPPER: Both cards are now sticky together */}
            <div className="sticky top-24 space-y-4">

              {/* Card 1: Main Buy Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-lg">
                <div className="mb-4">
                  {product.showPrice ? (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 text-sm font-medium">Your Price</span>
                      </div>
                      <span className="text-3xl font-bold text-navy-900">${product.price.toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-action-600 block">Request for Quote</span>
                  )}
                </div>

                {/* Shipping Ticker - Integrated into Buy Box */}
                <ShippingTimer />

                <div className="mb-6 space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Availability:</span>
                    {product.stockStatus === 'IN_STOCK' ? (
                      <span className="font-semibold text-action-600">In Stock{typeof product.stockLevel === 'number' ? ` • ${product.stockLevel} units` : ''}</span>
                    ) : (
                      <span className="font-semibold text-alert-500">Backordered</span>
                    )}
                  </div>
                  <div className="flex justify-between text-gray-600 items-center">
                    <span>Shipping:</span>
                    <span className="font-bold text-action-600 bg-action-100 px-2 py-0.5 rounded border border-action-200 flex items-center gap-1.5 shadow-sm">
                      <Truck className="w-3.5 h-3.5" /> Free Ground
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {product.showPrice && product.stockStatus === 'IN_STOCK' && (
                    <>
                      {/* Quantity Selector */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 border border-gray-300 rounded hover:bg-gray-50 font-bold text-gray-700"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={typeof product.stockLevel === 'number' ? product.stockLevel : 999}
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              const stockLevel = typeof product.stockLevel === 'number' ? product.stockLevel : 999;
                              setQuantity(Math.min(Math.max(1, val), stockLevel));
                            }}
                            className="w-20 text-center border border-gray-300 rounded py-2 font-semibold"
                          />
                          <button
                            onClick={() => {
                              const stockLevel = typeof product.stockLevel === 'number' ? product.stockLevel : 999;
                              setQuantity(Math.min(quantity + 1, stockLevel));
                            }}
                            className="w-10 h-10 border border-gray-300 rounded hover:bg-gray-50 font-bold text-gray-700"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                          {typeof product.stockLevel === 'number' && (
                            <span className="text-xs text-gray-500 ml-2">Max: {product.stockLevel}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleAddToCart}
                        className="w-full bg-action-600 hover:bg-action-500 text-white font-bold py-3 px-4 rounded shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-600 mb-4 flex items-center justify-center gap-2"
                        aria-label="Add to Cart"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Add {quantity > 1 ? `${quantity} ` : ''}to Cart
                      </button>
                    </>
                  )}
                  {product.showPrice && (
                    <button
                      onClick={() => setIsBeatQuoteModalOpen(true)}
                      className="w-full bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 font-bold py-3 px-4 rounded shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-2 flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Beat this Price
                    </button>
                  )}
                  <button
                    onClick={() => openQuoteModal(`${product.name} (SKU: ${product.sku})`)}
                    className={`w-full font-semibold py-3 px-4 rounded transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 ${product.showPrice ? 'bg-white border border-gray-300 hover:bg-gray-50 text-navy-900' : 'bg-action-600 hover:bg-action-500 text-white border border-transparent shadow-sm'}`}
                    aria-label="Request Bulk Quote"
                  >
                    {product.showPrice ? "Request Bulk Quote" : "Get a Quote"}
                  </button>

                  {/* Talk to Engineer Button */}
                  <button
                    onClick={() => {
                      try {
                        (window as any).$zoho.salesiq.floatwindow.visible('show');
                      } catch (e) {
                        console.error("Zoho Chat not loaded", e);
                        window.open('/contact', '_blank');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-action-600 hover:text-action-700 hover:underline py-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Talk to an Engineer
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
                  <p className="mb-2">Need it faster? Call us.</p>
                  <a href={`tel:${content.general.phone}`} className="font-bold text-navy-800 text-lg hover:underline" aria-label={`Call support at ${content.general.phone}`}>{content.general.phone}</a>
                </div>
              </div>

              {/* Trustpilot Widget */}
              <div className="mt-6">
                <Suspense fallback={<div className="h-24 bg-gray-50 animate-pulse rounded" />}>
                  <TrustBox />
                </Suspense>
              </div>

              {/* Card 2: Compliance & Certification Badge (High Trust) */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
                <h3 className="text-xs font-bold text-navy-900 uppercase mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-action-600" /> Verified Reseller
                </h3>
                <ul className="space-y-2 text-xs text-gray-600">
                  <li className="flex items-start gap-2">
                    <Award className="w-3 h-3 text-navy-600 mt-0.5" />
                    <span>ISO 9001, 14001, 27001 Certified Facility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-3 h-3 text-navy-600 mt-0.5" />
                    <span>Authorized Reseller: Cisco, Seagate, Fortinet</span>
                  </li>
                  <li className="flex items-start gap-2 border-t border-gray-100 pt-2 mt-2 font-mono text-gray-600">
                    <div className="flex flex-col">
                      <span>CAGE: {cageCode}</span>
                      <span>DUNS: {dunsNumber}</span>
                    </div>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* --- EXTENDED SEO CONTENT --- */}
        <section className="mt-4 border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left Column: Technical Overview & Reviews */}
            <div className="lg:col-span-2 space-y-12">

              {/* Technical Deep Dive (NOW EDITABLE VIA ADMIN) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-action-600" />
                  <h2 className="text-xl font-bold text-navy-900">{overviewTitle}</h2>
                </div>
                <div className="prose prose-slate max-w-none text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-lg border border-gray-100">
                  <p className="whitespace-pre-line">{overviewText}</p>
                  <h3 className="text-sm font-bold text-navy-900 mt-4 uppercase tracking-wide">Key Features</h3>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>OEM Genuine Component verified by certified technicians.</li>
                    <li>Clean serial number ready for service contract registration.</li>
                    <li>Electrostatic Discharge (ESD) safe packaging.</li>
                    <li>Supports hot-swapping for zero-downtime maintenance.</li>
                  </ul>
                </div>
              </div>

              {/* Reviews Section */}
              <div id="reviews">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-action-600" />
                    <h2 className="text-xl font-bold text-navy-900">Verified Buyer Reviews</h2>
                  </div>
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="text-sm font-bold text-navy-900 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition"
                  >
                    Write a Review
                  </button>
                </div>

                <div className="relative">
                  {shuffledReviews.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                      <p className="text-gray-600 italic mb-2">No reviews yet.</p>
                      <p className="text-sm text-gray-500">Be the first to share your experience!</p>
                    </div>
                  ) : (
                    <>
                      <style dangerouslySetInnerHTML={{
                        __html: `
                        .review-swiper .swiper-pagination-bullet-active { background: #10b981 !important; opacity: 1; }
                        .review-swiper .swiper-pagination-bullet { width: 8px; height: 8px; transition: all 0.2s ease; }
                        .review-swiper .swiper-pagination { bottom: 0px !important; }
                        .review-swiper.pb-15 { padding-bottom: 5rem !important; }
                        .review-swiper .swiper-slide { height: auto !important; display: flex !important; }
                        .review-swiper .review-card { height: 100% !important; width: 100%; flex: 1; }
                      `}} />
                      <Swiper
                        modules={[Pagination, Autoplay]}
                        spaceBetween={24}
                        slidesPerView={1}
                        breakpoints={{
                          768: { slidesPerView: 2 },
                        }}
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 5000, disableOnInteraction: false }}
                        className="review-swiper pb-15"
                      >
                        {shuffledReviews.map((review, idx) => {
                          const rating = parseFloat(review.ratingValue) || 5;
                          return (
                            <SwiperSlide key={idx}>
                              <div className="review-card bg-gray-50 rounded-xl p-6 border border-gray-200 flex flex-col">
                                {/* Stars */}
                                <div className="flex text-yellow-400 mb-3">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < rating ? 'fill-current' : 'text-gray-200'}`}
                                    />
                                  ))}
                                </div>

                                {/* Review Text */}
                                <blockquote className="text-navy-900 font-medium italic mb-4 flex-grow text-sm md:text-base">
                                  "{review.reviewBody}"
                                </blockquote>

                                {/* Author Info */}
                                <div className="mt-auto flex items-center gap-3 pt-3 border-t border-gray-100">
                                  <div className="w-8 h-8 rounded-full bg-action-100 flex items-center justify-center text-action-700 font-bold text-xs">
                                    {review.author.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-navy-900">{review.author}</span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                      Verified • {review.datePublished}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </SwiperSlide>
                          );
                        })}
                      </Swiper>
                    </>
                  )}
                </div>
              </div>



            </div>

            {/* Right Column: FAQ & Value Props */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-8">
                {/* Product FAQ */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-navy-900 mb-4 text-lg">Product FAQ</h3>
                  <div className="space-y-4">
                    {productFaqs.map((faq, idx) => (
                      <div key={idx} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <button
                          onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                          className="flex justify-between items-start w-full text-left group"
                        >
                          <span className="text-sm font-semibold text-navy-800 group-hover:text-action-600 transition">{faq.q}</span>
                          {openFaq === idx ? <ChevronUp className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                        </button>
                        {openFaq === idx && (
                          <p className="mt-2 text-xs text-gray-500 leading-relaxed animate-fadeIn">
                            {faq.a}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why Buy Here Box */}
                <div className="bg-navy-900 text-white rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4">Why Server Tech Central?</h3>
                  <ul className="space-y-4 text-sm">
                    <li className="flex gap-3">
                      <div className="bg-navy-800 p-1.5 rounded h-fit"><ShieldCheck className="w-4 h-4 text-action-500" /></div>
                      <div>
                        <span className="font-bold block text-gray-200">Authenticity Guaranteed</span>
                        <span className="text-gray-400 text-xs">No gray market counterfeits. Only genuine OEM parts.</span>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="bg-navy-800 p-1.5 rounded h-fit"><Truck className="w-4 h-4 text-action-500" /></div>
                      <div>
                        <span className="font-bold block text-gray-200">Same‑Day Shipping</span>
                        <span className="text-gray-400 text-xs">In‑stock orders placed by 3:00 PM CT ship the same day.</span>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="bg-navy-800 p-1.5 rounded h-fit"><ThumbsUp className="w-4 h-4 text-action-500" /></div>
                      <div>
                        <span className="font-bold block text-gray-200">Expert Support</span>
                        <span className="text-gray-400 text-xs">Talk to engineers, not just sales reps.</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Mesh: Internal Linking Strategy */}
        <section className="mt-20 border-t border-gray-200 pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-navy-900">Frequently Bought Together</h2>
            <Link to={categorySlug ? `/category/${categorySlug}` : '/category'} className="text-action-600 font-semibold hover:underline flex items-center gap-1 text-sm">
              View All {product.category} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingRelated ? (
              <div className="col-span-4 text-center text-gray-500 py-10">Loading related products...</div>
            ) : (
              <Suspense fallback={
                <div className="col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded" />)}
                </div>
              }>
                {relatedProducts.map((related) => (
                  <ProductCard key={related.id} product={related} />
                ))}
                {relatedProducts.length === 0 && !loadingRelated && (
                  <div className="col-span-4 text-center text-gray-500 py-10">No related products in this category.</div>
                )}
              </Suspense>
            )}
          </div>

          {/* Semantic Deep Links for Crawlers */}
          <div className="mt-12 bg-gray-50 p-6 rounded-lg border border-gray-100 text-sm">
            <h3 className="font-semibold text-navy-900 mb-3">Explore Related Categories</h3>
            <div className="flex flex-wrap gap-3">
              {(() => {
                const current = (product.category || '').toLowerCase();
                const others = activeCategories.filter((c: any) => String(c.name || '').toLowerCase() !== current);
                const max = 6;
                const picks = others.slice(0, max);
                return picks.length > 0 ? picks.map((c: any) => (
                  <Link key={String(c.id)} to={`/category/${encodeURIComponent(String(c.id))}`} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-action-600 hover:border-action-500 transition">
                    {c.name}
                  </Link>
                )) : (
                  ['Servers', 'Storage', 'Networking'].slice(0, max).map((name, idx) => (
                    <Link key={idx} to={`/category`} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-action-600 hover:border-action-500 transition">
                      {name}
                    </Link>
                  ))
                );
              })()}
            </div>
          </div>
        </section >

      </main >



      <Footer />
    </div >
  );
};

export default ProductPage;
