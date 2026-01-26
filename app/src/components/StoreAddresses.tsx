import { useState, useEffect } from 'react'
import {
  fetchShopAddresses,
  createShopAddress,
  updateShopAddress,
  deleteShopAddress,
  type ShopAddress
} from '../api/client'

interface StoreAddressesProps {
  isOpen: boolean
  onClose: () => void
  onSelectAddress: (address: string) => void
  userMode?: string
  initData?: string
  fromCart?: boolean
}

export function StoreAddresses({
  isOpen,
  onClose,
  onSelectAddress,
  userMode,
  initData,
  fromCart = false
}: StoreAddressesProps) {
  const [addresses, setAddresses] = useState<ShopAddress[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = userMode === 'ADMIN'

  const loadAddresses = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchShopAddresses()
      setAddresses(data)
    } catch (err) {
      console.error('Failed to fetch shop addresses:', err)
      setError('Не удалось загрузить адреса магазинов')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadAddresses()
    }
  }, [isOpen])

  const handleAddressClick = (address: string) => {
    if (!fromCart || isEditing) {
      return
    }
    onSelectAddress(address)
    onClose()
  }

  const handleAddNew = () => {
    setIsEditing(true)
    setEditingId(null)
    setEditValue('')
  }

  const handleEdit = (address: ShopAddress) => {
    setIsEditing(true)
    setEditingId(address.id)
    setEditValue(address.address)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingId(null)
    setEditValue('')
  }

  const handleSave = async () => {
    if (!editValue.trim() || !initData) return

    setIsSubmitting(true)
    setError(null)

    try {
      if (editingId === null) {
        await createShopAddress(editValue.trim(), initData)
      } else {
        await updateShopAddress(editingId, editValue.trim(), initData)
      }

      await loadAddresses()

      setIsEditing(false)
      setEditingId(null)
      setEditValue('')
    } catch (err) {
      console.error('Failed to save address:', err)
      setError('Не удалось сохранить адрес')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (addressId: number) => {
    if (!initData) return
    if (!confirm('Вы уверены, что хотите удалить этот адрес?')) return

    setIsSubmitting(true)
    setError(null)

    try {
      await deleteShopAddress(addressId, initData)
      await loadAddresses()
    } catch (err) {
      console.error('Failed to delete address:', err)
      setError('Не удалось удалить адрес')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Header */}
        <div className="bg-[#F8F8F8] px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 text-black"
            >
              <svg width="12" height="21" viewBox="0 0 12 21" fill="none">
                <path d="M11 1L2 10.5L11 20" stroke="black" strokeWidth="2"/>
              </svg>
            </button>
            <h1 className="text-[15px] font-semibold tracking-[-0.016em]">
              Адреса магазинов
            </h1>
            <div className="w-8" />
          </div>
        </div>

        {/* Add New Button (ADMIN only) */}
        {isAdmin && !isEditing && (
          <div className="px-[29px] mt-6">
            <button
              onClick={handleAddNew}
              disabled={isSubmitting}
              className="w-full h-[48px] bg-black text-white text-[14px] tracking-[-0.01em] disabled:opacity-50"
            >
              Добавить адрес
            </button>
          </div>
        )}

        {/* Edit Form (ADMIN only) */}
        {isAdmin && isEditing && (
          <div className="px-[29px] mt-6">
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Введите адрес магазина"
                disabled={isSubmitting}
                className="w-full h-[48px] px-4 text-[14px] font-light tracking-[-0.006em] border border-black outline-none disabled:opacity-50"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || !editValue.trim()}
                  className="flex-1 h-[48px] bg-black text-white text-[14px] tracking-[-0.01em] disabled:opacity-50"
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="flex-1 h-[48px] border border-black text-black text-[14px] tracking-[-0.01em] disabled:opacity-50"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center mt-12">
            <p className="text-[14px] font-light text-gray-500">Загрузка адресов...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex justify-center items-center mt-12">
            <p className="text-[14px] font-light text-red-500">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && addresses.length === 0 && (
          <div className="flex justify-center items-center mt-12">
            <p className="text-[14px] font-light text-gray-500">Нет доступных адресов</p>
          </div>
        )}

        {/* Address List */}
        {!isLoading && !error && addresses.length > 0 && (
          <div className="flex flex-col mt-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="px-[29px] py-4 border-b border-[#C4C4C4] last:border-b-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleAddressClick(address.address)}
                    disabled={!fromCart || isEditing || isSubmitting}
                    className={`flex-1 text-[14px] font-light tracking-[-0.006em] text-black text-left ${
                      fromCart && !isEditing && !isSubmitting
                        ? 'hover:opacity-70 cursor-pointer'
                        : 'cursor-default'
                    }`}
                  >
                    {address.address}
                  </button>

                  {/* Edit and Delete buttons (ADMIN only) */}
                  {isAdmin && !isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(address)}
                        disabled={isSubmitting}
                        className="px-3 py-1 border border-black text-black text-[12px] tracking-[-0.006em] hover:opacity-70 disabled:opacity-50"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        disabled={isSubmitting}
                        className="px-3 py-1 bg-black text-white text-[12px] tracking-[-0.006em] hover:opacity-70 disabled:opacity-50"
                      >
                        Удалить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
