interface AdminAddPromoBannerProps {
  onClick: () => void
}

const AdminAddPromoBanner = ({ onClick }: AdminAddPromoBannerProps) => {
  return (
    <div
      onClick={onClick}
      className="h-[180px] w-full cursor-pointer border-2 border-dashed border-gray-400 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <path
          d="M24 10V38M10 24H38"
          stroke="#898989"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export default AdminAddPromoBanner
