import React from 'react';

interface AdminAddCardProps {
  onClick: () => void;
}

const AdminAddCard: React.FC<AdminAddCardProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="h-[212px] cursor-pointer border-2 border-dashed border-gray-400 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 10V38M10 24H38"
          stroke="#9CA3AF"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default AdminAddCard;
