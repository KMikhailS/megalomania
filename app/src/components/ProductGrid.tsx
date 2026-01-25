import React from 'react';
import ProductGridCard from './ProductGridCard';
import AdminAddCard from './AdminAddCard';
import type { Product } from './ProductGridCard';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onFavorite?: (product: Product) => void;
  isAdminMode?: boolean;
  onAddNewCard?: () => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onProductClick,
  onFavorite,
  isAdminMode,
  onAddNewCard
}) => {
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
      {isAdminMode && onAddNewCard && (
        <AdminAddCard onClick={onAddNewCard} />
      )}
    </div>
  );
};

export default ProductGrid;
