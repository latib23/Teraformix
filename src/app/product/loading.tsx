
import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Skeleton from '../../components/ui/Skeleton';

const ProductLoading = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Breadcrumb Skeleton */}
      <div className="bg-gray-50 border-b border-gray-200 py-3">
        <div className="container mx-auto px-4">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Col 1: Gallery (4 spans) */}
          <div className="lg:col-span-4">
            <Skeleton className="w-full h-[400px] mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          </div>

          {/* Col 2: Info & Specs (5 spans) */}
          <div className="lg:col-span-5">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 pb-2 mb-6">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>

            {/* Specs Table */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              ))}
            </div>
          </div>

          {/* Col 3: Sticky Buy Box (3 spans) */}
          <div className="lg:col-span-3">
            <div className="border border-gray-200 rounded-lg p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-32 mb-6" />
              
              <div className="space-y-2 mb-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded" />
                <Skeleton className="h-12 w-full rounded" />
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductLoading;
