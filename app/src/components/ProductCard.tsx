import { useState, useEffect, useRef } from 'react'

interface ProductCardProps {
  name: string
  price: string
  sizes?: string[]
  onBack?: () => void
  onAddToCart?: () => void
  onSaveForLater?: () => void
}

export function ProductCard({
  name,
  price,
  sizes = ['S', 'M', 'L', 'XL'],
  onBack,
  onAddToCart,
  onSaveForLater,
}: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState(sizes[2] || 'L')
  const [isSizeOpen, setIsSizeOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false)
  const sizeDropdownRef = useRef<HTMLDivElement>(null)

  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
        setIsSizeOpen(false)
      }
    }

    if (isSizeOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSizeOpen])

  return (
    <div className="flex flex-col w-full max-w-[402px] bg-white overflow-y-auto">
      {/* Product Image */}
      <div className="relative">
        <img
          src="/images/menu.svg"
          alt={name}
          className="w-full h-[545px] object-cover"
        />
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-[45px] left-[29px] cursor-pointer"
        >
          <img src="/images/menu.svg" alt="Назад" className="w-[15px] h-[26px]" />
        </button>
      </div>

      {/* Size and Save Buttons */}
      <div className="flex gap-3 px-[37px] mt-[30px]">
        {/* Size Selector */}
        <div className="relative" ref={sizeDropdownRef}>
          <button
            onClick={() => setIsSizeOpen(!isSizeOpen)}
            className="flex items-center justify-between w-[167px] h-[48px] px-4 border border-black"
          >
            <span className="text-[15px] tracking-[-0.01em]">
              Размер: {selectedSize}
            </span>
            <span className="text-[17px] tracking-[-0.024em]">›</span>
          </button>
          {isSizeOpen && (
            <div className="absolute top-full left-0 w-full bg-white border border-black border-t-0 z-10">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSize(size)
                    setIsSizeOpen(false)
                  }}
                  className={`w-full px-4 py-2 text-left text-[15px] cursor-pointer transition-colors ${
                    selectedSize === size ? 'bg-gray-200' : 'bg-white size-option'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save for Later Button */}
        <button
          onClick={onSaveForLater}
          className="flex items-center justify-between w-[167px] h-[48px] px-4 border border-black"
        >
          <span className="text-[15px] tracking-[-0.027em]">ОТЛОЖИТЬ</span>
          <img src="/images/menu.svg" alt="" className="w-[16px] h-[15px]" />
        </button>
      </div>

      {/* Price and Name */}
      <div className="px-[37px] mt-[16px]">
        <p className="text-[22px] font-semibold tracking-[0.015em]">{price}</p>
        <p className="text-[14px] font-light tracking-[0.024em] mt-1">{name}</p>
      </div>

      {/* Product Info Accordion */}
      <div className="px-[29px] mt-[18px]">
        <button
          onClick={() => setIsInfoOpen(!isInfoOpen)}
          className="flex items-center justify-between w-full py-3"
        >
          <span className="text-[15px] tracking-[0.022em]">ИНФОРМАЦИЯ О ТОВАРЕ</span>
          <span className={`text-[17px] tracking-[-0.024em] transition-transform ${isInfoOpen ? 'rotate-90' : ''}`}>
            ›
          </span>
        </button>
        {isInfoOpen && (
          <div className="pb-4 text-[14px] text-gray-600">
            <p>Состав: 100% хлопок</p>
            <p>Цвет: молочный</p>
            <p>Уход: машинная стирка при 30°C</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-[21px] h-[0.5px] bg-[#C4C4C4]" />

      {/* Delivery Info Accordion */}
      <div className="px-[29px]">
        <button
          onClick={() => setIsDeliveryOpen(!isDeliveryOpen)}
          className="flex items-center justify-between w-full py-3"
        >
          <span className="text-[15px] tracking-[0.022em]">ДОСТАВКА И ВОЗВРАТ</span>
          <span className={`text-[17px] tracking-[-0.024em] transition-transform ${isDeliveryOpen ? 'rotate-90' : ''}`}>
            ›
          </span>
        </button>
        {isDeliveryOpen && (
          <div className="pb-4 text-[14px] text-gray-600">
            <p>Бесплатная доставка от 5000 ₽</p>
            <p>Возврат в течение 14 дней</p>
          </div>
        )}
      </div>

      {/* Add to Cart Button */}
      <div className="px-[29px] mt-[20px] pb-[20px]">
        <button
          onClick={onAddToCart}
          className="w-full h-[48px] bg-black text-white text-[16px] tracking-[-0.01em]"
        >
          Добавить в корзину
        </button>
      </div>
    </div>
  )
}
