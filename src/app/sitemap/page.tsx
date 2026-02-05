
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useGlobalContent } from '../../contexts/GlobalContent';
import SEOHead from '../../components/SEO/SEOHead';
import { Folder, ExternalLink } from 'lucide-react';

const SitemapPage = () => {
  const { content } = useGlobalContent();
  const categories = content.categories || [];
  const introText = content.sitemapSettings?.introText || "Navigate our complete catalog.";

  // Blog posts from Global Content
  const blogPosts = React.useMemo(() => {
    return (content.blogPosts || []).filter((p: any) => p && p.isPublished);
  }, [content.blogPosts]);


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEOHead
        title="Sitemap | Teraformix"
        description="HTML Sitemap for Teraformix. Browse all categories and pages."
        canonicalUrl="https://teraformix.com/sitemap"
      />
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-14xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold text-navy-900 mb-4">Sitemap</h1>
          <p className="text-gray-600 mb-8 pb-6 border-b border-gray-100">
            {introText}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Main Pages */}
            <div>
              <h2 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
                <Folder className="w-5 h-5 text-action-600" /> General
              </h2>
              <ul className="space-y-2 text-sm text-gray-600 ml-7">
                <li><Link to="/" className="hover:text-action-600 hover:underline">Home</Link></li>
                <li><Link to="/category" className="hover:text-action-600 hover:underline">All Products</Link></li>
                <li><Link to="/cart" className="hover:text-action-600 hover:underline">Shopping Cart</Link></li>
                <li><Link to="/upload-bom" className="hover:text-action-600 hover:underline">Upload BOM (Bulk Quote)</Link></li>
                <li><Link to="/privacy" className="hover:text-action-600 hover:underline">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-action-600 hover:underline">Terms of Sale</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h2 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
                <Folder className="w-5 h-5 text-action-600" /> Product Categories
              </h2>
              <ul className="space-y-2 text-sm text-gray-600 ml-7">
                {categories.filter(c => c.isActive).map(cat => (
                  <li key={cat.id}>
                    <Link to={`/category/${cat.id}`} className="hover:text-action-600 hover:underline">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Blog Posts */}
            {blogPosts.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-action-600" /> Blog
                </h2>
                <ul className="space-y-2 text-sm text-gray-600 ml-7">
                  <li><Link to="/blog" className="hover:text-action-600 hover:underline font-semibold">All Articles</Link></li>
                  {blogPosts.map((post) => (
                    <li key={post.id}>
                      <Link to={`/blog/${post.slug}`} className="hover:text-action-600 hover:underline">
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Admin Links */}
            <div className="md:col-span-2 mt-4 pt-6 border-t border-gray-100">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Employee Access</h2>
              <ul className="flex gap-6 text-xs text-gray-500">
                <li><Link to="/admin/login" className="hover:text-navy-900 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Admin Portal</Link></li>
                <li><Link to="/salesteam/login" className="hover:text-navy-900 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Sales Portal</Link></li>
              </ul>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SitemapPage;
