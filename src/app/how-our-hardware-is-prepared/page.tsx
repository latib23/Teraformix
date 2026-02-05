import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import { Microscope, Activity, CheckCircle, Package } from 'lucide-react';
import SEOHead from '../../components/SEO/SEOHead';

const ProcessStep = ({ icon: Icon, step, title, description }: { icon: any, step: number, title: string, description: string }) => (
    <div className="relative group">
        <div className="flex flex-col items-center text-center p-8 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 z-10 relative">
            <div className="w-16 h-16 bg-action-50 text-action-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-action-600 group-hover:text-white transition-colors duration-300">
                <Icon className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Step {step}</span>
            <h3 className="text-xl font-bold text-navy-900 mb-4">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
    </div>
);

const HowHardwareIsPrepared = () => {
    const steps = [
        {
            icon: Microscope,
            title: "Inspection",
            description: "Every component undergoes a meticulous visual inspection. We examine contacts, capacitors, and physical integrity to ensure no signs of stress, corrosion, or damage before it ever reaches the test bench."
        },
        {
            icon: Activity,
            title: "Testing",
            description: "Hardware is subjected to rigorous diagnostic stress tests. We verify full functionality under load, check error logs, and update firmware to the latest stable OEM versions to guarantee optimal performance."
        },
        {
            icon: CheckCircle,
            title: "Validation",
            description: "A final quality assurance check validates that the item matches all specifications. We record serial numbers and verify part numbers one last time to ensure you receive exactly what you ordered."
        },
        {
            icon: Package,
            title: "Packaging",
            description: "Your order is packaged in industry-standard ESD (Electrostatic Discharge) safe materials. we use custom foam and secure boxing to protect your hardware during transit for safe arrival."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <SEOHead
                title="How Our Hardware Is Prepared | Server Tech Central"
                description="Learn about our rigorous 4-step process: Inspection, Testing, Validation, and Packaging. We ensure every server part meets enterprise standards."
                canonicalUrl="https://servertechcentral.com/how-our-hardware-is-prepared"
            />

            <Header />

            <Breadcrumbs
                items={[
                    { label: 'How Our Hardware Is Prepared', path: '/how-our-hardware-is-prepared' }
                ]}
            />

            <main>
                {/* Hero Section */}
                <div className="bg-navy-900 text-white py-20 px-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1558494949-efc527b8912d?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                    <div className="container mx-auto max-w-4xl text-center relative z-10">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Our Quality Guarantee</h1>
                        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            We take pride in delivering enterprise-grade hardware you can trust. Here is the rigorous 4-step process every item goes through before it leaves our facility.
                        </p>
                    </div>
                </div>

                {/* Process Steps */}
                <div className="container mx-auto px-4 py-16 -mt-10 relative z-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <ProcessStep
                                key={index}
                                step={index + 1}
                                icon={step.icon}
                                title={step.title}
                                description={step.description}
                            />
                        ))}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="container mx-auto px-4 pb-20 text-center">
                    <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-200 max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold text-navy-900 mb-4">Ready to Upgrade?</h2>
                        <p className="text-gray-600 mb-8">
                            Experience the difference of verified, tested, and professionally packaged hardware.
                        </p>
                        <a
                            href="/category"
                            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-action-600 hover:bg-action-700 md:text-lg transition-colors shadow-sm"
                        >
                            Browse Products
                        </a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default HowHardwareIsPrepared;
