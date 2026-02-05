import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProductData } from '../hooks/useProductData';
import { Product } from '../types';

interface RelatedProductsProps {
    currentProduct: Product;
    maxProducts?: number;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ currentProduct, maxProducts = 4 }) => {
    const { data } = useProductData();
    const products = Array.isArray(data) ? data : [];

    const relatedProducts = useMemo(() => {
        if (!products || products.length === 0) return [];

        // Find products in the same category or same brand
        const related = products.filter((p: Product) => {
            if (p.id === currentProduct.id) return false;

            // Same category gets priority
            if (p.category && currentProduct.category && p.category === currentProduct.category) {
                return true;
            }

            // Same brand as secondary option
            if (p.brand && currentProduct.brand && p.brand === currentProduct.brand) {
                return true;
            }

            return false;
        });

        // Shuffle and limit
        return related
            .sort(() => Math.random() - 0.5)
            .slice(0, maxProducts);
    }, [products, currentProduct, maxProducts]);

    if (relatedProducts.length === 0) return null;

    return (
        <div className="bg-gray-50 border-t border-gray-200 py-12">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-navy-900">Related Products</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Customers who viewed this item also viewed
                        </p>
                    </div>
                    {currentProduct.category && (
                        <Link
                            to={`/category/${currentProduct.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                            className="hidden md:flex items-center gap-2 text-action-600 hover:text-action-700 font-semibold text-sm transition-colors"
                        >
                            View All {currentProduct.category}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedProducts.map((product: Product) => (
                        <Link
                            key={product.id}
                            to={`/product/${product.sku}`}
                            className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                            {/* Image */}
                            <div className="relative h-48 bg-gray-50 flex items-center justify-center p-4">
                                <img
                                    src={product.image}
                                    alt={`${product.name} - ${product.sku}`}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                />
                                {product.stockStatus === 'IN_STOCK' && (
                                    <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                                        In Stock
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                {/* Brand */}
                                {product.brand && (
                                    <div className="text-xs text-gray-500 mb-1 font-medium">
                                        {product.brand}
                                    </div>
                                )}

                                {/* Title */}
                                <h3 className="font-bold text-navy-900 mb-2 line-clamp-2 group-hover:text-action-600 transition-colors h-12">
                                    {product.name}
                                </h3>

                                {/* SKU */}
                                <div className="text-xs text-gray-500 font-mono mb-3">
                                    SKU: {product.sku}
                                </div>

                                {/* Price */}
                                <div className="flex items-center justify-between">
                                    {product.showPrice && product.price > 0 ? (
                                        <div className="text-xl font-bold text-navy-900">
                                            ${product.price.toLocaleString()}
                                        </div>
                                    ) : (
                                        <div className="text-sm font-semibold text-action-600">
                                            Request Quote
                                        </div>
                                    )}
                                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-action-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Mobile View All Link */}
                {currentProduct.category && (
                    <div className="mt-6 text-center md:hidden">
                        <Link
                            to={`/category/${currentProduct.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                            className="inline-flex items-center gap-2 text-action-600 hover:text-action-700 font-semibold text-sm transition-colors"
                        >
                            View All {currentProduct.category}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelatedProducts;
