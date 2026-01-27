import { useState } from 'react'
import type { PromoBannerDTO } from '../api/client'

interface AdminPromoBannerCardProps {
  banner: PromoBannerDTO
  onClose: () => void
  onDelete: () => void
  onBlock: () => void
  onSave: (link: number | null) => void
}

const AdminPromoBannerCard = ({
  banner,
  onClose,
  onDelete,
  onBlock,
  onSave,
}: AdminPromoBannerCardProps) => {
  const [linkValue, setLinkValue] = useState<string>(
    banner.link != null ? String(banner.link) : ''
  )

  const handleSave = () => {
    const link = linkValue.trim() === '' ? null : parseInt(linkValue, 10)
    onSave(isNaN(link as number) ? null : link)
  }

  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Banner Image */}
        <div className="px-4 pt-6">
          <div className="relative h-[180px] overflow-hidden">
            <img
              src={banner.image_url}
              alt="Promo Banner"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Link Input */}
        <div className="px-4 pt-6">
          <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wide">
            ССЫЛКА НА ТОВАР (ID ТОВАРА)
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={linkValue}
            onChange={(e) => {
              const val = e.target.value
              if (val === '' || /^\d+$/.test(val)) {
                setLinkValue(val)
              }
            }}
            placeholder="Введите ID товара"
            className="w-full h-[48px] px-4 border border-gray-400 rounded-lg text-sm focus:outline-none focus:border-black"
          />
        </div>

        {/* Action Buttons */}
        <div className="px-4 pt-6 pb-8 flex-1">
          <div className="flex gap-3 mb-3">
            <button
              onClick={handleSave}
              className="flex-1 h-[48px] bg-black text-white rounded-full text-sm font-semibold tracking-wide"
            >
              Сохранить
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-[48px] bg-gray-300 text-black rounded-full text-sm font-semibold tracking-wide"
            >
              Отмена
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onDelete}
              className="flex-1 h-[48px] bg-red-500 text-white rounded-full text-sm font-semibold tracking-wide"
            >
              Удалить
            </button>
            <button
              onClick={onBlock}
              className="flex-1 h-[48px] bg-gray-500 text-white rounded-full text-sm font-semibold tracking-wide"
            >
              {banner.status === 'BLOCKED' ? 'Активировать' : 'Заблокировать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPromoBannerCard
