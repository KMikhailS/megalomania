import { useState } from 'react'

interface Product {
  id: number
  name: string
  price: string
  image: string
  images?: string[]
}

interface CartItemData {
  product: Product
  quantity: number
  size: string
}

interface CartProps {
  cartItems?: CartItemData[]
  onIncreaseQuantity?: (productId: number, size: string) => void
  onDecreaseQuantity?: (productId: number, size: string) => void
  onRemoveItem?: (productId: number, size: string) => void
  onCheckout?: () => void
}

export function Cart({
  cartItems = [],
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  onCheckout
}: CartProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<'courier' | 'pickup'>('courier')
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online')

  // Парсинг цены из строки "8 500 ₽" в число
  const parsePrice = (priceStr: string): number => {
    return parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0
  }

  // Расчёт итогов
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + parsePrice(item.product.price) * item.quantity
  }, 0)
  const deliveryCost = deliveryMethod === 'courier' ? 200 : 0
  const discount = 0
  const total = subtotal + deliveryCost - discount

  const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Склонение слова "товар"
  const getItemsWord = (count: number) => {
    if (count === 0) return 'товаров'
    const lastDigit = count % 10
    const lastTwoDigits = count % 100
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'товаров'
    if (lastDigit === 1) return 'товар'
    if (lastDigit >= 2 && lastDigit <= 4) return 'товара'
    return 'товаров'
  }

  return (
    <div className="flex flex-col w-full max-w-[402px] bg-white min-h-screen">
      {/* Header */}
      <div className="bg-[#F8F8F8] px-4 py-3">
        <h1 className="text-[15px] font-semibold text-center tracking-[-0.016em]">
          Корзина
        </h1>
        <p className="text-[12px] font-light text-center tracking-[0.028em] mt-1">
          {itemsCount} {getItemsWord(itemsCount)}
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Empty Cart State */}
        {cartItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[16px] text-gray-500">Корзина пуста</p>
            <p className="text-[14px] text-gray-400 mt-2">Добавьте товары из каталога</p>
          </div>
        )}

        {/* Cart Items */}
        {cartItems.map((item) => (
          <div key={`${item.product.id}-${item.size}`} className="px-[29px] py-4">
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="w-[120px] h-[152px] bg-gray-200 border border-black flex-shrink-0 overflow-hidden">
                {item.product.image && (
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <p className="text-[15px] font-bold tracking-[0.022em]">
                    {item.product.price}
                  </p>
                  {/* Delete Button */}
                  <button
                    onClick={() => onRemoveItem?.(item.product.id, item.size)}
                    className="p-1 text-gray-400 hover:text-black"
                    aria-label="Удалить товар"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <p className="text-[14px] font-light tracking-[0.024em] mt-2">
                  {item.product.name}
                </p>

                {/* Size Display */}
                <div className="flex items-center justify-between w-full h-[38px] px-3 mt-4 border border-black">
                  <span className="text-[11px] tracking-[-0.015em]">
                    Размер: {item.size}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between w-full h-[38px] px-3 mt-2 border border-black">
                  <span className="text-[11px] uppercase tracking-[-0.015em]">
                    Количество:
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onDecreaseQuantity?.(item.product.id, item.size)}
                      className="w-6 h-6 flex items-center justify-center text-[16px] font-medium"
                    >
                      −
                    </button>
                    <span className="text-[13px] w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onIncreaseQuantity?.(item.product.id, item.size)}
                      className="w-6 h-6 flex items-center justify-center text-[16px] font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Delivery Method Section */}
        <div className="mt-2">
          <div className="mx-[13px] h-[40px] bg-[#F2F2F7] rounded-sm" />
          <div className="px-[29px] py-3">
            <span className="text-[17px] tracking-[0.02em]">СПОСОБ ДОСТАВКИ</span>
          </div>

          {/* Courier Option */}
          <div className="px-[29px] py-2 flex items-start gap-4">
            <div className="flex-1">
              <p className="text-[12px] font-light leading-[1.83] tracking-[-0.007em]">
                Доставка курьером СДЕК{'\n'}(Без примерки)
              </p>
            </div>
            <button
              onClick={() => setDeliveryMethod('courier')}
              className={`w-[17px] h-[17px] rounded-full border-[1.5px] border-black flex items-center justify-center`}
            >
              {deliveryMethod === 'courier' && (
                <div className="w-[11px] h-[11px] rounded-full bg-black" />
              )}
            </button>
          </div>

          {/* Pickup Option */}
          <div className="px-[29px] py-2 flex items-start gap-4">
            <div className="flex-1">
              <p className="text-[12px] font-light leading-[1.83] tracking-[-0.007em]">
                Самовывоз{'\n'}(Возможна примерка)
              </p>
            </div>
            <button
              onClick={() => setDeliveryMethod('pickup')}
              className={`w-[17px] h-[17px] rounded-full border-[1.5px] border-black flex items-center justify-center`}
            >
              {deliveryMethod === 'pickup' && (
                <div className="w-[11px] h-[11px] rounded-full bg-black" />
              )}
            </button>
          </div>
        </div>

        {/* Delivery Address Section */}
        {deliveryMethod === 'courier' && (
          <div className="mt-4">
            <div className="mx-[29px] h-[0.5px] bg-[#C4C4C4]" />
            <div className="px-[29px] py-3 flex items-center justify-between">
              <span className="text-[17px] tracking-[-0.014em]">Адрес доставки</span>
              <span className="text-[17px] tracking-[-0.024em]">›</span>
            </div>
            <div className="px-[29px]">
              <p className="text-[13px] font-light tracking-[-0.006em]">
                Улица: Садовническая наб.
              </p>
              <p className="text-[13px] font-light tracking-[-0.006em]">
                Дом: 3; Стр: 1; Квартира 32
              </p>
            </div>
          </div>
        )}

        {/* Payment Section */}
        <div className="mt-2">
          <div className="mx-[13px] h-[40px] bg-[#F2F2F7] rounded-sm" />
          <div className="px-[29px] py-3">
            <span className="text-[17px] tracking-[0.02em]">ОПЛАТА</span>
          </div>

          {/* Online Payment Option */}
          <div className="px-[29px] py-2 flex items-start gap-4">
            <div className="flex-1">
              <p className="text-[12px] font-light leading-[1.83] tracking-[-0.007em]">
                Онлайн{'\n'}(Банковской картой)
              </p>
            </div>
            <button
              onClick={() => setPaymentMethod('online')}
              className={`w-[17px] h-[17px] rounded-full border-[1.5px] border-black flex items-center justify-center`}
            >
              {paymentMethod === 'online' && (
                <div className="w-[11px] h-[11px] rounded-full bg-black" />
              )}
            </button>
          </div>

          {/* Cash Payment Option */}
          <div className="px-[29px] py-2 flex items-start gap-4">
            <div className="flex-1">
              <p className="text-[12px] font-light leading-[1.83] tracking-[-0.007em]">
                Наличными{'\n'}(При получениии)
              </p>
            </div>
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`w-[17px] h-[17px] rounded-full border-[1.5px] border-black flex items-center justify-center`}
            >
              {paymentMethod === 'cash' && (
                <div className="w-[11px] h-[11px] rounded-full bg-black" />
              )}
            </button>
          </div>
        </div>

        {/* Payment Method Section */}
        {paymentMethod === 'online' && (
          <div className="mt-4">
            <div className="mx-[29px] h-[0.5px] bg-[#C4C4C4]" />
            <div className="px-[29px] py-3 flex items-center justify-between">
              <span className="text-[17px] tracking-[-0.014em]">Выбор способа</span>
              <span className="text-[17px] tracking-[-0.024em]">›</span>
            </div>
            <div className="px-[29px]">
              <p className="text-[13px] font-light tracking-[-0.006em]">
                Mastercard (**** **** **** 1234)
              </p>
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="mt-8 px-[29px]">
          <div className="flex justify-between py-1">
            <span className="text-[15px] font-light tracking-[-0.005em]">Стоимость</span>
            <span className="text-[15px] font-light tracking-[-0.005em]">
              {subtotal.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          {deliveryMethod === 'courier' && (
            <div className="flex justify-between py-1">
              <span className="text-[15px] font-light tracking-[-0.005em]">Доставка</span>
              <span className="text-[15px] font-light tracking-[-0.005em]">
                {cartItems.length > 0 ? deliveryCost : 0} ₽
              </span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span className="text-[15px] font-light tracking-[-0.005em]">Скидка</span>
            <span className="text-[15px] font-light tracking-[-0.005em]">
              {discount} ₽
            </span>
          </div>

          {/* Total */}
          <div className="flex justify-between py-3 mt-2">
            <span className="text-[17px] font-bold tracking-[0.02em]">ВСЕГО</span>
            <span className="text-[17px] font-bold tracking-[0.02em]">
              {(cartItems.length > 0 ? total : 0).toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="px-[29px] mt-4 pb-6">
          <button
            onClick={onCheckout}
            className="w-full h-[48px] bg-black text-white text-[16px] tracking-[-0.01em]"
          >
            Оплатить заказ
          </button>
        </div>
      </div>
    </div>
  )
}
