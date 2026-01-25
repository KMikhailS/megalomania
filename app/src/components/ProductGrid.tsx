import React from 'react';
import ProductGridCard from './ProductGridCard';
import type { Product } from './ProductGridCard';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onFavorite?: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductClick, onFavorite }) => {
  return (
    <div className="grid grid-cols-2 gap-4 px-4">
      {products.map((product) => (
        <ProductGridCard
          key={product.id}
          product={product}
          onClick={onProductClick}
          onFavorite={onFavorite}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
