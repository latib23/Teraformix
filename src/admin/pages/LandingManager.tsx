import React, { useEffect, useMemo, useState } from 'react';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { api } from '../../lib/api';
import { Save, Loader2, Layers, Search, Image as ImageIcon } from 'lucide-react';

type LandingCollection = {
  slug: string;
  title: string;
  heroTitle: string;
  heroSubtitle: string;
  bannerImage: string;
  description: string;
  productIds: string[];
  testimonials?: Array<{ quote: string; author: string; role?: string; company?: string }>;
  logos?: Array<{ name: string; imageUrl: string }>;
};

type ProductLite = {
  id: string;
  name: string;
  sku: string;
  price: number;
  image: string;
};

const LandingManager = () => {
  const { content, updateContent } = useGlobalContent();
  const [collections, setCollections] = useState<LandingCollection[]>(content.landingCollections || []);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setCollections(content.landingCollections || []);
  }, [content.landingCollections]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{ items: any[]; total: number }>('products/paginated?limit=100000&offset=0');
        const items = Array.isArray(res?.items) ? res!.items : [];
        const mapped: ProductLite[] = items.map((p: any) => ({
          id: String(p.id || ''),
          name: String(p.name || ''),
          sku: String(p.sku || ''),
          price: Number(p.price || p.basePrice || 0),
          image: String(p.image || ''),
        })).filter(p => p.id && p.name && p.sku);
        setProducts(mapped);
      } catch (e) {
        setProducts([]);
      }
    })();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));
  }, [products, search]);

  const toggleProduct = (colIdx: number, id: string) => {
    setCollections(prev => {
      const next = [...prev];
      const sel = new Set(next[colIdx].productIds || []);
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      next[colIdx] = { ...next[colIdx], productIds: Array.from(sel) };
      return next;
    });
  };

  const updateField = (idx: number, field: keyof LandingCollection, value: string) => {
    setCollections(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value } as LandingCollection;
      return next;
    });
  };

  const addTestimonial = (idx: number) => {
    setCollections(prev => {
      const next = [...prev];
      const list = Array.isArray(next[idx].testimonials) ? next[idx].testimonials! : [];
      next[idx] = { ...next[idx], testimonials: [...list, { quote: '', author: '', role: '', company: '' }] };
      return next;
    });
  };

  const updateTestimonial = (idx: number, tIdx: number, field: 'quote' | 'author' | 'role' | 'company', value: string) => {
    setCollections(prev => {
      const next = [...prev];
      const list = Array.isArray(next[idx].testimonials) ? [...next[idx].testimonials!] : [];
      list[tIdx] = { ...list[tIdx], [field]: value } as any;
      next[idx] = { ...next[idx], testimonials: list };
      return next;
    });
  };

  const removeTestimonial = (idx: number, tIdx: number) => {
    setCollections(prev => {
      const next = [...prev];
      const list = (next[idx].testimonials || []).filter((_, i) => i !== tIdx);
      next[idx] = { ...next[idx], testimonials: list };
      return next;
    });
  };

  const addLogo = (idx: number) => {
    setCollections(prev => {
      const next = [...prev];
      const list = Array.isArray(next[idx].logos) ? next[idx].logos! : [];
      next[idx] = { ...next[idx], logos: [...list, { name: '', imageUrl: '' }] };
      return next;
    });
  };

  const updateLogo = (idx: number, lIdx: number, field: 'name' | 'imageUrl', value: string) => {
    setCollections(prev => {
      const next = [...prev];
      const list = Array.isArray(next[idx].logos) ? [...next[idx].logos!] : [];
      list[lIdx] = { ...list[lIdx], [field]: value } as any;
      next[idx] = { ...next[idx], logos: list };
      return next;
    });
  };

  const removeLogo = (idx: number, lIdx: number) => {
    setCollections(prev => {
      const next = [...prev];
      const list = (next[idx].logos || []).filter((_, i) => i !== lIdx);
      next[idx] = { ...next[idx], logos: list };
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateContent({ landingCollections: collections });
      alert('Landing collections saved');
    } catch (e) {
      alert('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-navy-700" />
          <h3 className="text-lg font-bold text-navy-900">Landing Collections</h3>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-action-600 hover:bg-action-500 disabled:bg-gray-400 text-white px-6 py-2 rounded shadow flex items-center gap-2 font-bold transition"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="flex-grow border border-gray-300 rounded p-2 text-sm"
          />
        </div>
        <div className="mt-3 text-xs text-gray-500">Search filters the list below when assigning products.</div>
      </div>

      <div className="space-y-8">
        {collections.map((col, idx) => (
          <section key={col.slug} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-md font-bold text-navy-900">{col.title}</h4>
                <p className="text-xs text-gray-500">Slug: {col.slug}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                <input
                  type="text"
                  value={col.heroTitle}
                  onChange={e => updateField(idx, 'heroTitle', e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
                <input
                  type="text"
                  value={col.heroSubtitle}
                  onChange={e => updateField(idx, 'heroSubtitle', e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={col.description}
                  onChange={e => updateField(idx, 'description', e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image URL</label>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={col.bannerImage}
                    onChange={e => updateField(idx, 'bannerImage', e.target.value)}
                    className="flex-grow border border-gray-300 rounded p-2 text-sm font-mono"
                    placeholder="https://..."
                  />
                  <div className="w-32 h-20 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                    {col.bannerImage ? (
                      <img src={col.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                </div>
              </div>
            </div>

          <div className="mt-6">
            <h5 className="text-sm font-bold text-navy-900 mb-2">Assign Products</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded p-3">
                {filteredProducts.map(p => {
                  const selected = (col.productIds || []).includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(idx, p.id)}
                      className={`flex items-center gap-3 p-2 rounded border text-left ${selected ? 'border-action-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <img src={p.image} alt="" className="w-10 h-10 rounded object-contain border" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-navy-900 line-clamp-1">{p.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{p.sku}</div>
                      </div>
                      <div className={`text-xs font-bold ${selected ? 'text-action-600' : 'text-gray-400'}`}>{selected ? 'Added' : 'Add'}</div>
                    </button>
                  );
                })}
              </div>
            <div className="text-xs text-gray-500 mt-2">Selected: {(col.productIds || []).length} products</div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-bold text-navy-900">Testimonials</h5>
              <button type="button" onClick={() => addTestimonial(idx)} className="text-xs px-3 py-1 rounded bg-navy-900 text-white">Add</button>
            </div>
            <div className="space-y-3">
              {(col.testimonials || []).map((t, tIdx) => (
                <div key={tIdx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                  <textarea
                    rows={2}
                    placeholder="Quote"
                    value={t.quote}
                    onChange={e => updateTestimonial(idx, tIdx, 'quote', e.target.value)}
                    className="md:col-span-2 border border-gray-300 rounded p-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Author"
                    value={t.author}
                    onChange={e => updateTestimonial(idx, tIdx, 'author', e.target.value)}
                    className="border border-gray-300 rounded p-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Role"
                      value={t.role || ''}
                      onChange={e => updateTestimonial(idx, tIdx, 'role', e.target.value)}
                      className="border border-gray-300 rounded p-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Company"
                        value={t.company || ''}
                        onChange={e => updateTestimonial(idx, tIdx, 'company', e.target.value)}
                        className="flex-1 border border-gray-300 rounded p-2 text-sm"
                      />
                      <button type="button" onClick={() => removeTestimonial(idx, tIdx)} className="text-xs px-3 py-1 rounded bg-red-100 text-red-700">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-bold text-navy-900">Customer Logos</h5>
              <button type="button" onClick={() => addLogo(idx)} className="text-xs px-3 py-1 rounded bg-navy-900 text-white">Add</button>
            </div>
            <div className="space-y-3">
              {(col.logos || []).map((l, lIdx) => (
                <div key={lIdx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Name"
                    value={l.name}
                    onChange={e => updateLogo(idx, lIdx, 'name', e.target.value)}
                    className="border border-gray-300 rounded p-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={l.imageUrl}
                    onChange={e => updateLogo(idx, lIdx, 'imageUrl', e.target.value)}
                    className="border border-gray-300 rounded p-2 text-sm font-mono"
                  />
                  <div className="flex items-center gap-3">
                    <img src={l.imageUrl} alt={l.name} className="w-20 h-10 object-contain border" />
                    <button type="button" onClick={() => removeLogo(idx, lIdx)} className="text-xs px-3 py-1 rounded bg-red-100 text-red-700">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
      </div>
    </div>
  );
};

export default LandingManager;
