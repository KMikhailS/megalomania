import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCdekDeliveryPoints } from '../../../../api/client';
import type { DeliveryPoint } from '../../../../types/cdek';

const DEBOUNCE_DELAY = 500;

interface UseDeliveryPointsResult {
  points: DeliveryPoint[];
  isLoading: boolean;
  error: string | null;
  loadPointsByCity: (cityCode: number) => void;
  loadPointsByCoordinates: (lat: number, lon: number) => void;
  clearPoints: () => void;
}

export function useDeliveryPoints(): UseDeliveryPointsResult {
  const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const loadedKeyRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const loadPointsByCity = useCallback(async (cityCode: number) => {
    const key = `city:${cityCode}`;
    // Don't reload if same city
    if (loadedKeyRef.current === key && points.length > 0) {
      return;
    }

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetchCdekDeliveryPoints(
        { cityCode },
        undefined,
        abortControllerRef.current.signal
      );

      setPoints(response.points);
      loadedKeyRef.current = key;
    } catch (err) {
      const errorName = (err as Error).name;
      if (errorName !== 'AbortError') {
        setError('Не удалось загрузить пункты выдачи');
      }
    } finally {
      setIsLoading(false);
    }
  }, [points.length]);

  const loadPointsByCoordinates = useCallback((lat: number, lon: number) => {
    // Round to 2 decimal places for caching
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    const key = `coords:${roundedLat}:${roundedLon}`;

    // Don't reload if same area
    if (loadedKeyRef.current === key) {
      return;
    }

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce coordinate-based loading
    debounceTimerRef.current = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetchCdekDeliveryPoints(
          { lat: roundedLat, lon: roundedLon },
          undefined,
          abortControllerRef.current.signal
        );

        setPoints(response.points);
        loadedKeyRef.current = key;
      } catch (err) {
        const errorName = (err as Error).name;
        if (errorName !== 'AbortError') {
          setError('Не удалось загрузить пункты выдачи');
        }
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  const clearPoints = useCallback(() => {
    setPoints([]);
    loadedKeyRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
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
    loadPointsByCoordinates,
    clearPoints,
  };
}
