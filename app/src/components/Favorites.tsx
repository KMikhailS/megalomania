interface FavoriteItem {
  id: number
  name: string
  price: string
  image: string
  size: string
  isSoldOut?: boolean
}

interface FavoritesProps {
  items?: FavoriteItem[]
  onAddToCart?: (item: FavoriteItem) => void
  onNotify?: (item: FavoriteItem) => void
  onRemove?: (item: FavoriteItem) => void
}

// Демо-данные
const demoItems: FavoriteItem[] = [
  {
    id: 1,
    name: 'Вечернее платье "Луна"',
    price: '20 000 ₽',
    image: '',
    size: 'L',
  },
  {
    id: 2,
    name: 'Комплект "Спорт"',
    price: '4 500 ₽',
    image: '',
    size: 'L',
    isSoldOut: true,
  },
  {
    id: 3,
    name: 'Коллекция черная пантера',
    price: '12 500 ₽',
    image: '',
    size: 'L',
  },
]

export function Favorites({
  items = demoItems,
  onAddToCart,
  onNotify,
  onRemove,
}: FavoritesProps) {
  return (
    <div className="flex flex-col w-full max-w-[402px] bg-white min-h-screen">
      {/* Header */}
      <div className="bg-[#F8F8F8]/90 backdrop-blur-[27px] px-4 py-3">
        <h1 className="text-[15px] font-semibold text-center tracking-[-0.016em]">
          Избранное
        </h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {items.map((item) => (
          <div key={item.id} className="px-[30px] py-4 relative">
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="w-[120px] h-[152px] bg-gray-200 border border-black flex-shrink-0 relative">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col flex-1">
                <p
                  className={`text-[15px] font-bold tracking-[0.022em] ${
                    item.isSoldOut ? 'text-black/30' : ''
                  }`}
                >
                  {item.price}
                </p>
                <p
                  className={`text-[11px] tracking-[0.036em] mt-2 ${
                    item.isSoldOut ? 'text-black/30' : ''
                  }`}
                >
                  {item.name}
                </p>

                {!item.isSoldOut && (
                  <>
                    {/* Size Selector */}
                    <button className="flex items-center justify-between w-full h-[38px] px-3 mt-4 border border-black">
                      <span className="text-[12px] tracking-[-0.014em]">
                        Размер: {item.size}
                      </span>
                      <svg
                        width="12"
                        height="7"
                        viewBox="0 0 12 7"
                        fill="none"
                      >
                        <path d="M1 1L6 6L11 1" stroke="black" strokeWidth="1" />
                      </svg>
                    </button>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => onAddToCart?.(item)}
                      className="flex items-center justify-center w-full h-[38px] mt-2 bg-black"
                    >
                      <span className="text-[12px] text-white uppercase tracking-[-0.014em]">
                        Добавить в корзину
                      </span>
                    </button>
                  </>
                )}

                {item.isSoldOut && (
                  <div className="mt-auto">
                    <p className="text-[13px] font-semibold tracking-[-0.013em]">
                      РАСПРОДАНО
                    </p>

                    {/* Notify Button */}
                    <button
                      onClick={() => onNotify?.(item)}
                      className="flex items-center justify-center w-full h-[38px] mt-3 bg-black"
                    >
                      <span className="text-[12px] text-white uppercase tracking-[-0.014em]">
                        Оповестить
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => onRemove?.(item)}
              className="absolute top-4 right-[30px] p-1"
              aria-label="Удалить из избранного"
            >
              <svg
                width="15"
                height="19"
                viewBox="0 0 15 19"
                fill="none"
                className="text-black/40"
              >
                <path
                  d="M1 4.5H14M5.5 8V14.5M9.5 8V14.5M2 4.5L3 17C3 17.5523 3.44772 18 4 18H11C11.5523 18 12 17.5523 12 17L13 4.5M5 4.5V2C5 1.44772 5.44772 1 6 1H9C9.55228 1 10 1.44772 10 2V4.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
