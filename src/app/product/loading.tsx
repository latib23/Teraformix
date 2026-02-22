
import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Skeleton from '../../components/ui/Skeleton';

const ProductLoading = () => {
  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      {/* Breadcrumb Skeleton */}
      <div className="bg-navy-950 border-b border-navy-800 py-3">
        <div className="container mx-auto px-4">
          <Skeleton className="h-4 w-48 bg-navy-800" />
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Col 1: Gallery (4 spans) */}
          <div className="lg:col-span-4">
            <Skeleton className="w-full h-[400px] mb-4 bg-navy-900" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="aspect-square w-full bg-navy-900" />
              ))}
            </div>
          </div>

          {/* Col 2: Info & Specs (5 spans) */}
          <div className="lg:col-span-5">
            <Skeleton className="h-10 w-3/4 mb-4 bg-navy-900" />
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-6 w-24 bg-navy-900" />
              <Skeleton className="h-6 w-32 bg-navy-900" />
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-navy-800 pb-2 mb-6">
              <Skeleton className="h-6 w-20 bg-navy-900" />
              <Skeleton className="h-6 w-16 bg-navy-900" />
              <Skeleton className="h-6 w-24 bg-navy-900" />
            </div>

            {/* Specs Table */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-6 w-1/3 bg-navy-900" />
                  <Skeleton className="h-6 w-1/2 bg-navy-900" />
                </div>
              ))}
            </div>
          </div>

          {/* Col 3: Sticky Buy Box (3 spans) */}
          <div className="lg:col-span-3">
            <div className="border border-navy-800 rounded-lg p-6 bg-navy-900">
              <Skeleton className="h-4 w-20 mb-2 bg-navy-800" />
              <Skeleton className="h-10 w-32 mb-6 bg-navy-800" />

              <div className="space-y-2 mb-6">
                <Skeleton className="h-4 w-full bg-navy-800" />
                <Skeleton className="h-4 w-full bg-navy-800" />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded bg-navy-800" />
                <Skeleton className="h-12 w-full rounded bg-navy-800" />
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
