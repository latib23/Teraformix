
import React, { useState, useEffect } from 'react';
import { useProductData } from '../../hooks/useProductData';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { useUI } from '../../contexts/UIContext';
import { Product, Category } from '../../types';
import { api } from '../../lib/api';
import { compressImage } from '../../lib/imageUtils';
import { Edit, Trash2, Plus, AlertCircle, X, Save, Loader2, Sparkles, Upload, Download, Search, FileText, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

type ProductForm = Partial<Product> & { tags: string[]; showPrice: boolean };

const ProductManager = () => {
  const { data, loading: initialLoading, error, refresh } = useProductData();
  const { content, updateContent } = useGlobalContent();
  const { showToast } = useUI();

  const categories = content.categories || [];
  const defaultCategory = categories.length > 0 ? categories[0].name : 'Servers';

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkEditData, setBulkEditData] = useState<{ showPrice?: string; stockStatus?: string; category?: string }>({
    showPrice: 'no_change',
    stockStatus: 'no_change',
    category: 'no_change'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'technical' | 'seo' | 'redirect' | 'reviews'>('basic');
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPriceFilter, setShowPriceFilter] = useState('all');
  const [imageFilter, setImageFilter] = useState('all'); // all, with_image, no_image
  const [priceFilter, setPriceFilter] = useState('all'); // all, with_price, no_price

  const slugifyCategoryId = (name: string) => name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const ensureCategoriesForBulk = async (entries: Array<{ category?: string }>) => {
    const existing = (content.categories || []) as Category[];
    const existingNames = new Set(existing.map(c => (c.name || '').toLowerCase().trim()));
    const toCreateNames = new Set<string>();
    for (const e of entries) {
      const raw = (e.category || '').toString().trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (!existingNames.has(key)) toCreateNames.add(raw);
    }
    if (toCreateNames.size === 0) return;
    const newCats: Category[] = Array.from(toCreateNames).map(name => ({
      id: slugifyCategoryId(name),
      name,
      description: `Products in ${name}`,
      image: '',
      isActive: true,
      seoTitle: '',
      seoDescription: '',
      seoH1: '',
      seoText: '',
      redirectTo: '',
      redirectPermanent: false
    }));
    const updated = [...existing, ...newCats];
    await updateContent({ categories: updated });
  };

  const initialFormState: ProductForm = {
    name: '', sku: '', category: defaultCategory, brand: '', price: 0, stockStatus: 'IN_STOCK', stockLevel: 0, image: '', description: '',
    weight: '', dimensions: '', compatibility: '', warranty: '', overview: '', datasheet: '', specs: {}, schema: {}, metaTitle: '', metaDescription: '',
    // @ts-ignore
    seoH1: '',
    // @ts-ignore
    seoText: '',
    tags: [], redirectTo: '', redirectPermanent: true, showPrice: false
  };
  const [formData, setFormData] = useState<ProductForm>(initialFormState);

  const getGeminiApiKey = () => {
    // Prefer environment variable first (Vite)
    // @ts-ignore
    const envKey = import.meta.env?.VITE_GEMINI_API_KEY as string | undefined;
    if (envKey) return envKey;
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('tfx_gemini_api_key');
        if (local) return local;
      } catch { }
    }
    return process.env.VITE_GEMINI_API_KEY || '';
  };

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setProducts(data);
    }
  }, [data]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, showPriceFilter, imageFilter, priceFilter]);

  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase().trim();
    const categoryMatch = selectedCategory === 'all' || p.category === selectedCategory;
    const priceVisibilityMatch = showPriceFilter === 'all' || (showPriceFilter === 'show' ? p.showPrice : !p.showPrice);

    // Image filter: check if product has an image
    const imageMatch = imageFilter === 'all' ||
      (imageFilter === 'with_image' ? (p.image && p.image.trim() !== '') :
        (!p.image || p.image.trim() === ''));

    // Price filter: check if product has a valid price (> 0)
    const priceMatch = priceFilter === 'all' ||
      (priceFilter === 'with_price' ? (p.price && p.price > 0) :
        (!p.price || p.price <= 0));

    if (!q) return categoryMatch && priceVisibilityMatch && imageMatch && priceMatch;
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    ) && categoryMatch && priceVisibilityMatch && imageMatch && priceMatch;
  });

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedProductIds(newSet);
  };

  const toggleAll = () => {
    if (selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleBulkEditSubmit = async () => {
    if (selectedProductIds.size === 0) return;
    setIsSaving(true);
    try {
      const updates: any = {};
      if (bulkEditData.showPrice !== 'no_change') updates.showPrice = bulkEditData.showPrice === 'true';
      if (bulkEditData.stockStatus !== 'no_change') updates.stockStatus = bulkEditData.stockStatus;
      if (bulkEditData.category !== 'no_change') updates.category = bulkEditData.category;

      if (Object.keys(updates).length === 0) {
        setIsBulkEditModalOpen(false);
        setIsSaving(false);
        return;
      }

      await Promise.all(Array.from(selectedProductIds).map(id => api.patch(`/products/${id}`, updates)));
      showToast(`Updated ${selectedProductIds.size} products successfully.`, "success");
      await refresh();
      setIsBulkEditModalOpen(false);
      setSelectedProductIds(new Set());
      setBulkEditData({ showPrice: 'no_change', stockStatus: 'no_change', category: 'no_change' });
    } catch (err) {
      showToast(`Bulk update failed: ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 800, 0.8);
        setFormData(prev => ({ ...prev, image: base64 }));
      } catch (error) {
        showToast("Failed to process image.", "error");
      }
    }
  };

  const handleAiFetchSpecs = async () => {
    if (!formData.sku) {
      showToast("Please enter a SKU/Part Number first.", "error");
      return;
    }
    setIsAiLoading(true);
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        showToast("Missing Gemini API key. Set VITE_GEMINI_API_KEY or local storage.", "error");
        return;
      }
      const prompt = `Return ONLY JSON. For hardware part "${formData.sku}", provide details in JSON with keys: specs{}, weight, dimensions, compatibility, warranty, overview, datasheet`;
      const genAI = new GoogleGenAI({ apiKey });
      const models = ['models/gemini-1.5-flash-001'];
      let text = '';
      for (const m of models) {
        try {
          const res = await genAI.models.generateContent({ model: m, contents: prompt, config: { responseMimeType: 'application/json' } });
          text = ((res as any)?.text) || '';
          if (text) break;
        } catch { }
      }
      if (!text) throw new Error('No response from Gemini models');
      const fetchedData = JSON.parse(text || "{}");
      setFormData(prev => ({ ...prev, ...fetchedData, specs: { ...prev.specs, ...fetchedData.specs } }));
      showToast("AI Auto-Fill successful!", "success");
    } catch (error) {
      showToast("AI Auto-Fill failed. Check API key or part number.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const appendFormat = (field: keyof ProductForm, snippet: string) => {
    setFormData(prev => ({ ...prev, [field]: `${(prev[field] as string) || ''}${snippet}` }));
  };

  const FormatToolbar = ({ field }: { field: keyof ProductForm }) => (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-gray-500">Formatting:</span>
      <button type="button" onClick={() => appendFormat(field, "\n\n## Heading\n")} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300">H2</button>
      <button type="button" onClick={() => appendFormat(field, "\n\n### Subheading\n")} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300">H3</button>
      <button type="button" onClick={() => appendFormat(field, "\n- Bullet item\n- Bullet item\n")} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300">Bullets</button>
    </div>
  );

  const handleSpecValueChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, specs: { ...(prev.specs || {}), [key]: value } }));
  };

  const handleSpecKeyChange = (oldKey: string, newKey: string) => {
    setFormData(prev => {
      const specs = { ...(prev.specs || {}) } as Record<string, any>;
      const val = specs[oldKey];
      delete specs[oldKey];
      const k = newKey.trim();
      if (k) specs[k] = val;
      return { ...prev, specs };
    });
  };

  const removeSpec = (key: string) => {
    setFormData(prev => {
      const specs = { ...(prev.specs || {}) } as Record<string, any>;
      delete specs[key];
      return { ...prev, specs };
    });
  };

  const addSpec = () => {
    const k = newSpecKey.trim();
    if (!k) return;
    setFormData(prev => ({ ...prev, specs: { ...(prev.specs || {}), [k]: newSpecValue } }));
    setNewSpecKey('');
    setNewSpecValue('');
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product & { tags?: string[] }) => {
    setEditingId(product.id);
    setFormData({
      ...initialFormState,
      ...product,
      tags: product.tags || [],
      redirectTo: product.redirectTo || '',
      redirectPermanent: product.redirectPermanent ?? true
      // @ts-ignore
      , seoH1: (product as any).seoH1 || ''
      // @ts-ignore
      , seoText: (product as any).seoText || ''
      , schema: (product as any).schema || {
        mpn: (product as any)?.specs?.__schema_mpn || '',
        itemCondition: (product as any)?.specs?.__schema_itemCondition || 'NewCondition',
        gtin13: (product as any)?.specs?.__schema_gtin13 || '',
        gtin14: (product as any)?.specs?.__schema_gtin14 || '',
        priceValidUntil: (product as any)?.specs?.__schema_priceValidUntil || '',
        seller: (product as any)?.specs?.__schema_seller || '',
        ratingValue: (product as any)?.specs?.__schema_ratingValue || '',
        reviewCount: (product as any)?.specs?.__schema_reviewCount || '',
        reviews: (product as any)?.specs?.__schema_reviews || ''
      }
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Use manual stockLevel if set, otherwise auto-calculate based on status
    const calculatedStockLevel = typeof formData.stockLevel === 'number' && formData.stockLevel > 0
      ? formData.stockLevel
      : (formData.stockStatus === 'IN_STOCK' ? Math.floor(Math.random() * 25) + 1 : 0);
    const payload = { ...formData, basePrice: formData.price, attributes: formData.specs, schema: (formData as any).schema || {}, stockLevel: calculatedStockLevel };

    try {
      if (editingId) {
        await api.patch(`/products/${editingId}`, payload);
        showToast("Product updated successfully.", "success");
      } else {
        await api.post('/products', payload);
        showToast("Product created successfully.", "success");
      }
      await refresh();
      setIsModalOpen(false);
    } catch (err) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Operation failed'}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openBulkModal = () => {
    setIsBulkModalOpen(true);
    setBulkRows([]);
    setBulkResult({ success: 0, failed: 0 });
    setBulkFileName('');
  };

  const csvHeaders = [
    'sku', 'name', 'description', 'brand', 'category', 'image', 'basePrice', 'stockLevel', 'weight', 'dimensions', 'attributes', 'overview', 'warranty', 'compatibility', 'datasheet', 'metaTitle', 'metaDescription', 'tags', 'redirectTo', 'redirectPermanent',
    'schema_mpn', 'schema_itemCondition', 'schema_gtin13', 'schema_gtin14', 'schema_priceValidUntil', 'schema_seller', 'schema_ratingValue', 'schema_reviewCount', 'schema_reviews'
  ];

  const downloadTemplate = () => {
    const sample = [
      'SRV-720XD', 'PowerEdge R720XD', 'High-density 2U server', 'Dell', 'Servers', '',
      '4999.99', '100', '45 lbs', '3.4 x 17.4 x 28.7 in', '{"cpu":"Xeon","ram":"128GB","drive":"12x 3.5"}', 'Enterprise overview', '3-Year', 'R720,R730', 'https://example.com/datasheet.pdf', 'Enterprise Server', 'High performance compute node', 'server, dell, r720', '', 'true',
      'SRV-720XD', 'NewCondition', '', '', '2025-12-31', 'Teraformix', '4.8', '24', '[{"author":"Jane","datePublished":"2024-01-01","reviewBody":"Great","ratingValue":5}]'
    ];
    const rows = [csvHeaders.join(','), sample.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tfx_product_bulk_template.csv';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const parseCSV = (text: string) => {
    const out: string[][] = [];
    let row: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        row.push(cur); cur = '';
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (cur !== '' || row.length) { row.push(cur); out.push(row); row = []; cur = ''; }
      } else {
        cur += ch;
      }
    }
    if (cur !== '' || row.length) { row.push(cur); out.push(row); }
    return out;
  };

  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const rows = parseCSV(text).filter(r => r.length && r.some(c => c.trim() !== ''));
      if (!rows.length) { showToast('Empty CSV', 'error'); return; }
      const header = rows[0].map(h => h.trim());
      const dataRows = rows.slice(1);
      const mapped = dataRows.map(cols => {
        const obj: any = {};
        header.forEach((h, idx) => { obj[h] = cols[idx] ?? ''; });
        return obj;
      });
      setBulkRows(mapped);
      showToast(`Parsed ${mapped.length} rows`, 'success');
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (!bulkRows.length) { showToast('No rows to upload', 'error'); return; }
    setBulkUploading(true);
    const normalized = bulkRows.map(r => {
      const sku = (r.sku || '').trim();
      const name = (r.name || '').trim();
      const rawPrice = (r.basePrice ?? r.price ?? '').toString();
      const priceSanitized = rawPrice.replace(/[,\s]/g, '').replace(/[^0-9.\-]/g, '');
      const priceNum = parseFloat(priceSanitized);
      const rawStock = (r.stockLevel ?? '').toString();
      const stockSanitized = rawStock.replace(/[,\s]/g, '').replace(/[^0-9\-]/g, '');
      const stockNum = parseInt(stockSanitized || '0', 10);
      const description = (r.description || `${r.brand ? r.brand + ' ' : ''}${name || sku}`).toString();
      let attributes: any = {};
      try { attributes = r.attributes ? JSON.parse(r.attributes) : {}; } catch { }
      const schema: any = {};
      const setIfPresent = (key: string, val: any) => {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          schema[key] = val;
        }
      };
      setIfPresent('mpn', r.schema_mpn);
      setIfPresent('itemCondition', r.schema_itemCondition);
      setIfPresent('gtin13', r.schema_gtin13);
      setIfPresent('gtin14', r.schema_gtin14);
      setIfPresent('priceValidUntil', r.schema_priceValidUntil);
      setIfPresent('seller', r.schema_seller);
      setIfPresent('ratingValue', r.schema_ratingValue);
      setIfPresent('reviewCount', r.schema_reviewCount);
      setIfPresent('reviews', r.schema_reviews);
      const cleanText = (s: any) => String(s || '').replace(/`/g, '').trim();
      return {
        sku, name, description,
        basePrice: isNaN(priceNum) ? undefined : priceNum,
        stockLevel: isNaN(stockNum) ? 0 : stockNum,
        weight: cleanText(r.weight),
        dimensions: cleanText(r.dimensions),
        attributes,
        schema,
        brand: cleanText(r.brand),
        category: cleanText(r.category),
        image: cleanText(r.image),
        overview: cleanText(r.overview),
        warranty: cleanText(r.warranty),
        compatibility: cleanText(r.compatibility),
        datasheet: cleanText(r.datasheet),
        metaTitle: cleanText(r.metaTitle),
        metaDescription: cleanText(r.metaDescription),
        tags: (r.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
        redirectTo: cleanText(r.redirectTo),
        redirectPermanent: String(r.redirectPermanent || '').toLowerCase() === 'false' ? false : true
      };
    }).filter(i => i.sku && i.name && i.basePrice !== undefined);
    const dropped = bulkRows.length - normalized.length;
    if (dropped > 0) {
      showToast(`Skipped ${dropped} rows with invalid price/fields`, 'error');
    }
    try {
      await ensureCategoriesForBulk(normalized);
    } catch { }
    try {
      const chunkSize = 200;
      let created = 0, updated = 0, failed = 0;
      for (let i = 0; i < normalized.length; i += chunkSize) {
        const batch = normalized.slice(i, i + chunkSize);
        const res = await api.post<{ created: number; updated: number; failed: number; details: any[] }>(
          '/products/bulk',
          batch
        );
        const r: any = res || {};
        created += r.created || 0;
        updated += r.updated || 0;
        failed += r.failed || 0;
      }
      setBulkResult({ success: created + updated, failed });
      showToast(`Bulk upload completed. Success: ${created + updated}, Failed: ${failed}`, failed ? 'error' : 'success');
    } catch {
      setBulkResult({ success: 0, failed: normalized.length });
      showToast('Bulk upload failed. Check API URL and authentication.', 'error');
    } finally {
      setBulkUploading(false);
      await refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${id}`);
        showToast("Product deleted.", "info");
        await refresh();
      } catch (err) {
        showToast(`Error: ${err instanceof Error ? err.message : 'Delete failed'}`, "error");
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
            Product Inventory
            {error && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">Offline</span>}
          </h3>
          <p className="text-sm text-gray-500">Manage catalog, pricing, and availability.</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-navy-900 outline-none max-w-[150px]"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
          <select
            value={showPriceFilter}
            onChange={(e) => setShowPriceFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-navy-900 outline-none"
          >
            <option value="all">All Visibility</option>
            <option value="show">Price Shown</option>
            <option value="hide">Price Hidden</option>
          </select>
          <select
            value={imageFilter}
            onChange={(e) => setImageFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-navy-900 outline-none"
          >
            <option value="all">All Images</option>
            <option value="with_image">With Image</option>
            <option value="no_image">No Image</option>
          </select>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-navy-900 outline-none"
          >
            <option value="all">All Prices</option>
            <option value="with_price">With Price</option>
            <option value="no_price">No Price / $0</option>
          </select>
          {selectedProductIds.size > 0 && (
            <button
              onClick={() => setIsBulkEditModalOpen(true)}
              className="bg-action-600 hover:bg-action-700 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold transition animate-fadeIn"
            >
              <Edit className="w-4 h-4" /> Bulk Edit ({selectedProductIds.size})
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products by name, SKU, brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-900 outline-none w-64 bg-white"
            />
          </div>
          <button onClick={openAddModal} className="bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold transition">
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <button onClick={openBulkModal} className="bg-white border border-gray-300 text-navy-900 px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold transition hover:bg-gray-50">
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {initialLoading && products.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading inventory...</div>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center text-orange-700 bg-orange-50">
            <AlertCircle className="w-8 h-8 mb-2" />
            Could not connect to the backend server.
            <p className="text-xs mt-2 text-gray-500">Ensure the server is running and the API URL is correct in Settings.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center text-gray-400"><AlertCircle className="w-8 h-8 mb-2" />No products found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3 w-10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-900"
                        checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="px-6 py-3">Product</th><th className="px-6 py-3">SKU</th><th className="px-6 py-3">Category</th><th className="px-6 py-3">Price</th><th className="px-6 py-3">Stock</th><th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedProducts.map((p) => (
                    <tr key={p.id} className={`hover:bg-gray-50 transition group ${selectedProductIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-900"
                          checked={selectedProductIds.has(p.id)}
                          onChange={() => toggleSelection(p.id)}
                        />
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded border ${!p.image || p.image.trim() === '' ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'} flex items-center justify-center overflow-hidden`}>
                            {p.image && p.image.trim() !== '' ? (
                              <img src={p.image} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          <span className="font-medium text-navy-900 line-clamp-1" title={p.name}>{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">{p.sku}</td>
                      <td className="px-6 py-4 text-gray-500">{p.category}</td>
                      <td className={`px-6 py-4 font-bold ${!p.price || p.price <= 0 ? 'text-red-600' : 'text-navy-900'}`}>
                        {!p.price || p.price <= 0 ? (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            $0
                          </span>
                        ) : (
                          `$${p.price.toLocaleString()}`
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${p.stockStatus === 'IN_STOCK' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {p.stockStatus === 'IN_STOCK' ? 'In Stock' : 'Backorder'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(p)} className="p-1.5 text-gray-400 hover:text-navy-900 hover:bg-gray-200 rounded"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-medium">{filteredProducts.length}</span> results
                  </div>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-navy-900"
                  >
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let startPage = 1;
                      if (totalPages > 5) {
                        if (currentPage > 3) startPage = currentPage - 2;
                        if (currentPage > totalPages - 2) startPage = totalPages - 4;
                      }
                      const pageNum = startPage + i;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                            ? 'bg-navy-900 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-navy-900">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="border-b border-gray-200 bg-white px-6">
              <div className="flex space-x-6">
                <button onClick={() => setActiveTab('basic')} className={`py-3 text-sm font-medium border-b-2 transition ${activeTab === 'basic' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Basic Info</button>
                <button onClick={() => setActiveTab('technical')} className={`py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'technical' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FileText className="w-4 h-4" /> Technical</button>
                <button onClick={() => setActiveTab('seo')} className={`py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'seo' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Search className="w-4 h-4" /> SEO & Content</button>
                <button onClick={() => setActiveTab('redirect')} className={`py-3 text-sm font-medium border-b-2 transition ${activeTab === 'redirect' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Redirect</button>
                <button onClick={() => setActiveTab('reviews')} className={`py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'reviews' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><MessageSquare className="w-4 h-4" /> Reviews</button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-8">
                {activeTab === 'basic' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">SKU / MPN</label>
                        <div className="flex gap-2">
                          <input type="text" name="sku" required value={formData.sku} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none" />
                          <button type="button" onClick={handleAiFetchSpecs} disabled={isAiLoading || !formData.sku} className="px-3 py-2 bg-action-100 text-action-700 rounded-lg text-xs font-bold hover:bg-action-200 transition flex items-center gap-1 disabled:opacity-50 whitespace-nowrap">
                            {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} AI Auto-Fill
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Price ($)</label>
                        <input type="number" name="price" required value={formData.price} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none" />
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="showPrice"
                            name="showPrice"
                            checked={formData.showPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, showPrice: e.target.checked }))}
                            className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-900"
                          />
                          <label htmlFor="showPrice" className="text-sm text-gray-700 font-medium select-none cursor-pointer">Show Price</label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                        <select name="category" value={formData.category} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none">
                          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Status</label>
                        <select name="stockStatus" value={formData.stockStatus} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none">
                          <option value="IN_STOCK">In Stock</option><option value="BACKORDER">Backorder</option><option value="OUT_OF_STOCK">Out of Stock</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Quantity</label>
                        <input
                          type="number"
                          name="stockLevel"
                          min="0"
                          value={formData.stockLevel || 0}
                          onChange={(e) => setFormData(prev => ({ ...prev, stockLevel: parseInt(e.target.value) || 0 }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                          placeholder="Auto-set if left at 0"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave at 0 to auto-randomize (1-25) for in-stock items</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                          {formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-contain" /> : <span className="text-xs text-gray-400">No Image</span>}
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'technical' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                      <input name="weight" placeholder="Weight (e.g. 45 lbs)" value={formData.weight} onChange={handleInputChange} className="border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
                      <input name="dimensions" placeholder="Dimensions" value={formData.dimensions} onChange={handleInputChange} className="border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
                      <FormatToolbar field="description" />
                      <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="Supports markdown: ## heading, ### subheading, - bullets" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Long Technical Overview</label>
                      <FormatToolbar field="overview" />
                      <textarea name="overview" value={formData.overview} onChange={handleInputChange} rows={5} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="Supports markdown: ## heading, ### subheading, - bullets" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Compatibility List</label>
                      <FormatToolbar field="compatibility" />
                      <textarea name="compatibility" value={formData.compatibility} onChange={handleInputChange} rows={3} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="Supports markdown: ## heading, ### subheading, - bullets" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Datasheet URL</label>
                      <input name="datasheet" value={formData.datasheet} onChange={handleInputChange} className="border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Specifications</label>
                      <div className="space-y-2">
                        {Object.entries(formData.specs || {}).map(([key, value], idx) => (
                          <div key={`${key}-${idx}`} className="flex items-center gap-2">
                            <input
                              value={key}
                              onChange={(e) => handleSpecKeyChange(key, e.target.value)}
                              placeholder="Key"
                              className="w-48 border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                            />
                            <input
                              value={String(value ?? '')}
                              onChange={(e) => handleSpecValueChange(key, e.target.value)}
                              placeholder="Value"
                              className="flex-1 border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                            />
                            <button type="button" onClick={() => removeSpec(key)} className="px-2 py-2 text-sm bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100">Remove</button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            value={newSpecKey}
                            onChange={(e) => setNewSpecKey(e.target.value)}
                            placeholder="New key"
                            className="w-48 border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                          />
                          <input
                            value={newSpecValue}
                            onChange={(e) => setNewSpecValue(e.target.value)}
                            placeholder="New value"
                            className="flex-1 border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                          />
                          <button type="button" onClick={addSpec} className="px-3 py-2 bg-navy-900 text-white rounded text-sm font-bold flex items-center gap-2 hover:bg-navy-800">
                            <Plus className="w-4 h-4" /> Add Spec
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'seo' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Page Title (Meta Title)</label>
                      <input name="metaTitle" value={formData.metaTitle} onChange={handleInputChange} className="border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="e.g. Dell R720XD | Teraformix" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">H1 Headline</label>
                      <input name="seoH1" value={(formData as any).seoH1 || ''} onChange={handleInputChange} className="border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900 font-bold" placeholder="e.g. Enterprise Server Solutions" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Intro Paragraph (SEO Text)</label>
                      <FormatToolbar field={"seoText" as any} />
                      <textarea name="seoText" value={(formData as any).seoText || ''} onChange={handleInputChange} rows={4} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="Supports markdown: ## heading, ### subheading, - bullets" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
                      <input name="metaDescription" value={formData.metaDescription} onChange={handleInputChange} className="border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="Summary for search results..." />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tags (comma-separated)</label>
                      <input value={(formData.tags || []).join(', ')} onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-bold text-navy-900 mb-3">Schema Markup (JSON-LD)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">MPN (override)</label>
                          <input
                            value={(formData as any)?.schema?.mpn || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, schema: { ...((prev as any).schema || {}), mpn: e.target.value } }))}
                            placeholder={formData.sku || 'MPN'}
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Item Condition</label>
                          <select
                            value={(formData as any)?.schema?.itemCondition || 'NewCondition'}
                            onChange={(e) => setFormData(prev => ({ ...prev, schema: { ...((prev as any).schema || {}), itemCondition: e.target.value } }))}
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                          >
                            <option value="NewCondition">New</option>
                            <option value="UsedCondition">Used</option>
                            <option value="RefurbishedCondition">Refurbished</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">GTIN-13</label>
                          <input
                            value={(formData as any)?.schema?.gtin13 || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, schema: { ...((prev as any).schema || {}), gtin13: e.target.value } }))}
                            placeholder="e.g. 0123456789012"
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">GTIN-14</label>
                          <input
                            value={(formData as any)?.schema?.gtin14 || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, schema: { ...((prev as any).schema || {}), gtin14: e.target.value } }))}
                            placeholder="e.g. 01234567890123"
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Price Valid Until</label>
                          <input
                            type="date"
                            value={(formData as any)?.schema?.priceValidUntil || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, schema: { ...((prev as any).schema || {}), priceValidUntil: e.target.value } }))}
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Seller Name</label>
                          <input
                            value={(formData as any)?.schema?.seller || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, schema: { ...((prev as any).schema || {}), seller: e.target.value } }))}
                            placeholder="e.g. Teraformix"
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Aggregate Rating Value</label>
                          <input
                            type="number"
                            step="0.1"
                            value={(formData as any)?.schema?.ratingValue || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, schema: { ...((prev as any).schema || {}), ratingValue: e.target.value } }))}
                            placeholder="e.g. 4.8"
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Aggregate Review Count</label>
                          <input
                            type="number"
                            value={(formData as any)?.schema?.reviewCount || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, schema: { ...((prev as any).schema || {}), reviewCount: e.target.value } }))}
                            placeholder="e.g. 24"
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Reviews (JSON array)</label>
                        <textarea
                          rows={5}
                          value={(formData as any)?.schema?.reviews || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, schema: { ...((prev as any).schema || {}), reviews: e.target.value } }))}
                          placeholder='e.g. [{"author":"Jane","datePublished":"2024-01-01","reviewBody":"Great","ratingValue":5}]'
                          className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'redirect' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Redirect To URL</label>
                      <input name="redirectTo" value={formData.redirectTo} onChange={handleInputChange} placeholder="https://... or /product/NEW-SKU" className="border border-gray-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="redirectPermanent" name="redirectPermanent" checked={!!formData.redirectPermanent} onChange={(e) => setFormData(prev => ({ ...prev, redirectPermanent: e.target.checked }))} className="rounded border-gray-300 text-navy-900 focus:ring-navy-900" />
                      <label htmlFor="redirectPermanent" className="text-sm font-medium text-gray-700">Permanent (301)</label>
                    </div>
                  </div>
                )}
              </form>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition">Cancel</button>
              <button type="submit" form="productForm" disabled={isSaving} className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-70">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isSaving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-navy-900">Bulk Upload Products</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex gap-2">
                <button onClick={downloadTemplate} className="px-3 py-2 bg-navy-900 text-white rounded text-sm font-bold flex items-center gap-2 hover:bg-navy-800"><Download className="w-4 h-4" /> Download CSV Template</button>
                <label className="px-3 py-2 bg-white border border-gray-300 rounded text-sm font-bold flex items-center gap-2 cursor-pointer hover:bg-gray-50">
                  <Upload className="w-4 h-4" /> Select CSV File
                  <input type="file" accept=".csv" className="hidden" onChange={handleBulkFile} />
                </label>
              </div>
              {bulkFileName && <div className="text-xs text-gray-600">Selected: {bulkFileName}</div>}
              {bulkRows.length > 0 && (
                <div className="text-sm text-gray-700">Parsed rows: {bulkRows.length}</div>
              )}
              <div className="text-xs text-gray-500">Required fields: sku, name, basePrice, stockLevel. Optional: brand, category, image, weight, dimensions, attributes (JSON), overview, warranty, compatibility, datasheet, metaTitle, metaDescription, tags, redirectTo, redirectPermanent. Schema (optional): schema_mpn, schema_itemCondition (NewCondition|UsedCondition|RefurbishedCondition), schema_gtin13, schema_gtin14, schema_priceValidUntil (YYYY-MM-DD), schema_seller, schema_ratingValue, schema_reviewCount, schema_reviews (JSON array).</div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition">Close</button>
              <button onClick={handleBulkUpload} disabled={bulkUploading || bulkRows.length === 0} className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-70">
                {bulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {bulkUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            {(bulkResult.success || bulkResult.failed) && (
              <div className="px-6 pb-6 text-xs text-gray-600">Uploaded: {bulkResult.success} • Failed: {bulkResult.failed}</div>
            )}
          </div>
        </div>
      )}

      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-navy-900">Bulk Edit Products ({selectedProductIds.size})</h3>
              <button onClick={() => setIsBulkEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Show Price</label>
                <select
                  value={bulkEditData.showPrice}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, showPrice: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                >
                  <option value="no_change">No Change</option>
                  <option value="true">Yes (Show Price)</option>
                  <option value="false">No (Hide Price)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Status</label>
                <select
                  value={bulkEditData.stockStatus}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, stockStatus: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                >
                  <option value="no_change">No Change</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="BACKORDER">Backorder</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={bulkEditData.category}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                >
                  <option value="no_change">No Change</option>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsBulkEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition">Cancel</button>
              <button
                onClick={handleBulkEditSubmit}
                disabled={isSaving}
                className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isSaving ? 'Updating...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
