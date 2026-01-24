interface ProfileProps {
  ordersCount?: number
  addressesCount?: number
  cardsCount?: number
  onLogout?: () => void
}

export function Profile({
  ordersCount = 0,
  addressesCount = 2,
  cardsCount = 2,
  onLogout,
}: ProfileProps) {
  return (
    <div className="flex flex-col w-full max-w-[402px] bg-white min-h-screen">
      {/* Header */}
      <div className="bg-[#F8F8F8] px-4 py-3">
        <h1 className="text-[15px] font-semibold text-center tracking-[-0.016em]">
          Профиль
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* МОИ ЗАКАЗЫ */}
        <div className="pt-8 pb-4 cursor-pointer hover:bg-gray-100 transition-colors">
          <p className="text-[14px] text-center tracking-[2.4%]">
            МОИ ЗАКАЗЫ
          </p>
          <p className="text-[11px] font-light text-center text-black/50 tracking-[3%] mt-2">
            {ordersCount > 0 ? `${ordersCount} активных заказов` : 'Нет активных заказов'}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-[13px] h-[1px] bg-[#C4C4C4]" />

        {/* МОЯ ИНФОРМАЦИЯ */}
        <div className="py-6 cursor-pointer hover:bg-gray-100 transition-colors">
          <p className="text-[14px] text-center tracking-[2.4%]">
            МОЯ ИНФОРМАЦИЯ
          </p>
          <p className="text-[11px] font-light text-center text-black/50 tracking-[3%] mt-2">
            Ф.И.О, номер телефона, почта
          </p>
        </div>

        {/* Divider */}
        <div className="mx-[13px] h-[1px] bg-[#C4C4C4]" />

        {/* АДРЕСНАЯ КНИГА */}
        <div className="py-6 cursor-pointer hover:bg-gray-100 transition-colors">
          <p className="text-[14px] text-center tracking-[2.4%]">
            АДРЕСНАЯ КНИГА
          </p>
          <p className="text-[11px] font-light text-center text-black/50 tracking-[3%] mt-2">
            {addressesCount > 0 ? `Сохранено ${addressesCount} адреса для доставки` : 'Нет сохранённых адресов'}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-[13px] h-[1px] bg-[#C4C4C4]" />

        {/* СПОСОБЫ ОПЛАТЫ */}
        <div className="py-6 cursor-pointer hover:bg-gray-100 transition-colors">
          <p className="text-[14px] text-center tracking-[2.4%]">
            СПОСОБЫ ОПЛАТЫ
          </p>
          <p className="text-[11px] font-light text-center text-black/50 tracking-[3%] mt-2">
            {cardsCount > 0 ? `Сохранено ${cardsCount} банковские карты` : 'Нет сохранённых карт'}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-[13px] h-[1px] bg-[#C4C4C4]" />

        {/* ПОМОЩЬ */}
        <div className="py-6 cursor-pointer hover:bg-gray-100 transition-colors">
          <p className="text-[14px] text-center tracking-[2.4%]">
            ПОМОЩЬ
          </p>
        </div>

        {/* Divider */}
        <div className="mx-[13px] h-[1px] bg-[#C4C4C4]" />

        {/* ВЫЙТИ */}
        <div className="py-6 cursor-pointer hover:bg-gray-100 transition-colors">
          <button
            onClick={onLogout}
            className="w-full text-[14px] text-center tracking-[2.4%]"
          >
            ВЫЙТИ
          </button>
        </div>

        {/* Divider */}
        <div className="mx-[13px] h-[1px] bg-[#C4C4C4]" />
      </div>
    </div>
  )
}
