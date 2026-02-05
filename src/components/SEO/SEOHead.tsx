
import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  type?: 'website' | 'product' | 'article';
  image?: string;
  price?: number;
  currency?: string;
  availability?: string;
  preloadImages?: string[];
}

const SEOHead: React.FC<SEOHeadProps> = ({ 
  title, 
  description, 
  canonicalUrl, 
  type = 'website',
  image = 'https://teraformix.com/og-default.jpg',
  price,
  currency = 'USD',
  availability,
  preloadImages = []
}) => {
  
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // 2. Helper to update or create meta tags
    const updateMeta = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Basic Meta
    updateMeta('description', description);

    // 4. Open Graph (Facebook/LinkedIn)
    updateMeta('og:title', title, 'property');
    updateMeta('og:description', description, 'property');
    updateMeta('og:type', type, 'property');
    updateMeta('og:image', image, 'property');
    updateMeta('og:url', canonicalUrl || window.location.href, 'property');
    updateMeta('og:site_name', 'Teraformix', 'property');

    // 5. Product Specific OG
    if (type === 'product' && price) {
        updateMeta('product:price:amount', price.toString(), 'property');
        updateMeta('product:price:currency', currency, 'property');
        if (availability) {
            updateMeta('product:availability', availability, 'property');
        }
    }

    // 6. Twitter Cards
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image);

    // 7. Preload Images
    const uniquePreloads = Array.from(new Set((preloadImages || []).filter(Boolean)));
    uniquePreloads.forEach((url) => {
      if (!document.querySelector(`link[rel='preload'][as='image'][href='${url}']`)) {
        const linkPre = document.createElement('link');
        linkPre.setAttribute('rel', 'preload');
        linkPre.setAttribute('as', 'image');
        linkPre.setAttribute('href', url);
        document.head.appendChild(linkPre);
      }
    });

    // 8. Canonical Link
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl || window.location.href.split('?')[0]);

  }, [title, description, canonicalUrl, type, image, price, currency, availability, preloadImages]);

  return null;
};

export default SEOHead;
