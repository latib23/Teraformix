
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Upload, FileText, AlertCircle, Loader2, Send, File as FileIcon, X } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';
import { auth } from '../../lib/auth';
import { api } from '../../lib/api';

const UploadBOMPage = () => {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill if logged in
  useEffect(() => {
    const user = auth.getUser();
    if (user.email) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email
      }));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validMimeTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/pdf',
        'application/x-pdf'
      ];
      const validExtensions = ['csv', 'xls', 'xlsx', 'pdf'];
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      const isValid = validMimeTypes.includes(selectedFile.type) || (extension && validExtensions.includes(extension));

      // Limit file size for API
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB Limit
        alert('File is too large. Please upload a file under 5MB.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (isValid) {
        setFile(selectedFile);
        showToast('File attached successfully', 'success');
      } else {
        alert('Invalid file format. Please upload an Excel sheet (.xls, .xlsx), CSV, or PDF file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    setIsSubmitting(true);

    try {
      const readFileAsDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(f);
      });

      const dataUrl = await readFileAsDataUrl(file);

      const payload = {
        ...formData,
        fileName: file.name,
        fileContent: dataUrl
      };

      const response = await api.post<{ referenceNumber: string }>('/quotes/request/bom', payload);
      const quoteNumber = response?.referenceNumber || 'SUBMITTED';

      const g = (window as any).gtag;
      if (g) {
        const adsId = String((import.meta as any).env?.VITE_GOOGLE_ADS_ID || '');
        const leadLabel = String((import.meta as any).env?.VITE_GOOGLE_ADS_LEAD_LABEL || '');
        if (adsId && leadLabel) {
          g('event', 'conversion', { send_to: `${adsId}/${leadLabel}` });
        }
        try { g('event', 'generate_lead', { method: 'upload_bom' }); } catch { }
      }
      try { const conv = (window as any).gtag_report_conversion; if (conv) conv(); } catch { }
      try {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
          event: 'quote_submit',
          method: 'upload_bom',
          email: formData.email || '',
          file_name: file.name,
        });
      } catch { }

      // NOTE: In a real app, you would upload the file to a presigned S3 URL
      // returned from the first API call. For this demo, we assume the backend handles it.

      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('lastQuoteNumber', quoteNumber);
        }
      } catch (e) {
        console.warn('Storage access restricted', e);
      }
      navigate(`/thank-you?quote=${quoteNumber}`, {
        state: { quoteNumber }
      });

    } catch (error) {
      console.error("Upload Error:", error);
      showToast('Failed to upload BOM. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handler = () => {
      try {
        const hasData = formData.email || formData.name || file?.name;
        if (!hasData) return;
        const payload = {
          type: 'FORM',
          source: 'upload-bom',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          notes: formData.notes,
        };
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/quotes/abandon', blob);
      } catch { /* ignore */ }
    };
    window.addEventListener('beforeunload', handler);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handler();
    });
    return () => window.removeEventListener('beforeunload', handler);
  }, [formData, file]);

  const handleDownloadTemplate = () => {
    const headers = ['Part Number', 'Quantity', 'Manufacturer (Optional)', 'Notes (Optional)'];
    const exampleRow = ['R740-XEON-GOLD', '10', 'Dell', 'Need rails for 19-inch rack'];

    const csvContent = [
      headers.join(','),
      exampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'BOM_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return <FileIcon className="w-8 h-8 text-red-500" />;
    }
    return <FileText className="w-8 h-8 text-green-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Upload Bill of Materials</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Streamline your procurement. Upload your parts list, and let our automated system match SKUs and generate a volume quote for you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Form */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 mb-6">
                  <div className="bg-white p-2 rounded-full h-fit shadow-sm">
                    <FileText className="w-5 h-5 text-action-600" />
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">Supported Formats</p>
                    <p>We accept <strong>.XLS, .XLSX, .CSV, and .PDF</strong> files. Ensure your document includes Part Numbers (MPN) and Quantities.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                      placeholder="Enterprise Corp"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                      placeholder="procurement@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 bg-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upload File <span className="text-red-500">*</span></label>
                  <div className={`w-full border-2 border-dashed rounded-xl transition-all overflow-hidden relative ${file ? 'border-action-500 bg-action-50 p-4' : 'border-gray-300 hover:border-navy-400 hover:bg-gray-50 py-12 px-6 text-center'}`}>
                    <input
                      type="file"
                      id="bom-upload"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".csv, .xls, .xlsx, .pdf, application/pdf, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleFileChange}
                    />

                    {!file ? (
                      <label htmlFor="bom-upload" className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                        <div className="w-14 h-14 bg-navy-100 text-navy-600 rounded-full flex items-center justify-center mb-3 flex-shrink-0">
                          <Upload className="w-7 h-7" />
                        </div>
                        <span className="text-navy-900 font-bold text-base">Click to upload or drag and drop</span>
                        <span className="text-sm text-gray-500 mt-2">Excel, CSV, or PDF (Max 5MB)</span>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0 bg-white p-2 rounded-lg border border-action-100 shadow-sm">
                            {getFileIcon(file.name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-navy-900 text-sm truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>

                        <button
                          onClick={handleRemoveFile}
                          className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove file"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {file && (
                    <div className="mt-2 text-right">
                      <label htmlFor="bom-upload" className="text-xs text-action-600 font-bold hover:underline cursor-pointer">Replace File</label>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Special Requirements</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 bg-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-navy-900 outline-none"
                    placeholder="E.g. Need delivery by Friday, prefer New Retail packaging..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="w-full bg-navy-900 hover:bg-navy-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-lg transition transform active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {isSubmitting ? 'Transmitting Securely...' : 'Submit BOM for Quote'}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Your data is encrypted and sent directly to our secure sales server.
                </p>

              </form>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-action-600" />
                  Process Overview
                </h3>
                <div className="relative border-l-2 border-navy-100 pl-6 ml-2 space-y-8 py-2">
                  <div className="relative">
                    <span className="absolute -left-[31px] bg-navy-900 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                    <h4 className="font-bold text-sm text-navy-900">Upload & Match</h4>
                    <p className="text-xs text-gray-500 mt-1">Our system scans your file for MPNs against our 500k+ SKU inventory.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] bg-navy-900 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                    <h4 className="font-bold text-sm text-navy-900">Price Optimization</h4>
                    <p className="text-xs text-gray-500 mt-1">Account managers apply volume discounts and check global stock.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] bg-navy-900 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                    <h4 className="font-bold text-sm text-navy-900">Quote Delivery</h4>
                    <p className="text-xs text-gray-500 mt-1">You receive a formal PDF quote with lead times via email.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-navy-900 to-navy-800 text-white p-6 rounded-xl shadow-lg">
                <h3 className="font-bold mb-2">Need a Template?</h3>
                <p className="text-sm text-gray-300 mb-4">Use our standardized Excel template for faster processing and fewer errors.</p>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Download Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UploadBOMPage;
