import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './src/app/layout.tsx';
import { GlobalContentProvider } from './src/contexts/GlobalContent';
import { CartProvider } from './src/contexts/CartContext';
import { UIProvider, useUI } from './src/contexts/UIContext';

const LazyQuoteModal = lazy(() => import('./src/components/QuoteModal'));
const LazyToastContainer = lazy(() => import('./src/components/Toast'));

// Lazy load pages with correct relative paths from root
const HomePage = lazy(() => import('./src/app/page.tsx'));
const CategoryPage = lazy(() => import('./src/app/category/page.tsx'));
const ProductPage = lazy(() => import('./src/app/product/page.tsx'));
const CartPage = lazy(() => import('./src/app/cart/page.tsx'));
const CheckoutPage = lazy(() => import('./src/app/checkout/page.tsx'));
const UploadBOMPage = lazy(() => import('./src/app/upload-bom/page.tsx'));
const ThankYouPage = lazy(() => import('./src/app/thank-you/page.tsx'));
const NotFoundPage = lazy(() => import('./src/app/not-found.tsx'));
const PrivacyPolicyPage = lazy(() => import('./src/app/privacy/page.tsx'));
const TermsOfSalePage = lazy(() => import('./src/app/terms/page.tsx'));
const AboutPage = lazy(() => import('./src/app/about/page.tsx'));
const ContactPage = lazy(() => import('./src/app/contact/page.tsx'));
const ReturnsPage = lazy(() => import('./src/app/returns/page.tsx'));
const WarrantyPage = lazy(() => import('./src/app/warranty/page.tsx')); // ✅ ADDED
const TermsConditionsPage = lazy(() => import('./src/app/terms-conditions/page.tsx'));
const SitemapPage = lazy(() => import('./src/app/sitemap/page.tsx'));
const TrackPage = lazy(() => import('./src/app/track/page.tsx'));
const LandingPage = lazy(() => import('./src/app/landing/page.tsx'));
const BlogListPage = lazy(() => import('./src/app/blog/page.tsx'));
const BlogPostPage = lazy(() => import('./src/app/blog/post.tsx'));
const HowHardwareIsPreparedPage = lazy(() => import('./src/app/how-our-hardware-is-prepared/page.tsx'));

const PayQuotePage = lazy(() => import('./src/app/pay-quote/page.tsx'));

// Customer Auth & Account
const CustomerLoginPage = lazy(() => import('./src/app/login/page.tsx'));
const CustomerRegisterPage = lazy(() => import('./src/app/register/page.tsx'));
const AccountPage = lazy(() => import('./src/app/account/page.tsx'));

const AdminLayout = lazy(() => import('./src/admin/AdminLayout.tsx'));
const Dashboard = lazy(() => import('./src/admin/pages/Dashboard.tsx'));
const ContentEditor = lazy(() => import('./src/admin/pages/ContentEditor.tsx'));
const ProductManager = lazy(() => import('./src/admin/pages/ProductManager.tsx'));
const CategoryManager = lazy(() => import('./src/admin/pages/CategoryManager.tsx'));
const OrderManager = lazy(() => import('./src/admin/pages/OrderManager.tsx'));
const Settings = lazy(() => import('./src/admin/pages/Settings.tsx'));
const Login = lazy(() => import('./src/admin/pages/Login.tsx'));
const RequireAuth = lazy(() => import('./src/admin/components/RequireAuth.tsx'));
const SalesManager = lazy(() => import('./src/admin/pages/SalesManager.tsx'));
const FormSubmissions = lazy(() => import('./src/admin/pages/FormSubmissions.tsx'));
const CustomerManager = lazy(() => import('./src/admin/pages/CustomerManager.tsx'));
const LandingManager = lazy(() => import('./src/admin/pages/LandingManager.tsx'));
const BlogManager = lazy(() => import('./src/admin/pages/BlogManager.tsx'));
const UsersManager = lazy(() => import('./src/admin/pages/UsersManager.tsx'));

// Sales Team Pages
const SalesLayout = lazy(() => import('./src/salesteam/SalesLayout.tsx'));
const SalesLogin = lazy(() => import('./src/salesteam/pages/Login.tsx'));
const SalesDashboard = lazy(() => import('./src/salesteam/pages/Dashboard.tsx'));
const SalesOrderManager = lazy(() => import('./src/salesteam/pages/OrderManager.tsx'));
const RequireSalesAuth = lazy(() => import('./src/salesteam/components/RequireSalesAuth.tsx'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-navy-200 border-t-navy-900 rounded-full animate-spin"></div>
      <div className="text-sm font-semibold text-navy-900">Loading Server Tech Central...</div>
    </div>
  </div>
);

function App() {
  return (
    <GlobalContentProvider>
      <UIProvider>
        <CartProvider>
          <Router>
            <UIOverlays />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/category" element={<CategoryPage />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/product/:sku" element={<ProductPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/upload-bom" element={<UploadBOMPage />} />
                  <Route path="/pay-quote/:id" element={<PayQuotePage />} />
                  <Route path="/landing/:slug" element={<LandingPage />} />
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="/thank-you" element={<ThankYouPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsOfSalePage />} />
                  <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
                  <Route path="/returns" element={<ReturnsPage />} />
                  <Route path="/warranty" element={<WarrantyPage />} /> {/* ✅ ADDED */}
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/blog" element={<BlogListPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/sitemap" element={<SitemapPage />} />
                  <Route path="/track" element={<TrackPage />} />
                  <Route path="/how-our-hardware-is-prepared" element={<HowHardwareIsPreparedPage />} />
                  <Route path="/login" element={<CustomerLoginPage />} />
                  <Route path="/register" element={<CustomerRegisterPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Admin Login (No Layout) */}
                <Route path="/admin/login" element={<Login />} />

                {/* Protected Admin Routes */}
                <Route element={<RequireAuth />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="inbox" element={<FormSubmissions />} />
                    <Route path="products" element={<ProductManager />} />
                    <Route path="categories" element={<CategoryManager />} />
                    <Route path="content" element={<ContentEditor />} />
                    <Route path="orders" element={<OrderManager />} />
                    <Route path="customers" element={<CustomerManager />} />
                    <Route path="sales" element={<SalesManager />} />
                    <Route path="blog" element={<BlogManager />} />
                    <Route path="users" element={<UsersManager />} />
                    <Route path="landing" element={<LandingManager />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Route>

                {/* Sales Team Portal */}
                <Route path="/salesteam/login" element={<Layout><SalesLogin /></Layout>} />
                <Route element={<RequireSalesAuth />}>
                  <Route path="/salesteam" element={<SalesLayout />}>
                    <Route index element={<SalesDashboard />} />
                    <Route path="orders" element={<SalesOrderManager />} />
                    <Route path="quotes" element={<FormSubmissions />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </CartProvider>
      </UIProvider>
    </GlobalContentProvider>
  );
}

export default App;

function UIOverlays() {
  const { isQuoteModalOpen, toasts } = useUI();
  return (
    <Suspense fallback={null}>
      {isQuoteModalOpen ? <LazyQuoteModal /> : null}
      {toasts.length > 0 ? <LazyToastContainer /> : null}
    </Suspense>
  );
}
