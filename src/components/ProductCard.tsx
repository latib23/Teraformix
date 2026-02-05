
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock } from 'lucide-react';
import { Product } from '../types';
import Image from './Image';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { openQuoteModal } = useUI();

  return (
    <Link
      to={`/product/${product.sku}`}
      aria-label={`View details for ${product.name}`}
      onClick={() => {
        try {
          const item = { item_id: product.sku, item_name: product.name, price: product.price, item_category: product.category };
          const g = (window as any).gtag;
          if (typeof g === 'function') {
            g('event', 'select_item', { items: [item], item_list_name: 'Category Grid' });
          }
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push({ event: 'select_item', items: [item], item_list_name: 'Category Grid' });
        } catch {}
      }}
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-200 flex flex-col h-full group"
    >
      <div className="p-6 relative">
        <div className="aspect-square bg-gray-50 rounded-md overflow-hidden mb-4 flex items-center justify-center relative">
          <Image 
            src={product.image} 
            alt={`${product.name} - ${product.sku} - Enterprise Hardware`} 
            className="object-contain h-48 w-48 mix-blend-multiply group-hover:scale-105 transition duration-300" 
            width={300}
            height={300}
          />
        </div>
        <h3 className="text-lg font-semibold text-navy-900 line-clamp-2 hover:text-action-600 transition mb-2">
          {product.name}
        </h3>
        <div className="text-xs font-mono text-gray-800 mb-4 bg-gray-100 inline-block px-2 py-1 rounded">
          MPN: {product.sku}
        </div>
      </div>

      <div className="mt-auto px-6 pb-6">
        <div className="mb-4">
          {product.showPrice ? (
            <span className="text-xl font-bold text-navy-900 block">${product.price.toLocaleString()}</span>
          ) : (
            <span className="text-lg font-bold text-action-600 block">Request for Quote</span>
          )}
          {product.stockStatus === 'IN_STOCK' ? (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-action-600 bg-action-100 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> In Stock{typeof product.stockLevel === 'number' ? ` • ${product.stockLevel} units` : ''}
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-alert-500 bg-orange-50 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" /> Backorder
            </div>
          )}
        </div>

        <div className={product.showPrice ? "grid grid-cols-2 gap-2" : "grid grid-cols-1"}>
           <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); openQuoteModal(`${product.name} (SKU: ${product.sku})`); }}
             className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy-500"
             aria-label={`Get a quote for ${product.name}`}
           >
             Quick Quote
           </button>
          {product.showPrice && (
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); const g = (window as any).gtag; if (g) { g('event', 'add_to_cart', { items: [{ item_id: product.sku, item_name: product.name, price: product.price, quantity: 1 }] }); } addToCart(product); }}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-action-600 hover:bg-action-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-600 transition"
            aria-label={`Add ${product.name} to cart`}
          >
            Add to Cart
          </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
