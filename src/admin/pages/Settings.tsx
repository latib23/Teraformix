
import React, { useState, useEffect } from 'react';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { Save, Loader2, Globe, Image as ImageIcon, Upload, Check, Layout, CreditCard, Server, Moon, Shield } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';

const Settings = () => {
  const { content, updateContent } = useGlobalContent();
  const [settings, setSettings] = useState({
    siteTitle: '',
    favicon: '',
    faviconDarkUrl: '',
    logoUrl: '',
    logoText: '',
    activeTheme: 'none' as 'none' | 'christmas' | 'new_year'
  });

  const [payment, setPayment] = useState({
    stripePublicKey: '',
    enablePO: true,
    enableBankTransfer: false,
    bankInstructions: '',
  });

  const [security, setSecurity] = useState<{
    allowPkIp: string;
    allowedIps: string[];
  }>({
    allowPkIp: '',
    allowedIps: []
  });

  const [geminiKey, setGeminiKey] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [homeLogos, setHomeLogos] = useState<Array<{ image: string; alt?: string; url?: string }>>(((content.home as any)?.partnerLogos) || []);
  const [paymentLogos, setPaymentLogos] = useState<Array<{ image: string; alt?: string }>>(((content.footer as any)?.paymentLogos) || []);

  // Sync content to local state
  useEffect(() => {
    if (content.settings) {
      setSettings({
        siteTitle: content.settings.siteTitle || '',
        favicon: content.settings.favicon || '',
        faviconDarkUrl: content.settings.faviconDarkUrl || '',
        logoUrl: content.settings.logoUrl || '',
        logoText: content.settings.logoText || 'SERVER TECH CENTRAL',
        activeTheme: content.settings.activeTheme || 'none'
      });
    }
    if (content.payment) {
      setPayment({
        stripePublicKey: content.payment.stripePublicKey || '',
        enablePO: !!content.payment.enablePO,
        enableBankTransfer: !!content.payment.enableBankTransfer,
        bankInstructions: content.payment.bankInstructions || '',
      });
    }

    if ((content as any).security) {
      setSecurity({
        allowPkIp: (content as any).security.allowPkIp || '',
        allowedIps: (content as any).security.allowedIps || []
      });
    }

    let storedKey = '';
    try { storedKey = localStorage.getItem('stc_gemini_api_key') || ''; } catch (_e) { void _e; }
    setGeminiKey(storedKey);
    setHomeLogos(((content.home as any)?.partnerLogos) || []);
    setPaymentLogos(((content.footer as any)?.paymentLogos) || []);
  }, [content.settings, content.payment]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      try { localStorage.setItem('stc_gemini_api_key', geminiKey); } catch (_e) { void _e; }

      await updateContent({
        settings,
        payment,
        security,
        home: { partnerLogos: homeLogos } as any,
        footer: { paymentLogos } as any
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      setSaveSuccess(true);

      // Reset success message
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("An error occurred while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'favicon' | 'faviconDarkUrl' | 'logoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Small icons can use stricter size (200px), logos (400px)
        const maxWidth = (field === 'favicon' || field === 'faviconDarkUrl') ? 200 : 400;
        const base64 = await compressImage(file, maxWidth, 0.8);
        setSettings(prev => ({ ...prev, [field]: base64 }));
      } catch (error) {
        console.error("Image compression failed", error);
        alert("Failed to process image. Please try another file.");
      }
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-navy-900">System Settings</h3>
          <p className="text-sm text-gray-500">Manage global site configuration.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-2 rounded shadow flex items-center gap-2 font-bold transition ${saveSuccess ? 'bg-green-600 text-white' : 'bg-action-600 hover:bg-action-500 disabled:bg-gray-400 text-white'}`}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-8 pb-12">

        {/* Backend Connection */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-md font-bold text-navy-900 mb-4 flex items-center gap-2 border-b pb-2">
            <Server className="w-4 h-4 text-navy-600" /> Backend Connection
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none font-mono"
                placeholder="AIza..."
              />
              <p className="text-xs text-gray-500 mt-2">Stored securely in browser local storage for admin AI features.</p>
            </div>
          </div>
        </section>

        {/* Security Controls */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-md font-bold text-navy-900 mb-4 flex items-center gap-2 border-b pb-2">
            <Shield className="w-4 h-4 text-navy-600" /> Security Controls
          </h3>
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Restricting access by IP will block all Admin and Sales logins from unauthorized locations.
                Ensure your current IP is added before saving, or you may lock yourself out.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legacy Whitelist IP</label>
                <input
                  type="text"
                  value={security.allowPkIp}
                  onChange={(e) => setSecurity(prev => ({ ...prev, allowPkIp: e.target.value }))}
                  className="w-full border border-gray-300 bg-white rounded p-2 text-sm font-mono"
                  placeholder="e.g., 203.0.113.5"
                />
                <p className="text-xs text-gray-500 mt-1">Legacy single IP field. Valid alongside the list below.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin/Sales Whitelisted IPs</label>
                <div className="space-y-3">
                  {security.allowedIps.map((ip, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ip}
                        onChange={(e) => {
                          const newIps = [...security.allowedIps];
                          newIps[idx] = e.target.value;
                          setSecurity(prev => ({ ...prev, allowedIps: newIps }));
                        }}
                        placeholder="e.g., 203.0.113.5"
                        className="flex-1 border border-gray-300 bg-white rounded p-2 text-sm font-mono"
                      />
                      <button
                        onClick={() => {
                          const newIps = [...security.allowedIps];
                          newIps.splice(idx, 1);
                          setSecurity(prev => ({ ...prev, allowedIps: newIps }));
                        }}
                        className="text-xs text-red-600 font-bold hover:text-red-800"
                      >Remove</button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSecurity(prev => ({ ...prev, allowedIps: [...prev.allowedIps, ''] }))}
                    className="text-sm font-bold text-action-600 hover:text-action-700"
                  >+ Add IP Address</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Theme Configuration */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-md font-bold text-navy-900 mb-4 flex items-center gap-2 border-b pb-2">
            <ImageIcon className="w-4 h-4 text-navy-600" /> Theme Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">Select Active Theme</h4>
              <div className="flex flex-col space-y-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-navy-600 focus:ring-navy-500 h-4 w-4"
                    name="theme"
                    value="none"
                    checked={(!settings.activeTheme || settings.activeTheme === 'none')}
                    onChange={() => setSettings({ ...settings, activeTheme: 'none' })}
                  />
                  <span className="ml-2 text-sm text-gray-700">None (Standard)</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-navy-600 focus:ring-navy-500 h-4 w-4"
                    name="theme"
                    value="christmas"
                    checked={settings.activeTheme === 'christmas'}
                    onChange={() => setSettings({ ...settings, activeTheme: 'christmas' })}
                  />
                  <span className="ml-2 text-sm text-gray-700">Christmas (Snow + Lights + Santa Hat)</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-navy-600 focus:ring-navy-500 h-4 w-4"
                    name="theme"
                    value="new_year"
                    checked={settings.activeTheme === 'new_year'}
                    onChange={() => setSettings({ ...settings, activeTheme: 'new_year' })}
                  />
                  <span className="ml-2 text-sm text-gray-700">New Year (Fireworks + Celebration)</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">Changes apply immediately upon saving.</p>
            </div>
          </div>
        </section>

        {/* Logos Management */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-md font-bold text-navy-900 mb-4 flex items-center gap-2 border-b pb-2">
            <ImageIcon className="w-4 h-4 text-navy-600" /> Logos Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-bold text-navy-900 mb-2">Homepage Partner Logos</h4>
              <div className="space-y-3">
                {homeLogos.map((logo, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <input
                      type="text"
                      value={logo.image}
                      onChange={(e) => {
                        const arr = [...homeLogos];
                        arr[idx] = { ...arr[idx], image: e.target.value };
                        setHomeLogos(arr);
                      }}
                      placeholder="Image URL"
                      className="border border-gray-300 bg-white rounded p-2 text-sm font-mono"
                    />
                    <input
                      type="text"
                      value={logo.alt || ''}
                      onChange={(e) => {
                        const arr = [...homeLogos];
                        arr[idx] = { ...arr[idx], alt: e.target.value };
                        setHomeLogos(arr);
                      }}
                      placeholder="Alt text"
                      className="border border-gray-300 bg-white rounded p-2 text-sm"
                    />
                    <input
                      type="text"
                      value={logo.url || ''}
                      onChange={(e) => {
                        const arr = [...homeLogos];
                        arr[idx] = { ...arr[idx], url: e.target.value };
                        setHomeLogos(arr);
                      }}
                      placeholder="Target URL"
                      className="border border-gray-300 bg-white rounded p-2 text-sm font-mono"
                    />
                    <div className="md:col-span-3">
                      <button
                        onClick={() => {
                          const arr = [...homeLogos];
                          arr.splice(idx, 1);
                          setHomeLogos(arr);
                        }}
                        className="text-xs text-red-600 font-bold"
                      >Remove</button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setHomeLogos([...homeLogos, { image: '', alt: '', url: '' }])}
                  className="text-sm font-bold text-action-600"
                >+ Add Partner Logo</button>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-navy-900 mb-2">Footer Payment Logos</h4>
              <div className="space-y-3">
                {paymentLogos.map((logo, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={logo.image}
                      onChange={(e) => {
                        const arr = [...paymentLogos];
                        arr[idx] = { ...arr[idx], image: e.target.value };
                        setPaymentLogos(arr);
                      }}
                      placeholder="Image URL"
                      className="flex-1 border border-gray-300 bg-white rounded p-2 text-sm font-mono"
                    />
                    <input
                      type="text"
                      value={logo.alt || ''}
                      onChange={(e) => {
                        const arr = [...paymentLogos];
                        arr[idx] = { ...arr[idx], alt: e.target.value };
                        setPaymentLogos(arr);
                      }}
                      placeholder="Alt text"
                      className="w-48 border border-gray-300 bg-white rounded p-2 text-sm"
                    />
                    <button
                      onClick={() => {
                        const arr = [...paymentLogos];
                        arr.splice(idx, 1);
                        setPaymentLogos(arr);
                      }}
                      className="text-xs text-red-600 font-bold"
                    >Remove</button>
                  </div>
                ))}
                <button
                  onClick={() => setPaymentLogos([...paymentLogos, { image: '', alt: '' }])}
                  className="text-sm font-bold text-action-600"
                >+ Add Payment Logo</button>
              </div>
            </div>
          </div>
        </section>

        {/* Branding Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-md font-bold text-navy-900 mb-4 flex items-center gap-2 border-b pb-2">
            <Globe className="w-4 h-4 text-navy-600" /> General Branding
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Title (Browser Tab)</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={settings.siteTitle}
                  onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                  className="flex-grow border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                  placeholder="Server Tech Central"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">This appears in Google Search results and browser tabs.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Favicon (Standard)</label>
              <div className="flex gap-6 items-start">

                {/* Upload Control */}
                <div className="flex-grow space-y-3">

                  {/* File Upload */}
                  <div className="relative border border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer text-center group">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/x-icon, image/svg+xml"
                      onChange={(e) => handleFileUpload(e, 'favicon')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6 text-gray-400 mb-2 group-hover:text-action-600" />
                      <span className="text-sm font-medium text-navy-700">Click to upload image</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, ICO, or JPG (Auto Compressed)</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={settings.favicon}
                    onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                    className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none font-mono text-gray-600"
                    placeholder="https://example.com/icon.png"
                  />
                </div>

                {/* Preview */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">Preview</span>
                  <div className="w-16 h-16 border border-gray-200 rounded bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm">
                    {settings.favicon ? (
                      <img src={settings.favicon} alt="Preview" className="w-10 h-10 object-contain" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Moon className="w-4 h-4 text-navy-600" />
                Favicon (Dark Mode)
              </label>
              <p className="text-xs text-gray-500 mb-2">Optional. Displayed on browser tabs when the user's system is in Dark Mode.</p>

              <div className="flex gap-6 items-start">
                <div className="flex-grow space-y-3">
                  <div className="relative border border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer text-center group">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/x-icon, image/svg+xml"
                      onChange={(e) => handleFileUpload(e, 'faviconDarkUrl')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6 text-gray-400 mb-2 group-hover:text-action-600" />
                      <span className="text-sm font-medium text-navy-700">Upload Dark Mode Icon</span>
                      <span className="text-xs text-gray-400 mt-1">Optimized for dark tabs</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={settings.faviconDarkUrl}
                    onChange={(e) => setSettings({ ...settings, faviconDarkUrl: e.target.value })}
                    className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none font-mono text-gray-600"
                    placeholder="https://example.com/icon-dark.png"
                  />

                  {settings.faviconDarkUrl && (
                    <button
                      onClick={() => setSettings({ ...settings, faviconDarkUrl: '' })}
                      className="text-xs text-red-600 hover:text-red-800 font-medium underline"
                    >
                      Remove Dark Favicon
                    </button>
                  )}
                </div>

                {/* Preview Dark Mode */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">Dark Preview</span>
                  <div className="w-16 h-16 border border-navy-700 rounded bg-navy-900 flex items-center justify-center overflow-hidden shadow-sm">
                    {settings.faviconDarkUrl ? (
                      <img src={settings.faviconDarkUrl} alt="Favicon Dark Preview" className="w-10 h-10 object-contain" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Logo Configuration */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-md font-bold text-navy-900 mb-4 flex items-center gap-2 border-b pb-2">
            <Layout className="w-4 h-4 text-navy-600" /> Logo Configuration
          </h3>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo Text (Fallback / Alt Text)</label>
              <input
                type="text"
                value={settings.logoText}
                onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
                className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                placeholder="SERVER TECH CENTRAL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website Logo</label>
              <div className="flex gap-6 items-start">

                <div className="flex-grow space-y-3">
                  <div className="relative border border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer text-center group">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={(e) => handleFileUpload(e, 'logoUrl')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6 text-gray-400 mb-2 group-hover:text-action-600" />
                      <span className="text-sm font-medium text-navy-700">Upload Logo</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG, or SVG</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none font-mono text-gray-600"
                    placeholder="https://example.com/logo.png"
                  />

                  {settings.logoUrl && (
                    <button
                      onClick={() => setSettings({ ...settings, logoUrl: '' })}
                      className="text-xs text-red-600 hover:text-red-800 font-medium underline"
                    >
                      Remove Logo Image (Use Text)
                    </button>
                  )}
                </div>

                {/* Preview */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">Header Preview</span>
                  <div className="w-48 h-16 border border-gray-200 rounded bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm p-2">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo Preview" className="h-full object-contain" />
                    ) : (
                      <span className="text-navy-900 font-bold text-xs">{settings.logoText || 'Logo Text'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Payment Configuration */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-md font-bold text-navy-900 mb-4 flex items-center gap-2 border-b pb-2">
            <CreditCard className="w-4 h-4 text-navy-600" /> Payment Gateway (Stripe)
          </h3>

          <div className="space-y-6">
            <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100 flex items-start gap-2">
              <div className="mt-0.5"><CreditCard className="w-4 h-4" /></div>
              <div>
                <p className="font-bold">Stripe Integration</p>
                <p className="text-xs mt-1">Enter your API keys below to enable credit card processing on the checkout page.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key (pk_test_...)</label>
              <input
                type="text"
                value={payment.stripePublicKey}
                onChange={(e) => setPayment({ ...payment, stripePublicKey: e.target.value })}
                className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none font-mono"
                placeholder="pk_test_..."
              />
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500">
              <span className="font-bold">Note:</span> The Stripe Secret Key must be configured on the backend server environment variables (STRIPE_SECRET_KEY) for security reasons. It is no longer managed via this frontend panel.
            </div>
          </div>
        </section>

        {/* Payment Options */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-md font-bold text-navy-900 mb-4 flex items-center gap-2 border-b pb-2">
            <CreditCard className="w-4 h-4 text-navy-600" /> Payment Options
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Enable Purchase Order (Net 30)</label>
              <input type="checkbox" checked={!!payment.enablePO} onChange={(e) => setPayment(prev => ({ ...prev, enablePO: e.target.checked }))} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Enable Bank Transfer (Wire/ACH)</label>
                <input type="checkbox" checked={!!payment.enableBankTransfer} onChange={(e) => setPayment(prev => ({ ...prev, enableBankTransfer: e.target.checked }))} />
                <span className="text-xs text-orange-600 font-medium ml-2 flex items-center bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                  Auto-disables in 10 minutes
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Transfer Instructions</label>
                <textarea
                  value={payment.bankInstructions}
                  onChange={(e) => setPayment(prev => ({ ...prev, bankInstructions: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 bg-white rounded p-2 text-sm focus:ring-2 focus:ring-navy-900 outline-none font-mono"
                  placeholder={`Beneficiary: Server Tech Central Inc.\nBank: Example Bank\nAccount: 123456789\nRouting: 012345678\nSWIFT: EXAMPUS3M`}
                />
                <p className="text-xs text-gray-500 mt-1">Shown during checkout when Bank Transfer is enabled.</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Settings;
