import { useState, useEffect, useRef } from 'react'

interface Product {
  id: number
  name: string
  price: string
  image: string
  images?: string[]
  description?: string
  category?: string
  status?: string
  favorite?: boolean
  non_discount_price?: string
}

interface ProductCardProps {
  product: Product
  sizes?: string[]
  onBack?: () => void
  onAddToCart?: (size: string) => void
  onSaveForLater?: () => void
  isAdmin?: boolean
  onEdit?: () => void
}

export function ProductCard({
  product,
  sizes = ['S', 'M', 'L', 'XL'],
  onBack,
  onAddToCart,
  onSaveForLater,
  isAdmin,
  onEdit,
}: ProductCardProps) {
  const { name, price, image, images } = product
  const [selectedSize, setSelectedSize] = useState(sizes[2] || 'L')
  const [isSizeOpen, setIsSizeOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false)
  const sizeDropdownRef = useRef<HTMLDivElement>(null)

  // Image navigation state
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Get array of images
  const imageList = images && images.length > 0 ? images : (image ? [image] : ['/images/placeholder.png'])

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? imageList.length - 1 : prev - 1)
  }

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === imageList.length - 1 ? 0 : prev + 1)
  }

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (distance > minSwipeDistance) {
      handleNextImage()
    } else if (distance < -minSwipeDistance) {
      handlePrevImage()
    }
  }

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
    <div className="flex flex-col flex-1 min-h-0 w-full max-w-[402px] bg-white overflow-y-auto pb-20">
      {/* Product Image */}
      <div
        className="relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={imageList[currentImageIndex]}
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
        {/* Edit Button (Admin only) */}
        {isAdmin && onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-[45px] right-[29px] bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            Редактировать
          </button>
        )}

        {/* Navigation Arrows */}
        {imageList.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute top-1/2 left-2 -translate-y-1/2 w-[40px] h-[40px] flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <svg width="16" height="28" viewBox="0 0 20 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.77 17.96L19.21 31.4c.53.53.78 1.15.77 1.85-.02.71-.3 1.33-.83 1.86-.53.53-1.15.79-1.85.79-.71 0-1.33-.26-1.86-.79L1.27 20.98c-.42-.42-.74-.9-.95-1.43-.21-.53-.32-1.06-.32-1.59 0-.53.11-1.06.32-1.59.21-.53.53-1 .95-1.43L15.45.77c.53-.53 1.16-.79 1.88-.77.72.02 1.35.29 1.88.82.53.53.79 1.15.79 1.85 0 .71-.26 1.33-.79 1.86L5.77 17.96z" fill="currentColor"/>
              </svg>
            </button>
            <button
              onClick={handleNextImage}
              className="absolute top-1/2 right-2 -translate-y-1/2 w-[40px] h-[40px] flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <svg width="16" height="28" viewBox="0 0 20 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.23 17.96L.79 31.4c-.53.53-.78 1.15-.77 1.85.02.71.3 1.33.83 1.86.53.53 1.15.79 1.85.79.71 0 1.33-.26 1.86-.79l14.18-14.13c.42-.42.74-.9.95-1.43.21-.53.32-1.06.32-1.59 0-.53-.11-1.06-.32-1.59-.21-.53-.53-1-.95-1.43L4.55.77c-.53-.53-1.16-.79-1.88-.77-.72.02-1.35.29-1.88.82-.53.53-.79 1.15-.79 1.85 0 .71.26 1.33.79 1.86l13.44 13.43z" fill="currentColor"/>
              </svg>
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {imageList.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {imageList.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
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
          onClick={() => onAddToCart?.(selectedSize)}
          className="w-full h-[48px] bg-black text-white text-[16px] tracking-[-0.01em]"
        >
          Добавить в корзину
        </button>
      </div>
    </div>
  )
}
