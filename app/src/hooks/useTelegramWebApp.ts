import { useEffect, useState } from 'react';

interface UseTelegramWebAppReturn {
  webApp: TelegramWebApp | null;
  user: TelegramWebApp['initDataUnsafe']['user'] | null;
  isReady: boolean;
}

export const useTelegramWebApp = (): UseTelegramWebAppReturn => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setIsReady(true);
    }
  }, []);

  return {
    webApp,
    user: webApp?.initDataUnsafe?.user || null,
    isReady,
  };
};

export default useTelegramWebApp;
