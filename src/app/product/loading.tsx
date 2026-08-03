import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Skeleton from '../../components/ui/Skeleton';

const ProductLoading = () => (
  <div className="min-h-screen bg-white">
    <Header />
    <div className="border-b border-slate-200 bg-white py-3">
      <div className="container mx-auto px-4">
        <Skeleton className="h-4 w-48 bg-slate-200" />
      </div>
    </div>

    <main className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6 xl:col-span-5">
          <Skeleton className="aspect-[4/3] w-full bg-slate-100" />
          <div className="mt-px grid grid-cols-3 gap-px bg-slate-200">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-16 w-full bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-6 xl:col-span-4">
          <Skeleton className="mb-4 h-5 w-24 bg-slate-100" />
          <Skeleton className="mb-4 h-12 w-3/4 bg-slate-100" />
          <Skeleton className="mb-8 h-6 w-44 bg-slate-100" />
          <Skeleton className="mb-6 h-20 w-full bg-slate-100" />
          <div className="grid grid-cols-2 gap-px bg-slate-200">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white p-4">
                <Skeleton className="mb-3 h-3 w-16 bg-slate-100" />
                <Skeleton className="h-5 w-24 bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-12 xl:col-span-3">
          <div className="border border-slate-200 bg-white p-6">
            <Skeleton className="mb-2 h-4 w-20 bg-slate-100" />
            <Skeleton className="mb-6 h-10 w-32 bg-slate-100" />
            <div className="mb-6 space-y-3">
              <Skeleton className="h-4 w-full bg-slate-100" />
              <Skeleton className="h-4 w-full bg-slate-100" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full bg-slate-100" />
              <Skeleton className="h-12 w-full bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default ProductLoading;
