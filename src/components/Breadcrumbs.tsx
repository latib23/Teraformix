import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { safeJsonScript } from '../lib/security';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  // Generate BreadcrumbList Schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://teraformix.com"
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.label,
        "item": `https://teraformix.com${item.path}`
      }))
    ]
  };

  return (
    <nav aria-label="Breadcrumb" className="bg-navy-950 border-b border-navy-800 py-3">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonScript(schema) }}
      />
      <div className="container mx-auto px-4">
        <ol className="flex items-center space-x-2 text-xs text-gray-500">
          <li>
            <Link to="/" className="hover:text-action-400 flex items-center transition-colors">
              <Home className="w-3 h-3" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRight className="w-3 h-3 text-navy-700" />
              {index === items.length - 1 ? (
                <span className="font-medium text-gray-300" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.path} className="hover:text-action-400 transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
