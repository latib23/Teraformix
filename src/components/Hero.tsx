import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Server, HardDrive, Network, Settings, ChevronRight } from 'lucide-react';
import { useGlobalContent } from '../contexts/GlobalContent';
import { useUI } from '../contexts/UIContext';
import Image from './Image';

const Hero = () => {
  const { content } = useGlobalContent();
  const { heroTitle, heroSubtitle, heroCta, heroImage } = content.home;
  const { openQuoteModal } = useUI();

  // Renewtech-inspired Diagonal Card Component
  const ConfigCard = ({ title, icon: Icon, to, colorClass }: { title: string, icon: any, to: string, colorClass: string }) => (
    <Link
      to={to}
      className="group relative flex flex-col justify-between p-6 h-48 bg-white hover:bg-gray-50 transition-all duration-300 overflow-hidden"
      style={{ clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)' }}
    >
      <div className={`absolute top-0 right-0 w-8 h-8 ${colorClass} opacity-20 group-hover:opacity-100 transition-all duration-300`}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}></div>

      <div className="z-10">
        <div className={`w-12 h-12 rounded-lg ${colorClass} bg-opacity-10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <h3 className="text-lg font-bold text-navy-900 group-hover:text-action-600 transition-colors flex items-center gap-2">
          {title} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
        </h3>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100 group-hover:bg-action-500 transition-colors duration-300"></div>
    </Link>
  );

  return (
    <div className="relative w-full min-h-[700px] flex items-center bg-navy-950 overflow-hidden">

      {/* Background Effect - Video with Overlays */}
      <div className="absolute inset-0 z-0">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-server-room-with-blue-lights-1748-large.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-navy-950/80"></div>

        {/* Diagonal shape overlay */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-navy-900 transform -skew-x-12 translate-x-32 z-0 hidden lg:block opacity-50"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-navy-800 transform -skew-x-12 translate-x-64 z-0 hidden lg:block opacity-30"></div>

        {/* Subtle Image Blend (Fallback/Texture) */}
        {heroImage && (
          <div className="absolute inset-0 opacity-10 mix-blend-overlay">
            <Image
              src={heroImage}
              alt="Background"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 relative z-10 py-12 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Text Content */}
          <div className="text-white space-y-8 max-w-2xl">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-action-500/10 border border-action-500/20 text-action-100 text-sm font-semibold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-action-500 animate-pulse"></span>
              Enterprise Infrastructure
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white">
              {heroTitle || 'Powering Data.'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-action-400 to-teal-200">
                Reshaping Future.
              </span>
            </h1>

            <p className="text-xl text-gray-400 leading-relaxed font-light border-l-4 border-action-500 pl-6">
              {heroSubtitle || 'The trusted source for Enterprise Servers, Storage, and Networking hardware.'}
            </p>

            <div className="flex flex-wrap gap-5 pt-4">
              <Link
                to="/category"
                className="px-8 py-4 bg-action-600 hover:bg-action-500 text-white font-bold rounded-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-2"
              >
                {heroCta} <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={() => openQuoteModal()}
                className="px-8 py-4 bg-transparent border border-gray-600 hover:border-white text-gray-300 hover:text-white font-bold rounded-sm transition-all flex items-center gap-2"
              >
                <Settings className="w-5 h-5" /> Quick Quote
              </button>
            </div>
          </div>

          {/* Right: Configurator Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:ml-auto w-full max-w-xl">
            <div className="md:col-span-2">
              <ConfigCard
                title="Configure Servers"
                icon={Server}
                to="/category/servers"
                colorClass="bg-blue-600 text-blue-600"
              />
            </div>
            <ConfigCard
              title="Storage Arrays"
              icon={HardDrive}
              to="/category/storage"
              colorClass="bg-orange-500 text-orange-500"
            />
            <ConfigCard
              title="Networking"
              icon={Network}
              to="/category/networking"
              colorClass="bg-purple-600 text-purple-600"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;
