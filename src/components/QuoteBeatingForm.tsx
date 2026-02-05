import React, { useState, useRef } from 'react';
import { Upload, DollarSign, CheckCircle, AlertCircle, FileText, X } from 'lucide-react';
import { fetchJson } from '../lib/api';
import { useRecaptcha } from '../hooks/useRecaptcha';

const QuoteBeatingForm = ({ productName }: { productName?: string }) => {
  const { execute: executeRecaptcha } = useRecaptcha();
  const [activeTab, setActiveTab] = useState<'price' | 'upload'>('upload');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    competitorPrice: '',
    partNumber: productName || '',
    notes: '',
  });
  const [file, setFile] = useState<{ name: string; content: string } | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFile({
          name: selectedFile.name,
          content: reader.result as string
        });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'upload' && !file) {
      setStatus('error');
      setErrorMessage('Please upload a quote file.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const recaptchaToken = await executeRecaptcha('beat_quote');

      const payload = {
        ...formData,
        fileName: file?.name,
        fileContent: file?.content,
        recaptchaToken, // Include token
        // Include product name in submission if needed, currently partNumber is used
      };

      await fetchJson('/quotes/request/beat-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        competitorPrice: '',
        partNumber: '',
        notes: '',
      });
      setFile(null);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-navy-900 mb-2">Request Received!</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          We've received your request{productName ? ` for ${productName}` : ''}. Our team is reviewing the details and will get back to you with our best price shortly.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-action-600 font-medium hover:text-action-700 underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-action-500 overflow-hidden">
      <div className="bg-action-600 px-6 py-4 text-white">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Got a Better Quote? We'll Beat It!
        </h3>
        <p className="text-action-100 text-sm mt-1">
          {productName ? <span className="font-semibold block mb-1">For: {productName}</span> : null}
          Upload your competitor's quote or tell us their price. We guarantee to match or beat valid quotes.
        </p>
      </div>

      <div className="p-6">
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'upload'
              ? 'text-action-600 border-b-2 border-action-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Upload Quote File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('price')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'price'
              ? 'text-action-600 border-b-2 border-action-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Enter Competitor Price
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full rounded-lg border-gray-300 focus:border-action-500 focus:ring-action-500 sm:text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="company"
                required
                value={formData.company}
                onChange={handleInputChange}
                className="w-full rounded-lg border-gray-300 focus:border-action-500 focus:ring-action-500 sm:text-sm"
                placeholder="Company Inc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-lg border-gray-300 focus:border-action-500 focus:ring-action-500 sm:text-sm"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full rounded-lg border-gray-300 focus:border-action-500 focus:ring-action-500 sm:text-sm"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {activeTab === 'upload' ? (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Quote (PDF, Excel, Image) <span className="text-red-500">*</span></label>
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <span className="relative cursor-pointer rounded-md font-medium text-action-600 hover:text-action-500 focus-within:outline-none">
                        Upload a file
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG, XLS up to 10MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="fileUpload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-action-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-gray-500">Ready to upload</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="partNumber"
                  required={activeTab === 'price'}
                  value={formData.partNumber}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-gray-300 focus:border-action-500 focus:ring-action-500 sm:text-sm"
                  placeholder="e.g. 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competitor Price / Offer <span className="text-red-500">*</span></label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    name="competitorPrice"
                    required={activeTab === 'price'}
                    value={formData.competitorPrice}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 pl-7 focus:border-action-500 focus:ring-action-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Please include shipping if applicable.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full rounded-lg border-gray-300 focus:border-action-500 focus:ring-action-500 sm:text-sm"
              placeholder="Any specific requirements or details..."
            />
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-action-600 hover:bg-action-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Challenge'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuoteBeatingForm;
