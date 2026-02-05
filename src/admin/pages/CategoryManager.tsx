
import React, { useState } from 'react';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { Category } from '../../types';
import { Edit, Trash2, Plus, X, Save, Layers, Upload, Image as ImageIcon, Search } from 'lucide-react';

const CategoryManager = () => {
  const { content, updateContent } = useGlobalContent();
  const [categories, setCategories] = useState<Category[]>(content.categories || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'seo'>('basic');

  // Form State
  const initialFormState: Category = {
    id: '',
    name: '',
    description: '',
    image: '',
    isActive: true,
    seoTitle: '',
    seoDescription: '',
    seoH1: '',
    seoText: '',
    redirectTo: '',
    redirectPermanent: false
  };
  const [formData, setFormData] = useState<Category>(initialFormState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) { // 800KB limit
          alert("File size too large. Please upload an image under 800KB.");
          return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
        ...category,
        seoTitle: category.seoTitle || '',
        seoDescription: category.seoDescription || '',
        seoH1: category.seoH1 || '',
        seoText: category.seoText || '',
        redirectTo: category.redirectTo || '',
        redirectPermanent: !!category.redirectPermanent
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category? Products assigned to this category may lose their association.")) {
        const updatedList = categories.filter(c => c.id !== id);
        setCategories(updatedList);
        await updateContent({ categories: updatedList });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let updatedList: Category[];
      
      // Auto-generate ID if empty on create
      if (!editingId && !formData.id) {
          formData.id = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }

      if (editingId) {
        updatedList = categories.map(c => c.id === editingId ? formData : c);
      } else {
        if (categories.some(c => c.id === formData.id)) {
            alert("A category with this ID already exists.");
            setIsSaving(false);
            return;
        }
        updatedList = [...categories, formData];
      }

      await updateContent({ categories: updatedList });
      setCategories(updatedList);
      
      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingId(null);
    } catch (error) {
      console.error("Failed to save category", error);
      alert("Failed to save category.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-lg font-bold text-navy-900">Category Management</h3>
           <p className="text-sm text-gray-500">Organize your product catalog structure.</p>
        </div>
        <button 
            onClick={openAddModal}
            className="bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold transition"
        >
           <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col group">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-full bg-navy-50 border border-navy-100 flex items-center justify-center overflow-hidden">
                             {cat.image ? (
                                 <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                             ) : (
                                 <Layers className="w-6 h-6 text-navy-400" />
                             )}
                         </div>
                         <div>
                             <h4 className="font-bold text-navy-900">{cat.name}</h4>
                             <span className="text-xs font-mono text-gray-400">ID: {cat.id}</span>
                         </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEdit(cat)} className="p-2 text-gray-400 hover:text-navy-900 hover:bg-gray-100 rounded">
                             <Edit className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                             <Trash2 className="w-4 h-4" />
                         </button>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-2">{cat.description}</p>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                     <span className={`px-2 py-1 rounded-full font-bold ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                         {cat.isActive ? 'Active' : 'Hidden'}
                     </span>
                     {cat.seoTitle && <span className="flex items-center gap-1 text-blue-600" title="SEO Configured"><Search className="w-3 h-3" /> SEO Set</span>}
                </div>
            </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h3 className="text-lg font-bold text-navy-900">{editingId ? 'Edit Category' : 'Add New Category'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="border-b border-gray-200 bg-white px-6">
                  <div className="flex space-x-6">
                      <button 
                        onClick={() => setActiveTab('basic')}
                        className={`py-3 text-sm font-medium border-b-2 transition ${activeTab === 'basic' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                          Basic Info
                      </button>
                      <button 
                        onClick={() => setActiveTab('seo')}
                        className={`py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'seo' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                          <Search className="w-4 h-4" /> SEO & Content
                      </button>
                  </div>
              </div>
              
              <div className="p-6 overflow-y-auto">
                 <form id="categoryForm" onSubmit={handleSubmit} className="space-y-6">
                    
                    {activeTab === 'basic' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name</label>
                                    <input 
                                        type="text" 
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                                        placeholder="e.g. Rack Servers"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">ID / Slug</label>
                                    <input 
                                        type="text" 
                                        name="id"
                                        disabled={!!editingId}
                                        value={formData.id}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm focus:ring-2 focus:ring-navy-900 outline-none font-mono text-gray-600 disabled:text-gray-400"
                                        placeholder={editingId ? formData.id : "auto-generated"}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description (Card View)</label>
                                <input 
                                    type="text" 
                                    name="description"
                                    required
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                                    placeholder="e.g. High-performance compute nodes"
                                />
                            </div>

                            <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Category Image</label>
                            <div className="flex gap-4 items-center">
                                <div className="w-16 h-16 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                                    {formData.image ? (
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-6 h-6 text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-grow">
                                    <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-navy-700 px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-2">
                                        <Upload className="w-4 h-4" /> Upload Image
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                    <p className="text-xs text-gray-400 mt-2">Recommended: 400x400px, Max 800KB</p>
                                </div>
                            </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.checked}))}
                                    className="rounded border-gray-300 text-navy-900 focus:ring-navy-900"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (Visible in Store)</label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'seo' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Page Title (Meta Title)</label>
                                <input 
                                    type="text" 
                                    name="seoTitle"
                                    value={formData.seoTitle}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                                    placeholder="e.g. Enterprise Servers | Dell & HPE | Server Tech Central"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">H1 Headline (Top of Page)</label>
                                <input 
                                    type="text" 
                                    name="seoH1"
                                    value={formData.seoH1}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none font-bold"
                                    placeholder="e.g. Enterprise Server Solutions"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Intro Paragraph (SEO Text)</label>
                                <textarea 
                                    name="seoText"
                                    value={formData.seoText}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                                    placeholder="Detailed text displayed at the top of the category page..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
                                <textarea 
                                    name="seoDescription"
                                    value={formData.seoDescription}
                                    onChange={handleInputChange}
                                    rows={2}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                                    placeholder="Summary for search engine results..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Redirect To (optional)</label>
                                    <input 
                                        type="text" 
                                        name="redirectTo"
                                        value={formData.redirectTo || ''}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-navy-900 outline-none font-mono"
                                        placeholder="/category/new-slug or https://domain/path"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input 
                                        type="checkbox" 
                                        id="redirectPermanent"
                                        checked={!!formData.redirectPermanent}
                                        onChange={(e) => setFormData(prev => ({ ...prev, redirectPermanent: e.target.checked }))}
                                        className="rounded border-gray-300 text-navy-900 focus:ring-navy-900"
                                    />
                                    <label htmlFor="redirectPermanent" className="text-sm font-medium text-gray-700">Permanent (301)</label>
                                </div>
                            </div>
                        </div>
                    )}

                 </form>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                 <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition"
                 >
                    Cancel
                 </button>
                 <button 
                    type="submit" 
                    form="categoryForm"
                    disabled={isSaving}
                    className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-70"
                 >
                    {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Category</>}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
