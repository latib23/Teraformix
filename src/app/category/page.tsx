
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import Breadcrumbs from '../../components/Breadcrumbs';
import CategoryKnowledgeBase from '../../components/CategoryKnowledgeBase';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { Product } from '../../types';
import { ShieldCheck, Award } from 'lucide-react';
import SEOHead from '../../components/SEO/SEOHead';
import { fetchJson } from '../../lib/api';

const getCategoryMetadata = (query: string, content: any) => {
  const normalized = (query || '').toLowerCase().trim();

  // 1. Specific Category (Dynamic from Context)
  // Match by ID or Name
  const category = content.categories.find((c: any) =>
    c.id.toLowerCase() === normalized || c.name.toLowerCase() === normalized
  );

  if (category) {
    return {
      title: category.seoTitle || `${category.name} | Teraformix`,
      description: category.seoDescription || category.description,
      h1: category.seoH1 || category.name,
      text: category.seoText || category.description,
      isSpecific: true
    };
  }

  // 2. Search Results (if query exists but no category matched)
  if (query && !category) {
    return {
      title: `Search Results for "${query}" | Teraformix`,
      description: `Browse results for ${query}. Find enterprise hardware including servers, storage, and networking equipment at Teraformix.`,
      h1: `Search Results for "${query}"`,
      text: "",
      isSpecific: false
    };
  }

  // 3. Root Category Page (Default)
  return {
    title: content.categoryPage?.title || "Enterprise Servers & Storage Solutions | Teraformix",
    description: content.categoryPage?.description || "Browse our catalog of over 500,000 enterprise servers...",
    h1: content.categoryPage?.h1 || "Enterprise Servers & Storage Solutions",
    text: content.categoryPage?.introText || "Browse our extensive catalog of new and refurbished enterprise hardware...",
    isSpecific: true
  };
};

const CategoryPage = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [allItems, setAllItems] = useState<Product[]>([]); // For extracting filter options
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'featured' | 'price_asc' | 'price_desc'>('featured');

  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCapacities, setSelectedCapacities] = useState<string[]>([]);

  // Filter expansion states
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllCapacities, setShowAllCapacities] = useState(false);

  const { content } = useGlobalContent();
  const { cageCode, dunsNumber } = content.general;
  const [searchParams] = useSearchParams();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);

  // Determine effective query: Param slug takes precedence, then query string
  const searchQuery = slug || searchParams.get('search') || '';

  // SCROLL TO TOP ON NAVIGATION CHANGE
  useEffect(() => {
    window.scrollTo(0, 0);
    // Reset filters when category changes
    setSelectedBrands([]);
    setSelectedCapacities([]);
    setPage(1);
  }, [searchQuery]);

  // SCROLL TO TOP ON PAGE CHANGE (pagination)
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
    }
  }, [page]);

  const metadata = getCategoryMetadata(searchQuery, content);

  // Get current category
  const currentCategory = useMemo(() => {
    return content.categories.find((c: any) =>
      c.id.toLowerCase() === searchQuery.toLowerCase() ||
      c.name.toLowerCase() === searchQuery.toLowerCase()
    );
  }, [content.categories, searchQuery]);

  // Determine if current category is storage-related
  const isStorageCategory = useMemo(() => {
    if (!currentCategory) return false;
    const name = currentCategory.name.toLowerCase();
    return name.includes('storage') || name.includes('drive') || name.includes('disk');
  }, [currentCategory]);

  // Fetch ALL items for the category to extract filter options
  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        const cat = content.categories.find((c: any) => c.id.toLowerCase() === searchQuery.toLowerCase() || c.name.toLowerCase() === searchQuery.toLowerCase());
        const params = new URLSearchParams();
        params.set('limit', '1000'); // Get all items to extract filters
        params.set('offset', '0');
        if (cat) params.set('category', cat.name);
        else if (searchQuery) params.set('q', searchQuery);
        const res = await fetchJson<{ items: Product[]; total: number }>(`/products/paginated?${params.toString()}`);
        setAllItems((res?.items || []) as Product[]);
      } catch {
        setAllItems([]);
      }
    };
    fetchAllItems();
  }, [searchQuery, content.categories]);

  // Extract unique brands from products
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    allItems.forEach(item => {
      if (item.brand && typeof item.brand === 'string') {
        brands.add(item.brand.trim());
      }
    });
    return Array.from(brands).sort();
  }, [allItems]);

  // Extract unique capacities based on category
  const availableCapacities = useMemo(() => {
    const capacities = new Set<string>();
    allItems.forEach(item => {
      const attrs = (item as any).attributes || {};

      // For storage: look for capacity in TB
      if (isStorageCategory) {
        if (attrs.Capacity || attrs.capacity) {
          capacities.add(String(attrs.Capacity || attrs.capacity));
        }
      } else {
        // For other categories: look for RAM, Storage, etc.
        if (attrs.RAM || attrs.ram || attrs.Memory || attrs.memory) {
          capacities.add(String(attrs.RAM || attrs.ram || attrs.Memory || attrs.memory));
        }
        if (attrs.Storage || attrs.storage) {
          capacities.add(String(attrs.Storage || attrs.storage));
        }
      }
    });
    return Array.from(capacities).sort();
  }, [allItems, isStorageCategory]);

  // Apply filters to items
  const filteredItems = useMemo(() => {
    let filtered = [...allItems];

    // Filter by brand
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(item =>
        selectedBrands.includes(item.brand || '')
      );
    }

    // Filter by capacity
    if (selectedCapacities.length > 0) {
      filtered = filtered.filter(item => {
        const attrs = (item as any).attributes || {};
        const itemCapacity = String(attrs.Capacity || attrs.capacity || attrs.RAM || attrs.ram || attrs.Memory || attrs.memory || attrs.Storage || attrs.storage || '');
        return selectedCapacities.some(cap => itemCapacity.includes(cap) || cap.includes(itemCapacity));
      });
    }

    return filtered;
  }, [allItems, selectedBrands, selectedCapacities]);

  const productList = useMemo(() => items, [items]);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        // If we have filters, use local filtering
        if (selectedBrands.length > 0 || selectedCapacities.length > 0) {
          const sorted = [...filteredItems];
          if (sort === 'price_asc') {
            sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
          } else if (sort === 'price_desc') {
            sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
          }
          const start = (page - 1) * PAGE_SIZE;
          const end = start + PAGE_SIZE;
          setItems(sorted.slice(start, end) as Product[]);
          setTotal(sorted.length);
        } else {
          // No filters, fetch from API
          const cat = content.categories.find((c: any) => c.id.toLowerCase() === searchQuery.toLowerCase() || c.name.toLowerCase() === searchQuery.toLowerCase());
          const params = new URLSearchParams();
          params.set('limit', String(PAGE_SIZE));
          params.set('offset', String((page - 1) * PAGE_SIZE));
          params.set('sort', sort);
          if (cat) params.set('category', cat.name);
          else if (searchQuery) params.set('q', searchQuery);
          const res = await fetchJson<{ items: Product[]; total: number }>(`/products/paginated?${params.toString()}`);
          setItems((res?.items || []) as Product[]);
          setTotal(Number(res?.total || 0));
        }
      } catch {
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [searchQuery, page, sort, content.categories, selectedBrands, selectedCapacities, filteredItems]);

  useEffect(() => {
    if (!items || items.length === 0) return;
    try {
      const g = (window as any).gtag;
      if (typeof g === 'function') {
        g('event', 'view_item_list', {
          items: items.slice(0, 9).map(p => ({
            item_id: p.sku,
            item_name: p.name,
            price: p.price,
            item_category: p.category
          }))
        });
      }
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
        event: 'view_item_list',
        items: items.slice(0, 9).map(p => ({
          item_id: p.sku,
          item_name: p.name,
          price: p.price,
          item_category: p.category
        }))
      });
    } catch { }
  }, [items]);

  useEffect(() => {
    if (!searchQuery || metadata.isSpecific || items.length === 0) return;
    try {
      const payload = {
        search_term: searchQuery,
        items: items.slice(0, 9).map(p => ({
          item_id: p.sku,
          item_name: p.name,
          price: p.price,
          item_category: p.category
        }))
      };
      const g = (window as any).gtag;
      if (typeof g === 'function') {
        g('event', 'view_search_results', payload as any);
      }
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: 'view_search_results', ...payload });
    } catch { }
  }, [items, searchQuery, metadata.isSpecific]);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/category/${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEOHead
        title={metadata.title}
        description={metadata.description}
        canonicalUrl={`https://teraformix.com/category/${slug || ''}`}
      />
      <Header />
      <Breadcrumbs items={[{ label: searchQuery || 'Enterprise Hardware', path: slug ? `/category/${slug}` : `/category?search=${searchQuery}` }]} />
      <div ref={topRef} />

      {/* Top SEO Content Block */}
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="container mx-auto px-4 max-w-12xl">
          <h2 className="text-2xl font-bold text-navy-900">
            {metadata.h1}
          </h2>

          {metadata.text && (
            <p className="text-gray-500 mt-1 max-w-3xl whitespace-pre-line">
              {metadata.text}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-grow max-w-12xl">

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            {/* Trusted Reseller Badge */}
            <div className="bg-navy-900 rounded-lg p-4 mb-6 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-action-500" />
                <span className="font-bold text-sm">Verified Reseller</span>
              </div>
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <Award className="w-3 h-3 text-action-500" />
                  <span>ISO 9001/14001/27001</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-3 h-3 text-action-500" />
                  <span>Auth. Cisco & Seagate</span>
                </div>
                <div className="pt-2 border-t border-navy-700 font-mono text-[10px] text-gray-500">
                  CAGE: {cageCode} | DUNS: {dunsNumber}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm sticky top-24">
              <h3 className="font-bold text-navy-900 mb-4">Filters</h3>

              <div className="space-y-6">

                {/* Dynamic Categories Filter */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Category</h4>
                  <div className="space-y-2">
                    {content.categories
                      .filter(c => c.isActive)
                      .slice(0, showAllCategories ? undefined : 4)
                      .map(cat => (
                        <label key={cat.id} className="flex items-center group cursor-pointer">
                          <input
                            type="radio"
                            name="category_filter"
                            checked={searchQuery.toLowerCase() === cat.id.toLowerCase() || searchQuery.toLowerCase() === cat.name.toLowerCase()}
                            onChange={() => handleCategoryClick(cat.id)}
                            className="rounded-full border-gray-300 text-action-600 focus:ring-action-500 cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-600 group-hover:text-navy-900">{cat.name}</span>
                        </label>
                      ))}
                    <label className="flex items-center group cursor-pointer">
                      <input
                        type="radio"
                        name="category_filter"
                        checked={searchQuery === ''}
                        onChange={() => navigate('/category')}
                        className="rounded-full border-gray-300 text-action-600 focus:ring-action-500 cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-600 group-hover:text-navy-900">All Products</span>
                    </label>
                    {content.categories.filter(c => c.isActive).length > 4 && (
                      <button
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className="text-xs text-action-600 hover:text-action-700 font-semibold mt-1"
                      >
                        {showAllCategories ? '− Show Less' : '+ Show More'}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Brand</h4>
                  <div className="space-y-2">
                    {availableBrands.length > 0 ? (
                      <>
                        {availableBrands
                          .slice(0, showAllBrands ? undefined : 4)
                          .map(brand => (
                            <label key={brand} className="flex items-center group cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedBrands.includes(brand)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBrands([...selectedBrands, brand]);
                                  } else {
                                    setSelectedBrands(selectedBrands.filter(b => b !== brand));
                                  }
                                  setPage(1); // Reset to first page
                                }}
                                className="rounded border-gray-300 text-action-600 focus:ring-action-500 cursor-pointer"
                              />
                              <span className="ml-2 text-sm text-gray-600 group-hover:text-navy-900">{brand}</span>
                            </label>
                          ))}
                        {availableBrands.length > 4 && (
                          <button
                            onClick={() => setShowAllBrands(!showAllBrands)}
                            className="text-xs text-action-600 hover:text-action-700 font-semibold mt-1"
                          >
                            {showAllBrands ? '− Show Less' : '+ Show More'}
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">No brands available</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    {isStorageCategory ? 'Capacity' : 'Specifications'}
                  </h4>
                  <div className="space-y-2">
                    {availableCapacities.length > 0 ? (
                      <>
                        {availableCapacities
                          .slice(0, showAllCapacities ? undefined : 4)
                          .map(capacity => (
                            <label key={capacity} className="flex items-center group cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedCapacities.includes(capacity)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCapacities([...selectedCapacities, capacity]);
                                  } else {
                                    setSelectedCapacities(selectedCapacities.filter(c => c !== capacity));
                                  }
                                  setPage(1); // Reset to first page
                                }}
                                className="rounded border-gray-300 text-action-600 focus:ring-action-500 cursor-pointer"
                              />
                              <span className="ml-2 text-sm text-gray-600 group-hover:text-navy-900">{capacity}</span>
                            </label>
                          ))}
                        {availableCapacities.length > 4 && (
                          <button
                            onClick={() => setShowAllCapacities(!showAllCapacities)}
                            className="text-xs text-action-600 hover:text-action-700 font-semibold mt-1"
                          >
                            {showAllCapacities ? '− Show Less' : '+ Show More'}
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">No {isStorageCategory ? 'capacities' : 'specifications'} available</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedBrands([]);
                  setSelectedCapacities([]);
                  setPage(1);
                  navigate('/category');
                }}
                className="w-full mt-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded transition"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-gray-500 font-medium">Showing {productList.length} of {total} Results</span>
              <select value={sort} onChange={(e) => { const v = e.target.value as any; setSort(v); setPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="border-gray-300 rounded text-sm py-1.5 pl-3 pr-8 bg-white text-navy-900 focus:ring-navy-900 focus:border-navy-900 shadow-sm cursor-pointer">
                <option value="featured">Sort by: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productList.length > 0 ? (
                  productList.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-20 text-gray-500 bg-white rounded-lg border border-gray-200">
                    <p className="text-lg font-medium">No products found matching "{searchQuery}"</p>
                    <p className="text-sm mt-2">Try checking your spelling or using a different keyword.</p>
                  </div>
                )}
              </div>
            )}

            {total > PAGE_SIZE && (
              <div className="mt-12 flex justify-center">
                <nav className="flex gap-2">
                  <button onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={page === 1} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Previous</button>
                  <span className="px-4 py-2 bg-navy-900 text-white rounded text-sm font-medium">Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
                  <button onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={page >= Math.ceil(total / PAGE_SIZE)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Next</button>
                </nav>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Knowledge Base Section */}
      <CategoryKnowledgeBase />

      <Footer />
    </div>
  );
};

export default CategoryPage;
