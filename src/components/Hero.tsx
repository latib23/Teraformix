import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
const ConciergeWidget = lazy(() => import('./ConciergeWidget'));
import Image from './Image';
import { useGlobalContent } from '../contexts/GlobalContent';
import { useUI } from '../contexts/UIContext';

const Hero = () => {
  const { content } = useGlobalContent();
  const { heroTitle, heroSubtitle, heroCta, heroImage } = content.home;
  const { announcement } = content.general;
  const { openQuoteModal } = useUI();

  return (
    <div className="relative w-full h-[600px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
         <Image 
            src={heroImage} 
            alt="Server Room Background"
            className="w-full h-full object-cover"
            priority={true}
         />
         {/* Adjusted gradient to be more transparent so user uploaded images are visible */}
         <div className="absolute inset-0 bg-gradient-to-r from-navy-900/90 via-navy-900/50 to-navy-900/10"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <div className="text-white space-y-6">
          <div className="inline-flex items-center gap-2 bg-action-600/20 border border-action-500/30 rounded-full px-3 py-1 text-action-100 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-action-500 animate-pulse"></span>
            {announcement}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-300 pb-2">
             {heroTitle}
          </h1>
          <p className="text-lg text-gray-300 max-w-xl">
             {heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link 
              to="/category" 
              className="px-8 py-3.5 bg-action-600 hover:bg-action-500 text-white font-semibold rounded-md transition flex items-center gap-2"
            >
              {heroCta} <ArrowRight className="w-4 h-4" />
            </Link>
            <button 
              onClick={() => openQuoteModal()}
              className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-md backdrop-blur-sm transition"
            >
              Request Bulk Quote
            </button>
          </div>
        </div>

        <Suspense fallback={<div className="hidden md:block ml-auto" />}> 
          <div className="hidden md:block ml-auto">
            <ConciergeWidget transparent={true} />
          </div>
        </Suspense>
      </div>
    </div>
  );
};

export default Hero;
