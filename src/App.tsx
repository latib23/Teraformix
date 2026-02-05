import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import Layout from './app/layout';

// =======================
// Public Pages
// =======================
const Home = lazy(() => import('./app/page'));
const Category = lazy(() => import('./app/category/page'));
const Product = lazy(() => import('./app/product/page'));
const Cart = lazy(() => import('./app/cart/page'));
const Checkout = lazy(() => import('./app/checkout/page'));
const ThankYou = lazy(() => import('./app/thank-you/page'));
const Privacy = lazy(() => import('./app/privacy/page'));
const Terms = lazy(() => import('./app/terms/page'));
const SitemapPage = lazy(() => import('./app/sitemap/page'));
const Landing = lazy(() => import('./app/landing/page'));
const Track = lazy(() => import('./app/track/page'));
const UploadBom = lazy(() => import('./app/upload-bom/page'));
const Login = lazy(() => import('./app/login/page'));
const Register = lazy(() => import('./app/register/page'));
const Account = lazy(() => import('./app/account/page'));
const Contact = lazy(() => import('./app/contact/page'));
const Configurator = lazy(() => import('./app/configurator/page'));
const Warranty = lazy(() => import('./app/warranty/page'));
const NotFound = lazy(() => import('./app/not-found'));
const PayQuote = lazy(() => import('./app/pay-quote/page'));

// ✅ BLOG (ADD THIS)
const BlogList = lazy(() => import('./app/blog/page'));
const BlogPost = lazy(() => import('./app/blog/post'));

// =======================
// Admin
// =======================
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/pages/Login'));
const RequireAuth = lazy(() => import('./admin/components/RequireAuth'));
const AdminDashboard = lazy(() => import('./admin/pages/Dashboard'));
const BlogManager = lazy(() => import('./admin/pages/BlogManager'));
const ContentEditor = lazy(() => import('./admin/pages/ContentEditor'));
const SettingsPage = lazy(() => import('./admin/pages/Settings'));
const ProductManager = lazy(() => import('./admin/pages/ProductManager'));
const CategoryManager = lazy(() => import('./admin/pages/CategoryManager'));
const LandingManager = lazy(() => import('./admin/pages/LandingManager'));
const OrderManager = lazy(() => import('./admin/pages/OrderManager'));
const CustomerManager = lazy(() => import('./admin/pages/CustomerManager'));
const SalesManager = lazy(() => import('./admin/pages/SalesManager'));
const UsersManager = lazy(() => import('./admin/pages/UsersManager'));
const Inbox = lazy(() => import('./admin/pages/FormSubmissions'));

// =======================
// Debug helper
// =======================
const RouterLogger = () => {
  const location = useLocation();
  useEffect(() => {
    console.log('[Router] Path:', location.pathname);
  }, [location]);
  return null;
};

const App = () => {
  return (
    <BrowserRouter>
      <RouterLogger />

      <Suspense fallback={<div />}>
        <Routes>
          {/* =======================
              PUBLIC LAYOUT
          ======================= */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />

            <Route path="/warranty" element={<Warranty />} />
            <Route path="/returns" element={<Warranty />} />

            <Route path="/category" element={<Category />} />
            <Route path="/category/:id" element={<Category />} />
            <Route path="/product/:sku" element={<Product />} />

            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pay-quote/:id" element={<PayQuote />} />
            <Route path="/thank-you" element={<ThankYou />} />

            <Route path="/privacy" element={<Privacy />} />

            <Route path="/terms" element={<Terms />} />
            <Route path="/terms-and-conditions" element={<Terms />} />

            <Route path="/sitemap" element={<SitemapPage />} />

            <Route path="/landing" element={<Landing />} />
            <Route path="/landing/:slug" element={<Landing />} />

            <Route path="/track" element={<Track />} />
            <Route path="/upload-bom" element={<UploadBom />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/account" element={<Account />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/configurator" element={<Configurator />} />

            {/* ✅ BLOG ROUTES (ADD THIS) */}
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Route>

          {/* =======================
              ADMIN
          ======================= */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="products" element={<ProductManager />} />
              <Route path="categories" element={<CategoryManager />} />
              <Route path="landing" element={<LandingManager />} />
              <Route path="orders" element={<OrderManager />} />
              <Route path="customers" element={<CustomerManager />} />
              <Route path="sales" element={<SalesManager />} />
              <Route path="users" element={<UsersManager />} />
              <Route path="blog" element={<BlogManager />} />
              <Route path="content" element={<ContentEditor />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* =======================
              404
          ======================= */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
