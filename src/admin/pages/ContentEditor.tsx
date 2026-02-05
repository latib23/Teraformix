
import React, { useState, useEffect } from 'react';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { api } from '../../lib/api';
import { Save, Loader2, Upload, Image as ImageIcon, Layers, FileText, Home, ExternalLink } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';

const ContentEditor = () => {
  const { content, updateContent } = useGlobalContent();

  // Local state for forms
  const [activeSection, setActiveSection] = useState<'general' | 'home' | 'legal' | 'redirects'>('general');
  const [general, setGeneral] = useState(content.general);
  const [home, setHome] = useState(content.home);
  const [categoryPage, setCategoryPage] = useState(content.categoryPage);
  const [footer, setFooter] = useState(content.footer);
  const [privacyPolicy, setPrivacyPolicy] = useState(content.privacyPolicy || { content: '' });
  const [termsOfSale, setTermsOfSale] = useState(content.termsOfSale || { content: '' });
  const [termsAndConditions, setTermsAndConditions] = useState(((content as any).termsAndConditions) || { content: '' });
  const [returnPolicy, setReturnPolicy] = useState(((content as any).returnPolicy) || { content: '' });
  const [aboutPage, setAboutPage] = useState(((content as any).aboutPage) || { content: '' });
  const [contactPage, setContactPage] = useState(((content as any).contactPage) || { content: '' });
  const [warrantyPage, setWarrantyPage] = useState(((content as any).warrantyPage) || { content: '' });
  const [sitemapSettings, setSitemapSettings] = useState(content.sitemapSettings || { introText: '' });
  const [redirects, setRedirects] = useState<Array<{ from: string; to: string; permanent?: boolean }>>(((content as any).redirects) || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when content loads from DB/Storage
  useEffect(() => {
    setGeneral(content.general);
    setHome(content.home);
    setCategoryPage(content.categoryPage || { title: '', description: '', h1: '', introText: '' });
    setFooter(content.footer);
    setPrivacyPolicy(content.privacyPolicy || { content: '' });
    setTermsOfSale(content.termsOfSale || { content: '' });
    setTermsAndConditions(((content as any).termsAndConditions) || { content: '' });
    setReturnPolicy(((content as any).returnPolicy) || { content: '' });
    setAboutPage(((content as any).aboutPage) || { content: '' });
    setContactPage(((content as any).contactPage) || { content: '' });
    setWarrantyPage(((content as any).warrantyPage) || { content: '' });
    setSitemapSettings(content.sitemapSettings || { introText: '' });
    setRedirects(((content as any).redirects) || []);
  }, [content]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Perform a single atomic update for all sections to prevent race conditions
      await updateContent({
        general,
        home,
        categoryPage,
        footer,
        privacyPolicy,
        termsOfSale,
        termsAndConditions,
        returnPolicy,
        aboutPage,
        contactPage,
        warrantyPage,
        sitemapSettings,
        redirects
      });

      // In a real browser, we might show a toast notification here
      alert("Website updated successfully!");
    } catch (error) {
      console.error("Failed to save content:", error);
      alert("An error occurred while saving content.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert("Please upload a CSV file.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const result = await api.upload<{ imported: number; skipped: number }>('cms/redirects/import', formData);

      if (result) {
        alert(`Imported ${result.imported} redirects. Skipped ${result.skipped} duplicates.`);
        // Trigger a reload of global content to show new redirects
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Bulk upload failed", error);
      alert(`Bulk upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress to reasonable web size
        const base64 = await compressImage(file, 1200, 0.75);
        setHome(prev => ({ ...prev, heroImage: base64 }));
      } catch (error) {
        console.error("Compression failed", error);
        alert("Image processing failed. Please try another file.");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-navy-900">Content Editor</h3>
          <p className="text-gray-500 text-sm">Edit global site text, pages, and messaging.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-action-600 hover:bg-action-500 disabled:bg-gray-400 text-white px-6 py-2 rounded shadow flex items-center gap-2 font-bold transition"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setActiveSection('general')}
              className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 border-l-4 transition ${activeSection === 'general' ? 'border-action-600 bg-blue-50 text-navy-900' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              <Home className="w-4 h-4" /> General & Home
            </button>
            <button
              onClick={() => setActiveSection('home')}
              className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 border-l-4 transition ${activeSection === 'home' ? 'border-action-600 bg-blue-50 text-navy-900' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              <Layers className="w-4 h-4" /> SEO & Footer
            </button>
            <button
              onClick={() => setActiveSection('legal')}
              className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 border-l-4 transition ${activeSection === 'legal' ? 'border-action-600 bg-blue-50 text-navy-900' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              <FileText className="w-4 h-4" /> Legal & Pages
            </button>
            <button
              onClick={() => setActiveSection('redirects')}
              className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 border-l-4 transition ${activeSection === 'redirects' ? 'border-action-600 bg-blue-50 text-navy-900' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              <ExternalLink className="w-4 h-4" /> Redirects & URL Mapping
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow space-y-8">

          {activeSection === 'general' && (
            <div className="space-y-8 animate-fadeIn">
              {/* General Settings Section */}
              <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4 border-b pb-2">General Settings & Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Phone</label>
                    <input
                      type="text"
                      value={general.phone}
                      onChange={(e) => setGeneral({ ...general, phone: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                    <input
                      type="text"
                      value={general.email}
                      onChange={(e) => setGeneral({ ...general, email: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                    <input
                      type="text"
                      value={general.address}
                      onChange={(e) => setGeneral({ ...general, address: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Top Announcement Bar</label>
                    <input
                      type="text"
                      value={general.announcement}
                      onChange={(e) => setGeneral({ ...general, announcement: e.target.value })}
                      className="w-full border border-gray-300 rounded p-2 text-sm bg-yellow-50 focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Government Identifiers */}
              <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4 border-b pb-2">Government Identifiers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CAGE Code</label>
                    <input
                      type="text"
                      value={general.cageCode}
                      onChange={(e) => setGeneral({ ...general, cageCode: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm font-mono focus:ring-2 focus:ring-navy-900 outline-none"
                      placeholder="e.g. 8H7V2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DUNS Number</label>
                    <input
                      type="text"
                      value={general.dunsNumber}
                      onChange={(e) => setGeneral({ ...general, dunsNumber: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm font-mono focus:ring-2 focus:ring-navy-900 outline-none"
                      placeholder="e.g. 09-882-1234"
                    />
                  </div>
                </div>
              </section>

              {/* Home Page Section */}
              <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4 border-b pb-2">Home Page Hero</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hero Headline</label>
                    <input
                      type="text"
                      value={home.heroTitle}
                      onChange={(e) => setHome({ ...home, heroTitle: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm font-bold text-navy-900 focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
                    <textarea
                      value={home.heroSubtitle}
                      onChange={(e) => setHome({ ...home, heroSubtitle: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Call to Action Button Text</label>
                    <input
                      type="text"
                      value={home.heroCta}
                      onChange={(e) => setHome({ ...home, heroCta: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image</label>
                    <div className="flex gap-6 items-start">
                      <div className="flex-grow space-y-3">
                        <div className="relative border border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer text-center group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleHeroImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="flex flex-col items-center justify-center pointer-events-none group-hover:scale-105 transition-transform">
                            <Upload className="w-6 h-6 text-gray-400 mb-2 group-hover:text-action-600" />
                            <span className="text-sm font-medium text-navy-700">Upload Hero Image</span>
                            <span className="text-xs text-gray-400 mt-1">High Res JPG/PNG (Auto Compressed)</span>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-white px-2 text-xs text-gray-500">or use URL</span>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={home.heroImage}
                          onChange={(e) => setHome({ ...home, heroImage: e.target.value })}
                          className="w-full border border-gray-300 bg-white rounded p-2 text-sm font-mono text-gray-600 focus:ring-2 focus:ring-navy-900 outline-none"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">Preview</span>
                        <div className="w-48 h-32 border border-gray-200 rounded bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm relative">
                          {home.heroImage ? (
                            <img src={home.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4 border-b pb-2">Homepage Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trust Strip Title</label>
                    <input
                      type="text"
                      value={(home as any).trustTitle || ''}
                      onChange={(e) => setHome({ ...home, trustTitle: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Featured Section Title</label>
                    <input
                      type="text"
                      value={(home as any).featuredTitle || ''}
                      onChange={(e) => setHome({ ...home, featuredTitle: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Featured Subtitle</label>
                    <input
                      type="text"
                      value={(home as any).featuredSubtitle || ''}
                      onChange={(e) => setHome({ ...home, featuredSubtitle: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Featured View All Text</label>
                    <input
                      type="text"
                      value={(home as any).featuredViewAllText || ''}
                      onChange={(e) => setHome({ ...home, featuredViewAllText: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Explore Title</label>
                    <input
                      type="text"
                      value={(home as any).exploreTitle || ''}
                      onChange={(e) => setHome({ ...home, exploreTitle: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Explore Subtitle</label>
                    <input
                      type="text"
                      value={(home as any).exploreSubtitle || ''}
                      onChange={(e) => setHome({ ...home, exploreSubtitle: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Why Section Title</label>
                  <input
                    type="text"
                    value={(home as any).whyTitle || ''}
                    onChange={(e) => setHome({ ...home, whyTitle: e.target.value })}
                    className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Why Section Description</label>
                  <textarea
                    rows={3}
                    value={(home as any).whyDescription || ''}
                    onChange={(e) => setHome({ ...home, whyDescription: e.target.value })}
                    className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Why Section Cards</label>
                  <div className="space-y-3">
                    {(((home as any).whyCards) || []).map((c: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={c.title}
                          onChange={(e) => {
                            const arr = ([...((home as any).whyCards || [])]); arr[idx] = { ...arr[idx], title: e.target.value }; setHome({ ...home, whyCards: arr });
                          }}
                          placeholder="Card title"
                          className="border border-gray-300 rounded p-2 text-sm"
                        />
                        <input
                          type="text"
                          value={c.description}
                          onChange={(e) => {
                            const arr = ([...((home as any).whyCards || [])]); arr[idx] = { ...arr[idx], description: e.target.value }; setHome({ ...home, whyCards: arr });
                          }}
                          placeholder="Card description"
                          className="border border-gray-300 rounded p-2 text-sm"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setHome({ ...home, whyCards: [...(((home as any).whyCards) || []), { title: '', description: '' }] })}
                      className="text-sm font-bold text-action-600"
                    >+ Add Card</button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verticals Header Tagline</label>
                    <input
                      type="text"
                      value={(home as any).verticalsHeaderTagline || ''}
                      onChange={(e) => setHome({ ...home, verticalsHeaderTagline: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Public Sector Title</label>
                    <input
                      type="text"
                      value={(home as any).publicSectorTitle || ''}
                      onChange={(e) => setHome({ ...home, publicSectorTitle: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Public Sector Paragraphs</label>
                  <div className="space-y-3">
                    {(((home as any).publicSectorParagraphs) || []).map((t: string, idx: number) => (
                      <textarea
                        key={idx}
                        rows={3}
                        value={t}
                        onChange={(e) => {
                          const arr = ([...(((home as any).publicSectorParagraphs) || [])]); arr[idx] = e.target.value; setHome({ ...home, publicSectorParagraphs: arr });
                        }}
                        className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setHome({ ...home, publicSectorParagraphs: [...(((home as any).publicSectorParagraphs) || []), ''] })}
                      className="text-sm font-bold text-action-600"
                    >+ Add Paragraph</button>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vertical Cards</label>
                  <div className="space-y-3">
                    {(((home as any).verticalCards) || []).map((c: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={c.title}
                          onChange={(e) => {
                            const arr = ([...(((home as any).verticalCards) || [])]); arr[idx] = { ...arr[idx], title: e.target.value }; setHome({ ...home, verticalCards: arr });
                          }}
                          placeholder="Card title"
                          className="border border-gray-300 rounded p-2 text-sm"
                        />
                        <input
                          type="text"
                          value={c.description}
                          onChange={(e) => {
                            const arr = ([...(((home as any).verticalCards) || [])]); arr[idx] = { ...arr[idx], description: e.target.value }; setHome({ ...home, verticalCards: arr });
                          }}
                          placeholder="Card description"
                          className="border border-gray-300 rounded p-2 text-sm"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setHome({ ...home, verticalCards: [...(((home as any).verticalCards) || []), { title: '', description: '' }] })}
                      className="text-sm font-bold text-action-600"
                    >+ Add Vertical Card</button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeSection === 'redirects' && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fadeIn">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-bold text-navy-900">Redirects & URL Mapping</h3>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <button
                    disabled={isUploading}
                    className="bg-navy-900 hover:bg-navy-800 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2 transition disabled:bg-gray-400"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploading ? 'Uploading...' : 'Bulk Upload CSV'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">Define old paths that should redirect to new destinations. Supports patterns like <code>/old/:sku</code> mapping to <code>/product/:sku</code>. Toggle Permanent for 301, otherwise 302.</p>
              <div className="space-y-3">
                {redirects.map((r, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <input
                      value={r.from}
                      onChange={(e) => {
                        const arr = [...redirects]; arr[idx] = { ...arr[idx], from: e.target.value }; setRedirects(arr);
                      }}
                      placeholder="/old/path or /old/:sku"
                      className="md:col-span-5 border border-gray-300 rounded p-2 text-sm font-mono"
                    />
                    <span className="hidden md:block text-center text-gray-400">→</span>
                    <input
                      value={r.to}
                      onChange={(e) => {
                        const arr = [...redirects]; arr[idx] = { ...arr[idx], to: e.target.value }; setRedirects(arr);
                      }}
                      placeholder="/new/path or /product/:sku"
                      className="md:col-span-5 border border-gray-300 rounded p-2 text-sm font-mono"
                    />
                    <label className="md:col-span-1 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!r.permanent}
                        onChange={(e) => {
                          const arr = [...redirects]; arr[idx] = { ...arr[idx], permanent: e.target.checked }; setRedirects(arr);
                        }}
                        className="rounded border-gray-300 text-navy-900 focus:ring-navy-900"
                      />
                      <span className="text-xs text-gray-700">301</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const arr = [...redirects]; arr.splice(idx, 1); setRedirects(arr);
                      }}
                      className="md:col-span-1 text-xs text-red-600 font-bold"
                    >Remove</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setRedirects([...redirects, { from: '', to: '', permanent: true }])}
                  className="text-sm font-bold text-action-600"
                >+ Add Redirect</button>
              </div>
            </section>
          )}

          {activeSection === 'home' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Category Page (Root) Section */}
              <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4 border-b pb-2 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-navy-600" /> Category Page (Root)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Browser Page Title (SEO)</label>
                    <input
                      type="text"
                      value={categoryPage.title}
                      onChange={(e) => setCategoryPage({ ...categoryPage, title: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Headline (H1)</label>
                    <input
                      type="text"
                      value={categoryPage.h1}
                      onChange={(e) => setCategoryPage({ ...categoryPage, h1: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm font-bold text-navy-900 focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intro Text</label>
                    <textarea
                      value={categoryPage.introText}
                      onChange={(e) => setCategoryPage({ ...categoryPage, introText: e.target.value })}
                      rows={4}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <textarea
                      value={categoryPage.description}
                      onChange={(e) => setCategoryPage({ ...categoryPage, description: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Footer Section */}
              <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4 border-b pb-2">Footer Content</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">About Text (Column 1)</label>
                  <textarea
                    value={footer.aboutText}
                    onChange={(e) => setFooter({ ...footer, aboutText: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                    <input
                      type="url"
                      value={footer.social?.facebook || ''}
                      onChange={(e) => setFooter({
                        ...footer,
                        social: { ...(footer.social || {}), facebook: e.target.value }
                      })}
                      placeholder="https://www.facebook.com/yourpage"
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={footer.social?.linkedin || ''}
                      onChange={(e) => setFooter({
                        ...footer,
                        social: { ...(footer.social || {}), linkedin: e.target.value }
                      })}
                      placeholder="https://www.linkedin.com/company/yourcompany"
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter (X) URL</label>
                    <input
                      type="url"
                      value={footer.social?.twitter || ''}
                      onChange={(e) => setFooter({
                        ...footer,
                        social: { ...(footer.social || {}), twitter: e.target.value }
                      })}
                      placeholder="https://twitter.com/yourhandle"
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                    <input
                      type="url"
                      value={footer.social?.instagram || ''}
                      onChange={(e) => setFooter({
                        ...footer,
                        social: { ...(footer.social || {}), instagram: e.target.value }
                      })}
                      placeholder="https://www.instagram.com/yourhandle"
                      className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeSection === 'legal' && (
            <div className="space-y-8 animate-fadeIn">
              <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4 border-b pb-2">Legal & Info Pages</h3>
                <div className="space-y-6">

                  <div>
                    <label className="block text-sm font-bold text-navy-900 mb-1">Privacy Policy Content</label>
                    <p className="text-xs text-gray-500 mb-2">Accepts simple Markdown (## Header, **Bold**, - List).</p>
                    <textarea
                      value={privacyPolicy.content}
                      onChange={(e) => setPrivacyPolicy({ ...privacyPolicy, content: e.target.value })}
                      rows={8}
                      className="w-full border border-gray-300 bg-white rounded p-3 text-sm font-mono focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-navy-900 mb-1">Terms of Sale Content</label>
                    <p className="text-xs text-gray-500 mb-2">Accepts simple Markdown (## Header, **Bold**, - List).</p>
                    <textarea
                      value={termsOfSale.content}
                      onChange={(e) => setTermsOfSale({ ...termsOfSale, content: e.target.value })}
                      rows={8}
                      className="w-full border border-gray-300 bg-white rounded p-3 text-sm font-mono focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-navy-900 mb-1">Terms & Conditions Content</label>
                    <p className="text-xs text-gray-500 mb-2">Accepts simple Markdown (## Header, **Bold**, - List).</p>
                    <textarea
                      value={termsAndConditions.content}
                      onChange={(e) => setTermsAndConditions({ ...termsAndConditions, content: e.target.value })}
                      rows={8}
                      className="w-full border border-gray-300 bg-white rounded p-3 text-sm font-mono focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-navy-900 mb-1">Return Policy Content</label>
                    <p className="text-xs text-gray-500 mb-2">Accepts simple Markdown (## Header, **Bold**, - List).</p>
                    <textarea
                      value={returnPolicy.content}
                      onChange={(e) => setReturnPolicy({ ...returnPolicy, content: e.target.value })}
                      rows={8}
                      className="w-full border border-gray-300 bg-white rounded p-3 text-sm font-mono focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-navy-900 mb-1">About Us Page Content</label>
                    <p className="text-xs text-gray-500 mb-2">Accepts simple Markdown (## Header, **Bold**, - List).</p>
                    <textarea
                      value={aboutPage.content}
                      onChange={(e) => setAboutPage({ ...aboutPage, content: e.target.value })}
                      rows={8}
                      className="w-full border border-gray-300 bg-white rounded p-3 text-sm font-mono focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-navy-900 mb-1">Contact Us Page Content</label>
                    <p className="text-xs text-gray-500 mb-2">Accepts simple Markdown (## Header, **Bold**, - List). Contact info in General settings also appears on the page.</p>
                    <textarea
                      value={contactPage.content}
                      onChange={(e) => setContactPage({ ...contactPage, content: e.target.value })}
                      rows={8}
                      className="w-full border border-gray-300 bg-white rounded p-3 text-sm font-mono focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-navy-900 mb-1">Warranty Page Content</label>
                    <p className="text-xs text-gray-500 mb-2">Accepts simple Markdown (## Header, **Bold**, - List).</p>
                    <textarea
                      value={warrantyPage.content}
                      onChange={(e) => setWarrantyPage({ ...warrantyPage, content: e.target.value })}
                      rows={8}
                      className="w-full border border-gray-300 bg-white rounded p-3 text-sm font-mono focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-navy-900 mb-1">Sitemap Page Intro</label>
                    <p className="text-xs text-gray-500 mb-2">Intro text displayed above the generated category tree.</p>
                    <textarea
                      value={sitemapSettings.introText}
                      onChange={(e) => setSitemapSettings({ ...sitemapSettings, introText: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 bg-white rounded p-3 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    />
                  </div>

                </div>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ContentEditor;
