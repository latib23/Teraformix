import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEOHead from '../../components/SEO/SEOHead';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { Calendar, ArrowRight, User } from 'lucide-react';

const BlogListPage = () => {
  const { content } = useGlobalContent();
  const posts = useMemo(() => (content.blogPosts || []).filter(p => p.isPublished), [content.blogPosts]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEOHead
        title="Blog | Teraformix"
        description="Expert insights, guides, and news on enterprise hardware, servers, storage, and networking solutions."
        canonicalUrl="https://teraformix.com/blog"
      />
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Enterprise Hardware Insights</h1>
            <p className="text-xl text-gray-300 max-w-2xl">Expert guides, industry news, and best practices for enterprise IT infrastructure</p>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-2">No Posts Yet</h2>
              <p className="text-gray-600">Check back soon for expert insights and industry news.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map(post => (
                <article key={post.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                  {/* Image */}
                  {post.image ? (
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-navy-100 to-action-50 flex items-center justify-center">
                      <svg className="w-16 h-16 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      {post.publishDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <time dateTime={post.publishDate}>
                            {new Date(post.publishDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </time>
                        </div>
                      )}
                      {post.author && (
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>{post.author}</span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-navy-900 mb-3 line-clamp-2 group-hover:text-action-600 transition-colors">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow leading-relaxed">
                      {post.excerpt || 'Read the full article to learn more...'}
                    </p>

                    {/* Read More Link */}
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-action-600 font-semibold text-sm hover:text-action-700 transition-colors group/link"
                    >
                      Read Article
                      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogListPage;
