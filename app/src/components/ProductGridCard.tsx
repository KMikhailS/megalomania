import React from 'react';

export interface Product {
  id: number;
  image: string;
  images?: string[];
  name: string;
  price: string;
  non_discount_price?: string;
  description: string;
  category?: string;
  status?: string;
  favorite: boolean;
}

interface ProductGridCardProps {
  product: Product;
  onClick: (product: Product) => void;
  onFavorite?: (product: Product) => void;
}

const ProductGridCard: React.FC<ProductGridCardProps> = ({ product, onClick, onFavorite }) => {
  const isFavorite = Boolean(product.favorite);

  return (
    <div
      className="relative cursor-pointer"
      onClick={() => onClick(product)}
    >
      <div className="relative border border-black">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-[212px] object-cover bg-gray-100"
          loading="lazy"
        />
        {onFavorite && (
          <button
            className="absolute top-3 right-3"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(product);
            }}
          >
            {isFavorite ? (
              <svg width="21" height="19" viewBox="0 0 21 19" fill="none">
                <path
                  d="M10.5 19L9.0225 17.653C3.78 12.8385 0 9.39575 0 5.22951C0 1.78675 2.646 -0.75 6.09 -0.75C8.022 -0.75 9.8805 0.16575 10.5 1.56525C11.1195 0.16575 12.978 -0.75 14.91 -0.75C18.354 -0.75 21 1.78675 21 5.22951C21 9.39575 17.22 12.8385 11.9775 17.653L10.5 19Z"
                  fill="black"
                />
              </svg>
            ) : (
              <svg width="21" height="19" viewBox="0 0 21 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M19.9485 3.23877C21.9987 7.4907 18.9566 13.3062 10.6838 18.737L10.2832 19L9.88263 18.737C1.60991 13.3062 -1.43226 7.4907 0.617936 3.23877C2.35232 -0.3582 7.09558 -1.11603 10.2832 1.75968C13.4709 -1.11603 18.2142 -0.3582 19.9485 3.23877ZM18.6359 3.86702C17.2565 1.0062 13.3067 0.530499 10.8237 3.27162L10.2832 3.86837L9.74268 3.27162C7.25977 0.530499 3.30993 1.0062 1.93051 3.86702C0.294243 7.2605 2.85397 12.2676 10.2832 17.2595C17.7125 12.2676 20.2722 7.2605 18.6359 3.86702Z"
                  fill="black"
                />
              </svg>
            )}
          </button>
        )}
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs tracking-wide leading-tight">{product.name}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-sm font-bold">{product.price}</span>
          {product.non_discount_price && (
            <span className="text-xs text-gray-400 line-through">{product.non_discount_price}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGridCard;
