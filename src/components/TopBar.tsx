import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, RotateCcw } from 'lucide-react';
import { useGlobalContent } from '../contexts/GlobalContent';

const TopBar = () => {
    const { content } = useGlobalContent();
    const { phone, email } = content.general;
    const activeTheme = content.settings.activeTheme;

    return (
        <div className="bg-navy-900 text-white text-xs py-2">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">

                {/* Left Side: Guarantees/Policies */}
                <div className="flex items-center gap-6">
                    {activeTheme === 'christmas' && <span className="hidden lg:inline text-yellow-300 font-bold animate-pulse">🎄 Holiday Sale: Up to 50% Off Select Servers! 🎅</span>}
                    {activeTheme === 'new_year' && <span className="hidden lg:inline text-yellow-300 font-bold animate-pulse">🎉 Happy New Year! Start 2026 with new infrastructure! 🚀</span>}
                    <Link to="/returns" className="flex items-center gap-2 hover:text-action-400 transition ml-4">
                        <RotateCcw className="w-3 h-3" />
                        <span>30-Day Money Back Guarantee</span>
                    </Link>
                    <span className="hidden md:inline text-navy-600">|</span>
                    <span className="hidden md:inline text-gray-300">Fast & Secure Shipping Worldwide</span>
                </div>

                {/* Right Side: Contact Info */}
                <div className="flex items-center gap-6">
                    <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-action-400 transition">
                        <Mail className="w-3 h-3" />
                        <span>{email || 'sales@servertechcentral.com'}</span>
                    </a>
                    <span className="hidden md:inline text-navy-600">|</span>
                    <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-action-400 transition font-bold">
                        <Phone className="w-3 h-3" />
                        <span>{phone || '+1 (800) 555-0199'}</span>
                    </a>
                </div>

            </div>
        </div>
    );
};

export default TopBar;
