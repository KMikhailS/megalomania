interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-[#E5E5E5] py-3 px-4">
      <div className="flex justify-around items-end">
        <button
          onClick={() => onTabChange('catalog')}
          className="flex flex-col items-center gap-1"
        >
          <svg width="28" height="21" viewBox="0 0 28 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9.1875" cy="9.1875" r="8.4375" stroke="#787878" strokeWidth="1.5"/>
            <line x1="14.5303" y1="16.0947" x2="18.8614" y2="20.4257" stroke="#787878" strokeWidth="1.5"/>
            <line x1="20.125" y1="3.625" x2="28" y2="3.625" stroke="#787878" strokeWidth="1.5"/>
            <line x1="21.875" y1="8.875" x2="28" y2="8.875" stroke="#787878" strokeWidth="1.5"/>
            <line x1="23.625" y1="14.125" x2="28" y2="14.125" stroke="#787878" strokeWidth="1.5"/>
          </svg>
          <span className={`text-[10px] ${activeTab === 'catalog' ? 'text-black' : 'text-gray-500'}`}>
            Каталог
          </span>
        </button>

        <button
          onClick={() => onTabChange('favorites')}
          className="flex flex-col items-center gap-1"
        >
          <svg width="24" height="22" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M23.25 6.37503C23.25 14.1805 12.0005 20.75 12.0005 20.75C12.0005 20.75 0.75 14.0834 0.75 6.39085C0.75 3.25003 3.25 0.750034 6.375 0.750034C9.5 0.750034 12 4.50003 12 4.50003C12 4.50003 14.5 0.750034 17.625 0.750034C20.75 0.750034 23.25 3.25003 23.25 6.37503Z" stroke="#727272" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          <span className={`text-[10px] ${activeTab === 'favorites' ? 'text-black' : 'text-gray-500'}`}>
            Избранное
          </span>
        </button>

        <button
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center gap-1"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" fill="black" />
          </svg>
          <span className={`text-[10px] ${activeTab === 'home' ? 'text-black' : 'text-gray-500'}`}>
            Главная
          </span>
        </button>

        <button
          onClick={() => onTabChange('cart')}
          className="flex flex-col items-center gap-1"
        >
          <svg width="19" height="21" viewBox="0 0 19 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M14.7778 6.79065H13.1945L13.1945 6.79071V6.79065H4.22224V6.78573H2.70628C2.08734 6.78573 1.9569 6.80732 1.82666 6.86703C1.75855 6.89825 1.71456 6.93595 1.67814 6.99433C1.60848 7.10596 1.58329 7.21777 1.58329 7.74829V18.4898C1.58329 19.0204 1.60848 19.1322 1.67814 19.2438C1.71456 19.3022 1.75855 19.3399 1.82666 19.3711C1.9569 19.4308 2.08734 19.4524 2.70628 19.4524H16.2936C16.9126 19.4524 17.043 19.4308 17.1733 19.3711C17.2414 19.3399 17.2854 19.3022 17.3218 19.2438C17.3914 19.1322 17.4166 19.0204 17.4166 18.4898V7.74829C17.4166 7.21777 17.3914 7.10596 17.3218 6.99433C17.2854 6.93595 17.2414 6.89825 17.1733 6.86703C17.043 6.80732 16.9126 6.78573 16.2936 6.78573H14.7778V6.79065ZM14.7778 4.52381V5.42858H16.2937C17.2347 5.42858 17.576 5.51257 17.92 5.67027C18.264 5.82798 18.534 6.05941 18.718 6.35429C18.902 6.64918 19 6.94167 19 7.74829V18.4898C19 19.2964 18.902 19.5889 18.718 19.8838C18.534 20.1787 18.264 20.4101 17.92 20.5678C17.576 20.7255 17.2347 20.8095 16.2937 20.8095H2.70632C1.76528 20.8095 1.42403 20.7255 1.08 20.5678C0.735963 20.4101 0.465964 20.1787 0.281973 19.8838C0.0979826 19.5889 0 19.2964 0 18.4898V7.74829C0 6.94167 0.0979826 6.64918 0.281973 6.35429C0.465964 6.05941 0.735963 5.82798 1.08 5.67027C1.42403 5.51257 1.76528 5.42858 2.70632 5.42858H4.22224V4.52381C4.22224 2.02538 6.58518 0 9.50001 0C12.4148 0 14.7778 2.02538 14.7778 4.52381ZM9.49997 1.35716C11.5404 1.35716 13.1944 2.77492 13.1944 4.52383V5.43352H5.80553V4.52383C5.80553 2.77492 7.45959 1.35716 9.49997 1.35716Z" fill="#787878"/>
          </svg>

          <span className={`text-[10px] ${activeTab === 'cart' ? 'text-black' : 'text-gray-500'}`}>
            Корзина
          </span>
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className="flex flex-col items-center gap-1"
        >
          <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9.84998" cy="5.0625" r="4.2125" stroke="#787878" strokeWidth="1.7"/>
            <path d="M18.85 20.25C18.85 15.9008 14.8205 12.375 9.84998 12.375C4.87941 12.375 0.849976 15.9008 0.849976 20.25" stroke="#787878" strokeWidth="1.7"/>
          </svg>
          <span className={`text-[10px] ${activeTab === 'profile' ? 'text-black' : 'text-gray-500'}`}>
            Профиль
          </span>
        </button>
      </div>
    </nav>
  )
}
