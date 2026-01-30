import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { suggestAddress, type AddressSuggestion } from '../api/client'

// Типы для СДЭК виджета
interface CDEKTariff {
  tariff_code?: number
  tariff_name?: string
  delivery_sum?: number
  period_min?: number
  period_max?: number
}

interface CDEKWidgetOptions {
  from?: string
  root?: string
  apiKey?: string
  servicePath?: string
  defaultLocation?: string | [number, number]
  lang?: 'rus' | 'eng'
  currency?: string
  tariffs?: {
    office?: number[]
    door?: number[]
  }
  goods?: Array<{
    width: number
    height: number
    length: number
    weight: number
  }>
  hideFilters?: {
    have_cashless?: boolean
    have_cash?: boolean
    is_dressing_room?: boolean
    type?: boolean
  }
  hideDeliveryOptions?: {
    door?: boolean
    office?: boolean
  }
  onReady?: () => void
  onCalculate?: (data: unknown) => void
  onChoose?: (mode: string, tariff: CDEKTariff, address: CDEKAddress) => void
}

interface CDEKAddress {
  code?: string
  name?: string
  address?: string
  city?: string
  postal_code?: string
}

interface CDEKWidgetInstance {
  open: () => void
  close: () => void
}

declare global {
  interface Window {
    CDEKWidget?: new (options: CDEKWidgetOptions) => CDEKWidgetInstance
  }
}

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
  selectedPickupAddress?: string
  onOpenStoreAddresses?: () => void
}

export function Cart({
  cartItems = [],
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  onCheckout,
  selectedPickupAddress = '',
  onOpenStoreAddresses
}: CartProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<'courier' | 'pickup' | 'cdek'>('courier')
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  // СДЭК состояния
  const [selectedCdekAddress, setSelectedCdekAddress] = useState<string>('')
  const [selectedCdekCode, setSelectedCdekCode] = useState<string>('')
  const [cdekDeliveryCost, setCdekDeliveryCost] = useState<number>(0)
  const [cdekDeliveryPeriod, setCdekDeliveryPeriod] = useState<string>('')
  const [showCdekWidget, setShowCdekWidget] = useState(false)
  const [isCdekWidgetReady, setIsCdekWidgetReady] = useState(false)
  const [isCdekWidgetInitialized, setIsCdekWidgetInitialized] = useState(false)
  const cdekWidgetRef = useRef<CDEKWidgetInstance | null>(null)
  const cdekContainerRef = useRef<HTMLDivElement>(null)

  const debouncedAddress = useDebounce(deliveryAddress, 300)

  // Fetch address suggestions when debounced address changes
  useEffect(() => {
    if (deliveryMethod !== 'courier' || debouncedAddress.length < 3) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true)
      try {
        const result = await suggestAddress(debouncedAddress)
        setSuggestions(result)
      } catch (error) {
        console.error('Failed to fetch address suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    fetchSuggestions()
  }, [debouncedAddress, deliveryMethod])

  // Предварительная инициализация виджета СДЭК при выборе способа доставки
  useEffect(() => {
    // Инициализируем виджет когда выбрана доставка СДЭК и контейнер готов
    if (deliveryMethod !== 'cdek' || isCdekWidgetInitialized) return

    // Ждём появления контейнера в DOM
    const initWidget = () => {
      const container = document.getElementById('cdek-widget-container')
      if (!container || !window.CDEKWidget) return

      try {
        setIsCdekWidgetReady(false)
        cdekWidgetRef.current = new window.CDEKWidget({
          from: 'Москва',
          root: 'cdek-widget-container',
          apiKey: '3878f4b1-b0c2-4623-8ddse-9781243e39f0',
          servicePath: '/api/cdek/service.php',
          defaultLocation: 'Москва',
          lang: 'rus',
          currency: 'RUB',
          hideDeliveryOptions: {
            door: true // Скрываем доставку до двери, показываем только ПВЗ
          },
          onReady: () => {
            console.log('CDEK Widget ready')
            setIsCdekWidgetReady(true)
          },
          onChoose: (_mode, tariff, address) => {
            console.log('CDEK address selected:', address, 'tariff:', tariff)
            const fullAddress = [address.city, address.address].filter(Boolean).join(', ')
            setSelectedCdekAddress(fullAddress)
            setSelectedCdekCode(address.code || '')

            // Сохраняем стоимость доставки
            if (tariff?.delivery_sum) {
              setCdekDeliveryCost(Math.ceil(tariff.delivery_sum))
            }

            // Формируем срок доставки
            if (tariff?.period_min && tariff?.period_max) {
              if (tariff.period_min === tariff.period_max) {
                setCdekDeliveryPeriod(`${tariff.period_min} дн.`)
              } else {
                setCdekDeliveryPeriod(`${tariff.period_min}-${tariff.period_max} дн.`)
              }
            }

            setShowCdekWidget(false)
          }
        })
        setIsCdekWidgetInitialized(true)
      } catch (error) {
        console.error('Failed to initialize CDEK Widget:', error)
      }
    }

    // Небольшая задержка для появления контейнера в DOM
    const timer = setTimeout(initWidget, 100)
    return () => clearTimeout(timer)
  }, [deliveryMethod, isCdekWidgetInitialized])

  const handleOpenCdekWidget = () => {
    setShowCdekWidget(true)
  }

  const handleCloseCdekWidget = () => {
    setShowCdekWidget(false)
  }

  // Парсинг цены из строки "8 500 ₽" в число
  const parsePrice = (priceStr: string): number => {
    return parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0
  }

  // Расчёт итогов
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + parsePrice(item.product.price) * item.quantity
  }, 0)
  const deliveryCost =
    deliveryMethod === 'courier' ? 200 :
    deliveryMethod === 'cdek' ? cdekDeliveryCost :
    0
  const total = subtotal + deliveryCost

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
                Доставка курьером{'\n'}(Без примерки)
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

          {/* CDEK Option */}
          <div className="px-[29px] py-2 flex items-start gap-4">
            <div className="flex-1">
              <p className="text-[12px] font-light leading-[1.83] tracking-[-0.007em]">
                Доставка СДЭК{'\n'}(Пункты выдачи по всей России)
              </p>
            </div>
            <button
              onClick={() => setDeliveryMethod('cdek')}
              className={`w-[17px] h-[17px] rounded-full border-[1.5px] border-black flex items-center justify-center`}
            >
              {deliveryMethod === 'cdek' && (
                <div className="w-[11px] h-[11px] rounded-full bg-black" />
              )}
            </button>
          </div>
        </div>

        {/* Pickup Address Section */}
        {deliveryMethod === 'pickup' && (
          <div className="mt-4">
            <div className="mx-[29px] h-[0.5px] bg-[#C4C4C4]" />
            <div className="px-[29px] py-3 flex items-center justify-between">
              <span className="text-[17px] tracking-[-0.014em]">Адрес самовывоза</span>
              <button
                onClick={onOpenStoreAddresses}
                className="text-[14px] tracking-[-0.014em] text-black hover:opacity-70"
              >
                Выбрать
              </button>
            </div>
            <div className="px-[29px]">
              {selectedPickupAddress ? (
                <p className="text-[13px] font-light tracking-[-0.006em]">
                  {selectedPickupAddress}
                </p>
              ) : (
                <p className="text-[13px] font-light tracking-[-0.006em] text-gray-400">
                  Выберите адрес магазина
                </p>
              )}
            </div>
          </div>
        )}

        {/* CDEK Address Section */}
        {deliveryMethod === 'cdek' && (
          <div className="mt-4">
            <div className="mx-[29px] h-[0.5px] bg-[#C4C4C4]" />
            <div className="px-[29px] py-3">
              <span className="text-[17px] tracking-[-0.014em]">Пункт выдачи СДЭК</span>
            </div>
            <div className="px-[29px]">
              {selectedCdekAddress ? (
                <div>
                  <p className="text-[13px] font-light tracking-[-0.006em]">
                    {selectedCdekAddress}
                  </p>
                  {selectedCdekCode && (
                    <p className="text-[11px] font-light tracking-[-0.006em] text-gray-500 mt-1">
                      Код ПВЗ: {selectedCdekCode}
                    </p>
                  )}
                  {(cdekDeliveryCost > 0 || cdekDeliveryPeriod) && (
                    <p className="text-[13px] font-medium tracking-[-0.006em] mt-2">
                      {cdekDeliveryCost > 0 && `${cdekDeliveryCost} ₽`}
                      {cdekDeliveryCost > 0 && cdekDeliveryPeriod && ' • '}
                      {cdekDeliveryPeriod && `Срок: ${cdekDeliveryPeriod}`}
                    </p>
                  )}
                  <button
                    onClick={handleOpenCdekWidget}
                    className="mt-3 text-[14px] tracking-[-0.014em] text-black underline hover:opacity-70"
                  >
                    Изменить
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-[13px] font-light tracking-[-0.006em] text-gray-400 mb-3">
                    Выберите пункт выдачи на карте
                  </p>
                  <button
                    onClick={handleOpenCdekWidget}
                    className="w-full h-[44px] bg-black text-white text-[14px] tracking-[-0.01em]"
                  >
                    Оформить доставку
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivery Address Section */}
        {deliveryMethod === 'courier' && (
          <div className="mt-4">
            <div className="mx-[29px] h-[0.5px] bg-[#C4C4C4]" />
            <div className="px-[29px] py-3">
              <span className="text-[17px] tracking-[-0.014em]">Адрес доставки</span>
            </div>
            <div className="px-[29px] relative">
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setShowSuggestions(false), 200)
                }}
                placeholder="Введите адрес доставки"
                className="w-full h-[38px] px-3 text-[13px] font-light tracking-[-0.006em] border border-black outline-none"
              />
              {/* Address suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-black border-t-0 z-10 max-h-[200px] overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setDeliveryAddress(suggestion.value)
                        setSuggestions([])
                        setShowSuggestions(false)
                      }}
                      className="w-full px-3 py-2 text-left text-[13px] font-light tracking-[-0.006em] hover:bg-[#F2F2F7] border-b border-[#C4C4C4] last:border-b-0"
                    >
                      {suggestion.value}
                    </button>
                  ))}
                </div>
              )}
              {/* Loading indicator */}
              {showSuggestions && isLoadingSuggestions && deliveryAddress.length >= 3 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-black border-t-0 z-10 px-3 py-2 text-[13px] font-light text-gray-500">
                  Загрузка...
                </div>
              )}
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
        {/*{paymentMethod === 'online' && (*/}
        {/*  <div className="mt-4">*/}
        {/*    <div className="mx-[29px] h-[0.5px] bg-[#C4C4C4]" />*/}
        {/*    <div className="px-[29px] py-3 flex items-center justify-between">*/}
        {/*      <span className="text-[17px] tracking-[-0.014em]">Выбор способа</span>*/}
        {/*      <span className="text-[17px] tracking-[-0.024em]">›</span>*/}
        {/*    </div>*/}
        {/*    <div className="px-[29px]">*/}
        {/*      <p className="text-[13px] font-light tracking-[-0.006em]">*/}
        {/*        Mastercard (**** **** **** 1234)*/}
        {/*      </p>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*)}*/}

        {/* Summary Section */}
        <div className="mt-8 px-[29px]">
          <div className="flex justify-between py-1">
            <span className="text-[15px] font-light tracking-[-0.005em]">Стоимость</span>
            <span className="text-[15px] font-light tracking-[-0.005em]">
              {subtotal.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          {(deliveryMethod === 'courier' || (deliveryMethod === 'cdek' && cdekDeliveryCost > 0)) && (
            <div className="flex justify-between py-1">
              <span className="text-[15px] font-light tracking-[-0.005em]">
                Доставка{deliveryMethod === 'cdek' && cdekDeliveryPeriod ? ` (${cdekDeliveryPeriod})` : ''}
              </span>
              <span className="text-[15px] font-light tracking-[-0.005em]">
                {cartItems.length > 0 ? deliveryCost : 0} ₽
              </span>
            </div>
          )}

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

      {/* CDEK Widget Container - скрытый, инициализируется при выборе СДЭК */}
      {deliveryMethod === 'cdek' && (
        <div
          id="cdek-widget-container"
          ref={cdekContainerRef}
          className={`fixed inset-0 z-40 ${showCdekWidget ? '' : 'pointer-events-none opacity-0'}`}
          style={{ visibility: showCdekWidget ? 'visible' : 'hidden' }}
        />
      )}

      {/* CDEK Widget Modal Overlay */}
      {showCdekWidget && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <h2 className="text-[17px] font-semibold">Выберите пункт выдачи</h2>
            <button
              onClick={handleCloseCdekWidget}
              className="p-2 text-gray-500 hover:text-black"
              aria-label="Закрыть"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          {/* Loading indicator */}
          {!isCdekWidgetReady && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[14px] text-gray-500">Загрузка карты...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
