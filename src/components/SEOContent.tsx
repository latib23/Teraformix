import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SEOContent = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: "What is the lead time for backordered servers?", a: "Typically, backordered specific configurations ship within 7-10 business days. Expedited sourcing is available via our Concierge service." },
    { q: "Do you offer net terms for enterprise clients?", a: "Yes, we offer Net 30 terms to qualified educational, government, and corporate entities upon credit approval." },
    { q: "Are these drives compatible with my existing array?", a: "Our technical specialists can verify compatibility with your specific RAID controller or SAN chassis before purchase." }
  ];

  return (
    <div className="bg-white border-t border-gray-200 mt-12 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold text-navy-900 mb-6">Enterprise Grade Hardware Solutions</h1>
        <div className="prose prose-slate max-w-none text-gray-600 mb-10">
          <p>
            Server Tech Central provides industry-leading infrastructure hardware for data centers, cloud providers, and enterprise IT environments. 
            We specialize in rapid deployment of mission-critical assets from top manufacturers like Dell EMC, HPE, Cisco, and Seagate. 
            Whether you are scaling a hyper-converged cluster or maintaining legacy systems, our inventory strategy ensures high availability.
          </p>
          <p>
            Our certified engineers verify every component, ensuring that refurbished and new-open-box equipment meets the stringent reliability standards required for 24/7 operations.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-navy-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                <button 
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 text-left transition"
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                >
                  <span className="font-semibold text-navy-800">{faq.q}</span>
                  {openIndex === idx ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {openIndex === idx && (
                  <div className="p-4 bg-white text-gray-600 text-sm border-t border-gray-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOContent;