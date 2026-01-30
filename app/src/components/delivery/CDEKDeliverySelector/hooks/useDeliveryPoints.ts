import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCdekDeliveryPoints } from '../../../../api/client';
import type { DeliveryPoint } from '../../../../types/cdek';

interface UseDeliveryPointsResult {
  points: DeliveryPoint[];
  isLoading: boolean;
  error: string | null;
  loadPointsByCity: (cityCode: number) => void;
  clearPoints: () => void;
}

export function useDeliveryPoints(): UseDeliveryPointsResult {
  const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const loadedCityRef = useRef<number | null>(null);

  const loadPointsByCity = useCallback(async (cityCode: number) => {
    // Don't reload if same city
    if (loadedCityRef.current === cityCode && points.length > 0) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetchCdekDeliveryPoints(
        cityCode,
        undefined,
        abortControllerRef.current.signal
      );

      setPoints(response.points);
      loadedCityRef.current = cityCode;
    } catch (err) {
      const errorName = (err as Error).name;
      if (errorName !== 'AbortError') {
        setError('Не удалось загрузить пункты выдачи');
      }
    } finally {
      setIsLoading(false);
    }
  }, [points.length]);

  const clearPoints = useCallback(() => {
    setPoints([]);
    loadedCityRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    points,
    isLoading,
    error,
    loadPointsByCity,
    clearPoints,
  };
}
