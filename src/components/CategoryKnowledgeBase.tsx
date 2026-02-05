import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const CategoryKnowledgeBase = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is the difference between SAS and SATA drives for enterprise storage?",
      answer: "Serial Attached SCSI (SAS) drives are designed for mission-critical enterprise workloads requiring high availability, error correction, and faster data transfer rates (up to 12Gb/s). SATA drives are typically cost-effective for bulk storage and backups but run at lower speeds (6Gb/s) with lower duty cycles."
    },
    {
      question: "Do you offer warranty on refurbished servers?",
      answer: "Yes, all refurbished servers from Teraformix undergo a rigorous 28-point QA testing process and come with a standard 3-Year Advanced Replacement Warranty. We also offer extended warranties up to 5 years."
    },
    {
      question: "How fast can you ship a custom configuration?",
      answer: "We stock components on-site. Most custom build-to-order (BTO) servers are assembled, tested, and shipped within 24-48 hours. Rush assembly services are available for same-day shipping on orders placed before 12 PM EST."
    },
    {
      question: "Do you support Net 30 purchase orders?",
      answer: "Absolutely. We specialize in B2B procurement and accept Net 30 Purchase Orders from government agencies, educational institutions, and qualified corporations upon credit approval."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  };

  return (
    <div className="bg-white border-t border-gray-200 mt-16 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container mx-auto px-4 max-w-14xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Article Content */}
          <div className="lg:col-span-2 prose prose-slate max-w-none">
            <h2 className="text-2xl font-bold text-navy-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-8 bg-action-500 rounded-full inline-block"></span>
              Comprehensive Guide to Enterprise Hardware Procurement
            </h2>
            
            <article className="text-gray-600 space-y-4 leading-relaxed">
              <p>
                Navigating the complex landscape of enterprise hardware procurement requires a deep understanding of workload requirements, scalability, and total cost of ownership (TCO). At Teraformix, we bridge the gap between legacy infrastructure and next-generation data center solutions.
              </p>
              
              <h3 className="text-lg font-bold text-navy-800 mt-6">Optimizing for Workload Performance</h3>
              <p>
                When selecting servers for virtualization, database management, or high-performance computing (HPC), the balance between CPU cores, clock speed, and memory density is critical. For instance, the <strong>Dell PowerEdge</strong> and <strong>HPE ProLiant</strong> lines offer distinct advantages in modularity. A high-frequency processor might benefit a financial trading platform, whereas a high core-count setup is ideal for VDI (Virtual Desktop Infrastructure) deployments.
              </p>

              <h3 className="text-lg font-bold text-navy-800 mt-6">Storage: Throughput vs. Capacity</h3>
              <p>
                The shift from spinning media to flash storage has transformed data center architecture. However, spinning disk (HDD) remains the king of cost-per-terabyte for archival and cold storage. We recommend a tiered storage strategy: utilize <strong>NVMe SSDs</strong> for caching and hot data, <strong>SAS SSDs</strong> for active workloads, and high-capacity <strong>Nearline SAS HDDs</strong> for object storage and backups.
              </p>

              <h3 className="text-lg font-bold text-navy-800 mt-6">The Refurbished Advantage</h3>
              <p>
                Sustainable IT is not just a buzzword; it is a financial strategy. Certified refurbished hardware allows enterprises to extend the lifecycle of their infrastructure without sacrificing reliability. By adhering to OEM specifications and utilizing rigorous stress-testing, our refurbished inventory provides 99.999% uptime reliability at a fraction of the list price.
              </p>
            </article>
          </div>

          {/* FAQ Accordion */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 sticky top-24">
              <div className="flex items-center gap-2 mb-6 text-navy-900">
                <HelpCircle className="w-5 h-5 text-action-600" />
                <h3 className="text-xl font-bold">Frequently Asked Questions</h3>
              </div>
              
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <button 
                      className="w-full flex items-center justify-between p-4 text-left transition hover:bg-gray-50"
                      onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                      aria-expanded={openIndex === idx}
                    >
                      <span className="font-semibold text-sm text-navy-900 pr-4">{faq.question}</span>
                      {openIndex === idx ? (
                        <ChevronUp className="w-4 h-4 text-action-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {openIndex === idx && (
                      <div className="p-4 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-100 mt-2">
                         {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CategoryKnowledgeBase;