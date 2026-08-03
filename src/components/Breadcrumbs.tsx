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
    <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white py-3">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonScript(schema) }}
      />
      <div className="container mx-auto px-4">
        <ol className="flex min-w-0 items-center space-x-2 text-xs text-slate-500">
          <li>
            <Link to="/" className="flex items-center transition-colors hover:text-emerald-700">
              <Home className="w-3 h-3" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRight className="h-3 w-3 text-slate-300" />
              {index === items.length - 1 ? (
                <span className="truncate font-medium text-slate-700" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.path} className="transition-colors hover:text-emerald-700">
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
