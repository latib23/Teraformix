import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEOHead from '../../components/SEO/SEOHead';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { Calendar, User, ArrowLeft, Share2 } from 'lucide-react';

const BlogPostPage = () => {
  const { slug } = useParams();
  const { content } = useGlobalContent();

  const post = useMemo(
    () => (content.blogPosts || []).find((p) => p.slug === slug),
    [content.blogPosts, slug]
  );

  // Related posts (same category or recent)
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return (content.blogPosts || [])
      .filter(p => p.isPublished && p.id !== post.id)
      .slice(0, 3);
  }, [content.blogPosts, post]);

  // Inject CSS + wrap tables after HTML renders
  useEffect(() => {
    const STYLE_ID = 'blog-content-inline-style';
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        .blog-content {
          color: #1f2937;
          line-height: 1.8;
          font-size: 1.0625rem;
        }

        /* Typography */
        .blog-content h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #0b1b3f;
          margin: 2rem 0 1rem;
          line-height: 1.2;
        }
        .blog-content h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0b1b3f;
          margin: 1.75rem 0 1rem;
          line-height: 1.3;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        .blog-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0b1b3f;
          margin: 1.5rem 0 0.75rem;
          line-height: 1.4;
        }
        .blog-content h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 1.25rem 0 0.75rem;
        }

        .blog-content p {
          margin-bottom: 1.25rem;
          color: #374151;
        }

        /* Links */
        .blog-content a {
          color: #15803d;
          text-decoration: underline;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .blog-content a:hover {
          color: #166534;
          text-decoration-thickness: 2px;
        }

        /* Lists */
        .blog-content ul, .blog-content ol {
          margin: 1.25rem 0;
          padding-left: 2rem;
        }
        .blog-content ul {
          list-style-type: disc;
        }
        .blog-content ol {
          list-style-type: decimal;
        }
        .blog-content li {
          margin-bottom: 0.5rem;
          color: #374151;
        }

        /* Blockquotes */
        .blog-content blockquote {
          border-left: 4px solid #15803d;
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #4b5563;
          background: #f9fafb;
          padding: 1rem 1.5rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }

        /* Images */
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          margin: 1.5rem 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* Tables */
        .blog-content .table-scroll {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin: 1.5rem 0;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .blog-content table {
          width: 100%;
          min-width: 640px;
          border-collapse: collapse;
          background: #fff;
        }
        .blog-content thead {
          background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
        }
        .blog-content th {
          border: 1px solid #e5e7eb;
          padding: 0.875rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #0b1b3f;
          font-size: 0.9375rem;
        }
        .blog-content td {
          border: 1px solid #e5e7eb;
          padding: 0.875rem 1rem;
          color: #374151;
          font-size: 0.9375rem;
        }
        .blog-content tbody tr:nth-child(even) {
          background: #f9fafb;
        }
        .blog-content tbody tr:hover {
          background: #f3f4f6;
        }

        /* Code */
        .blog-content pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 1.25rem;
          border-radius: 0.75rem;
          margin: 1.5rem 0;
          overflow-x: auto;
          line-height: 1.6;
          font-size: 0.9375rem;
          border: 1px solid #1e293b;
        }
        .blog-content code {
          font-family: 'Courier New', Courier, monospace;
        }
        .blog-content :not(pre) > code {
          background: #f1f5f9;
          color: #dc2626;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Horizontal Rule */
        .blog-content hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }

        /* Strong/Bold */
        .blog-content strong {
          font-weight: 600;
          color: #0b1b3f;
        }

        /* Emphasis/Italic */
        .blog-content em {
          font-style: italic;
        }
      `;
      document.head.appendChild(style);
    }

    // Wrap tables
    const root = document.querySelector('.blog-content');
    if (!root) return;

    root.querySelectorAll('table').forEach((table) => {
      const parent = table.parentElement;
      if (parent && parent.classList.contains('table-scroll')) return;

      const wrap = document.createElement('div');
      wrap.className = 'table-scroll';
      parent?.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }, [post?.content]);

  // Share functionality
  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: post?.title || 'Blog Post',
      text: post?.excerpt || '',
      url: url
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  if (!post || !post.isPublished) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-navy-900 mb-2">Post Not Found</h1>
            <p className="text-gray-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
            <Link to="/blog" className="inline-flex items-center gap-2 text-action-600 font-semibold hover:text-action-700">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEOHead
        title={post.metaTitle || `${post.title} | Blog | Teraformix`}
        description={post.metaDescription || post.excerpt || post.title}
        canonicalUrl={`https://teraformix.com/blog/${post.slug}`}
        image={post.image}
        type="article"
      />

      <Header />

      <main className="flex-grow">
        {/* Breadcrumb & Back Link */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-action-600 hover:text-action-700 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to All Articles
            </Link>
          </div>
        </div>

        {/* Article Header */}
        <article className="bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              {post.publishDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <time dateTime={post.publishDate}>
                    {new Date(post.publishDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </time>
                </div>
              )}
              {post.author && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>By {post.author}</span>
                </div>
              )}
              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-2 text-action-600 hover:text-action-700 font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-gray-600 leading-relaxed mb-8 pb-8 border-b border-gray-200">
                {post.excerpt}
              </p>
            )}

            {/* Featured Image */}
            {post.image && (
              <div className="mb-8">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-auto max-h-[500px] object-cover rounded-xl border border-gray-200 shadow-lg"
                />
              </div>
            )}

            {/* Article Content */}
            <div
              className="blog-content max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <h2 className="text-2xl font-bold text-navy-900 mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map(relatedPost => (
                  <Link
                    key={relatedPost.id}
                    to={`/blog/${relatedPost.slug}`}
                    className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {relatedPost.image ? (
                      <div className="h-40 overflow-hidden bg-gray-100">
                        <img
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-navy-100 to-action-50" />
                    )}
                    <div className="p-5">
                      <h3 className="font-bold text-navy-900 mb-2 line-clamp-2 group-hover:text-action-600 transition-colors">
                        {relatedPost.title}
                      </h3>
                      {relatedPost.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
