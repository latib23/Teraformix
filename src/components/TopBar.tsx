import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, ShieldCheck } from 'lucide-react';
import { useGlobalContent } from '../contexts/GlobalContent';

const TopBar = () => {
    const { content } = useGlobalContent();
    const { phone, email } = content.general;
    return (
        <div className="border-b border-slate-800 bg-slate-950 py-2 text-xs text-slate-200">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-4">
                    <span className="flex items-center gap-2 whitespace-nowrap font-semibold text-white">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        ISO-certified enterprise supplier
                    </span>
                    <Link to="/returns" className="hidden text-slate-400 transition hover:text-white sm:inline">
                        30-day returns
                    </Link>
                    <span className="hidden text-slate-400 lg:inline">Worldwide fulfillment</span>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                    <a href={`mailto:${email}`} className="hidden items-center gap-1.5 text-slate-300 transition hover:text-white md:flex">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{email || 'sales@teraformix.com'}</span>
                    </a>
                    <a href={`tel:${phone}`} className="flex items-center gap-1.5 font-bold text-white transition hover:text-emerald-300">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{phone || '+1 (800) 555-0199'}</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
