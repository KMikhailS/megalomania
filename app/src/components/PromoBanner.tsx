import { useState, useEffect } from 'react'
import type { PromoBannerDTO } from '../api/client'
import AdminAddPromoBanner from './AdminAddPromoBanner'

interface PromoBannerProps {
  banners: PromoBannerDTO[]
  isAdminMode?: boolean
  onAddNew?: () => void
  onEdit?: (banner: PromoBannerDTO) => void
  onBannerClick?: (banner: PromoBannerDTO) => void
}

const PromoBanner = ({ banners, isAdminMode, onAddNew, onEdit, onBannerClick }: PromoBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  if (banners.length === 0) {
    if (isAdminMode && onAddNew) {
      return <AdminAddPromoBanner onClick={onAddNew} />
    }
    return null
  }

  const current = banners[currentIndex]

  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % banners.length)

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX)
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (distance > 50) handleNext()
    else if (distance < -50) handlePrev()
    setTouchStart(0)
    setTouchEnd(0)
  }

  return (
    <div>
      <div
        className="relative h-[180px] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={current.image_url}
          alt="Promo Banner"
          className={`w-full h-full object-cover ${current.link ? 'cursor-pointer' : ''}`}
          onClick={() => current.link && onBannerClick?.(current)}
        />

        {/* BLOCKED status */}
        {current.status === 'BLOCKED' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-500/90 text-white text-sm font-semibold px-4 py-2 rounded-full">
            Не активна
          </div>
        )}

        {/* Admin edit button */}
        {isAdminMode && onEdit && (
          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(current) }}
              className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        )}

        {/* Navigation arrows */}
        {banners.length > 1 && (
          <>
            <button onClick={handlePrev} className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-300">
              <svg width="12" height="21" viewBox="0 0 12 21" fill="none">
                <path d="M11 1L2 10.5L11 20" stroke="#C7C7C7" strokeWidth="2"/>
              </svg>
            </button>
            <button onClick={handleNext} className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-300">
              <svg width="12" height="21" viewBox="0 0 12 21" fill="none">
                <path d="M1 1L10 10.5L1 20" stroke="#C7C7C7" strokeWidth="2"/>
              </svg>
            </button>
          </>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
            {banners.map((_, i) => (
              <div
                key={i}
                className={`rounded-full ${
                  i === currentIndex
                    ? 'w-2.5 h-2.5 bg-white border border-white'
                    : 'w-1.5 h-1.5 bg-white/60 border border-white'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Admin add new banner */}
      {isAdminMode && onAddNew && (
        <div className="mt-2">
          <AdminAddPromoBanner onClick={onAddNew} />
        </div>
      )}
    </div>
  )
}

export default PromoBanner
