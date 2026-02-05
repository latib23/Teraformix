
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, ShoppingCart } from 'lucide-react';
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
    <div className="group flex flex-col h-full bg-navy-900 border border-navy-800 hover:border-action-500/50 rounded-sm transition-all duration-300 relative overflow-hidden">

      {/* Hover Effect Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>

      <Link
        to={`/product/${product.sku}`}
        aria-label={`View details for ${product.name}`}
        className="flex-grow p-5"
      >
        <div className="bg-white rounded-sm p-4 mb-4 relative overflow-hidden h-48 flex items-center justify-center">
          {/* Product Image */}
          <Image
            src={product.image}
            alt={`${product.name}`}
            className="object-contain max-h-40 w-auto mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
            width={300}
            height={300}
          />

          {/* Stock Badge Overlay */}
          <div className="absolute top-2 right-2">
            {product.stockStatus === 'IN_STOCK' ? (
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shadow-sm">
                <CheckCircle className="w-3 h-3" /> IN STOCK
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full shadow-sm">
                <Clock className="w-3 h-3" /> LEAD TIME
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-gray-100 font-bold text-sm leading-snug line-clamp-2 group-hover:text-action-400 transition-colors h-10">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-500 bg-navy-950 px-1.5 py-0.5 rounded border border-navy-800 truncate max-w-full">
              SKU: {product.sku}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5 pt-0 mt-auto z-20 relative">
        <div className="flex items-center justify-between mb-4">
          {product.showPrice ? (
            <div className="flex flex-col">
              <span className="text-gray-400 text-[10px] uppercase tracking-wider">Your Price</span>
              <span className="text-lg font-bold text-white">${product.price.toLocaleString()}</span>
            </div>
          ) : (
            <span className="text-sm font-bold text-action-400">Request Quote</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openQuoteModal(`${product.name} (SKU: ${product.sku})`)}
            className="px-3 py-2 text-xs font-semibold text-gray-300 border border-navy-600 hover:border-gray-400 hover:text-white rounded-sm transition-colors"
          >
            Quote
          </button>

          {product.showPrice ? (
            <button
              onClick={() => addToCart(product)}
              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-action-600 hover:bg-action-500 rounded-sm transition-colors shadow-lg shadow-action-900/20"
            >
              <ShoppingCart className="w-3 h-3" /> Add
            </button>
          ) : (
            <Link
              to={`/product/${product.sku}`}
              className="flex items-center justify-center px-3 py-2 text-xs font-bold text-navy-900 bg-white hover:bg-gray-200 rounded-sm transition-colors"
            >
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
