import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ShieldCheck, Truck, RefreshCw, FileText } from 'lucide-react';
import { useGlobalContent } from '../../contexts/GlobalContent';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEOHead from '../../components/SEO/SEOHead';

const WarrantyPage = () => {
    useEffect(() => {
        console.log('WarrantyPage Mounted');
        window.scrollTo(0, 0);
    }, []);

    const { content } = useGlobalContent();
    const warrantyContent = content.warrantyPage?.content;

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow py-12">
<div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="text-center mb-12">
                        <ShieldCheck className="w-16 h-16 text-action-600 mx-auto mb-4" />
                        <h1 className="text-3xl font-extrabold text-navy-900 sm:text-4xl">
                            Warranty & Return Policy
                        </h1>
                        <p className="mt-4 text-lg text-gray-600">
                            We stand behind every piece of hardware we sell.
                        </p>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                        <div className="p-8 prose prose-blue max-w-none">
                            {warrantyContent ? (
                                <ReactMarkdown>{warrantyContent}</ReactMarkdown>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <p>Loading policy details...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Summary Grid (Static Highlights) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                            <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-6 h-6 text-action-600" />
                            </div>
                            <h3 className="font-bold text-navy-900 mb-2">3-Year Warranty</h3>
                            <p className="text-sm text-gray-600">Standard on all refurbished enterprise hardware.</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                            <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Truck className="w-6 h-6 text-action-600" />
                            </div>
                            <h3 className="font-bold text-navy-900 mb-2">Advanced Replacement</h3>
                            <p className="text-sm text-gray-600">We ship replacement parts before you return the defective unit.</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                            <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <RefreshCw className="w-6 h-6 text-action-600" />
                            </div>
                            <h3 className="font-bold text-navy-900 mb-2">30-Day Returns</h3>
                            <p className="text-sm text-gray-600">Hassle-free returns with restocking fee for non-defective items.</p>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default WarrantyPage;
