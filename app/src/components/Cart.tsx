import { useState } from 'react'

interface CartItem {
  id: number
  name: string
  price: number
  image: string
  size: string
  quantity: number
}

interface CartProps {
  items?: CartItem[]
  onCheckout?: () => void
}

export function Cart({ items = [], onCheckout }: CartProps) {
  const [region] = useState('Москва')
  const [deliveryMethod, setDeliveryMethod] = useState<'courier' | 'pickup'>('courier')
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online')
  const [isPromoActivated] = useState(true)

  // Расчёт итогов
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryCost = deliveryMethod === 'courier' ? 200 : 0
  const discount = isPromoActivated ? 0 : 0
  const total = subtotal + deliveryCost - discount

  // Моковые данные для демонстрации
  const demoItem: CartItem = {
    id: 1,
    name: 'Комплект «Клава»',
    price: 8500,
    image: '',
    size: 'L',
    quantity: 1,
  }

  const cartItems = items.length > 0 ? items : [demoItem]
  const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex flex-col w-full max-w-[402px] bg-white min-h-screen">
      {/* Header */}
      <div className="bg-[#F8F8F8] px-4 py-3">
        <h1 className="text-[15px] font-semibold text-center tracking-[-0.016em]">
          Корзина
        </h1>
        <p className="text-[12px] font-light text-center tracking-[0.028em] mt-1">
          {itemsCount} товар
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Cart Items */}
        {cartItems.map((item) => (
          <div key={item.id} className="px-[29px] py-4">
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="w-[120px] h-[152px] bg-gray-200 border border-black flex-shrink-0">
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
                <p className="text-[15px] font-bold tracking-[0.022em]">
                  {item.price.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-[14px] font-light tracking-[0.024em] mt-2">
                  {item.name}
                </p>

                {/* Size Selector */}
                <button className="flex items-center justify-between w-full h-[38px] px-3 mt-4 border border-black">
                  <span className="text-[11px] tracking-[-0.015em]">
                    Размер: {item.size}
                  </span>
                  <span className="text-[10px]">›</span>
                </button>

                {/* Quantity Selector */}
                <button className="flex items-center justify-between w-full h-[38px] px-3 mt-2 border border-black">
                  <span className="text-[11px] uppercase tracking-[-0.015em]">
                    Количество: {item.quantity} шт
                  </span>
                  <span className="text-[10px]">›</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Region Section */}
        <div className="mt-4">
          <div className="mx-[13px] h-[40px] bg-[#F2F2F7] rounded-sm" />
          <div className="px-[29px] py-3 flex items-center justify-between">
            <span className="text-[17px] tracking-[0.02em]">РЕГИОН</span>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-light tracking-[-0.027em]">{region}</span>
              <span className="text-[17px] tracking-[-0.024em]">›</span>
            </div>
          </div>
        </div>

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
        <div className="mt-4">
          <div className="mx-[29px] h-[0.5px] bg-[#C4C4C4]" />
          <div className="px-[29px] py-3 flex items-center justify-between">
            <span className="text-[17px] tracking-[-0.014em]">Адрес доставки</span>
            <span className="text-[17px] tracking-[-0.024em]">›</span>
          </div>
          <div className="px-[29px]">
            <p className="text-[13px] font-light tracking-[-0.006em]">Город: {region}</p>
            <p className="text-[13px] font-light tracking-[-0.006em]">
              Улица: Садовническая наб.
            </p>
            <p className="text-[13px] font-light tracking-[-0.006em]">
              Дом: 3; Стр: 1; Квартира 32
            </p>
          </div>
        </div>

        {/* Promo Code Section */}
        <div className="mt-6">
          <div className="mx-[13px] h-[40px] bg-[#F2F2F7] rounded-sm" />
          <div className="px-[29px] py-3 flex items-center justify-between">
            <span className="text-[17px] tracking-[0.02em]">ПРОМОКОД</span>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-light tracking-[-0.027em]">
                {isPromoActivated ? 'Активирован' : 'Ввести'}
              </span>
              <span className="text-[17px] tracking-[-0.024em]">›</span>
            </div>
          </div>
        </div>

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

        {/* Summary Section */}
        <div className="mt-8 px-[29px]">
          <div className="flex justify-between py-1">
            <span className="text-[15px] font-light tracking-[-0.005em]">Стоимость</span>
            <span className="text-[15px] font-light tracking-[-0.005em]">
              {subtotal > 0 ? subtotal.toLocaleString('ru-RU') : '2 000'} ₽
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[15px] font-light tracking-[-0.005em]">Доставка</span>
            <span className="text-[15px] font-light tracking-[-0.005em]">
              {deliveryCost} ₽
            </span>
          </div>
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
              {total > 0 ? total.toLocaleString('ru-RU') : '1 800'} ₽
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
