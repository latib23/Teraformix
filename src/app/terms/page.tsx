
import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useGlobalContent } from '../../contexts/GlobalContent';
import SEOHead from '../../components/SEO/SEOHead';

const TermsOfSalePage = () => {
  const { content } = useGlobalContent();
  
  const text = content.termsOfSale?.content || 
    "## Terms of Sale\n\nInformation not available. Please contact support.";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEOHead 
        title="Terms of Sale | Teraformix"
        description="Review our terms of sale, warranty information, and return policies."
        canonicalUrl="https://teraformix.com/terms"
      />
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-14xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold text-navy-900 mb-8 pb-4 border-b border-gray-100">Terms of Sale</h1>
          
          <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed">
             {text.split('\n').map((line, i) => {
                 if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-navy-800 mt-6 mb-3">{line.replace('## ', '')}</h2>;
                 if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-navy-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                 if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.replace('- ', '')}</li>;
                 if (line.trim() === '') return <br key={i} />;
                 
                 const parts = line.split(/(\*\*.*?\*\*)/g);
                 return (
                    <p key={i} className="mb-2">
                        {parts.map((part, idx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={idx}>{part.slice(2, -2)}</strong>;
                            }
                            return part;
                        })}
                    </p>
                 );
             })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfSalePage;
