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
    <article className="group relative flex h-full flex-col overflow-hidden border border-slate-200 bg-white transition duration-300 hover:border-slate-400 hover:shadow-lg">
      <Link
        to={`/product/${product.sku}`}
        aria-label={`View details for ${product.name}`}
        className="flex-grow p-5"
      >
        <div className="relative mb-5 flex h-48 items-center justify-center overflow-hidden bg-slate-50 p-4">
          <Image
            src={product.image}
            alt={product.name}
            className="max-h-40 w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
            width={300}
            height={300}
          />
          <div className="absolute right-2 top-2">
            {product.stockStatus === 'IN_STOCK' ? (
              <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">
                <CheckCircle className="h-3 w-3" />
                In stock
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">
                <Clock className="h-3 w-3" />
                Lead time
              </div>
            )}
          </div>
        </div>

        <h3 className="line-clamp-2 h-10 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700">
          {product.name}
        </h3>
        <span className="mt-2 inline-block max-w-full truncate border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
          SKU: {product.sku}
        </span>
      </Link>

      <div className="mt-auto p-5 pt-0">
        <div className="mb-4">
          {product.showPrice ? (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-slate-500">Your price</span>
              <span className="text-lg font-bold text-slate-950">${product.price.toLocaleString()}</span>
            </div>
          ) : (
            <span className="text-sm font-bold text-emerald-700">Request quote</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => openQuoteModal(`${product.name} (SKU: ${product.sku})`)}
            className="border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-950"
          >
            Quote
          </button>
          {product.showPrice ? (
            <button
              type="button"
              onClick={() => addToCart(product)}
              className="flex items-center justify-center gap-2 bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-800"
            >
              <ShoppingCart className="h-3 w-3" />
              Add
            </button>
          ) : (
            <Link
              to={`/product/${product.sku}`}
              className="flex items-center justify-center bg-slate-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
            >
              View
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
