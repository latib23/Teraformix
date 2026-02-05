
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConciergeWidget from '../components/ConciergeWidget';
import { SearchX } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-navy-900">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-5xl w-full">
          
          {/* Left: Content */}
          <div className="text-white space-y-6">
            <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center mb-6 border border-navy-700">
              <SearchX className="w-8 h-8 text-alert-500" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">Part Not Found?</h1>
            <h2 className="text-2xl text-gray-300 font-light">Don't worry, it's likely in our off-line inventory.</h2>
            <div className="prose prose-invert text-gray-400">
              <p>
                We stock thousands of legacy, EOL (End-of-Life), and difficult-to-find components that are not listed on our public website.
              </p>
              <p>
                Our "Invisible Inventory" includes spare parts for servers dating back to 2010. Use the form to request a manual stock check from our warehouse team.
              </p>
            </div>
            <div className="pt-4">
              <Link 
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 hover:text-white hover:bg-navy-800 transition"
              >
                &larr; Return to Home
              </Link>
            </div>
          </div>

          {/* Right: Lead Capture */}
          <div className="w-full">
             <ConciergeWidget variant="dark" />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
