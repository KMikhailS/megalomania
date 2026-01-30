import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCdekDeliveryPoints } from '../../../../api/client';
import { useViewportCache } from './useViewportCache';
import type { BoundingBox, DeliveryPoint } from '../../../../types/cdek';

const MIN_ZOOM_FOR_POINTS = 11;
const DEBOUNCE_DELAY = 300;

interface WarningInfo {
  code: string;
  message: string;
  min_zoom?: number;
}

interface UseDeliveryPointsResult {
  points: DeliveryPoint[];
  isLoading: boolean;
  error: string | null;
  warning: WarningInfo | null;
  loadPoints: (bbox: BoundingBox, zoom: number) => void;
}

export function useDeliveryPoints(): UseDeliveryPointsResult {
  const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<WarningInfo | null>(null);

  const { getFromCache, saveToCache } = useViewportCache();
  const debounceTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadPoints = useCallback(
    (bbox: BoundingBox, zoom: number) => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (zoom < MIN_ZOOM_FOR_POINTS) {
        setPoints([]);
        setWarning({
          code: 'ZOOM_TOO_LOW',
          message: 'Приблизьте карту для отображения пунктов выдачи',
          min_zoom: MIN_ZOOM_FOR_POINTS,
        });
        setError(null);
        setIsLoading(false);
        return;
      }

      setWarning(null);

      debounceTimerRef.current = window.setTimeout(async () => {
        const cached = getFromCache(bbox);
        if (cached) {
          setPoints(cached);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);
        abortControllerRef.current = new AbortController();

        try {
          const response = await fetchCdekDeliveryPoints(
            bbox,
            zoom,
            undefined,
            abortControllerRef.current.signal
          );

          if (response.warning) {
            setWarning(response.warning);
            setPoints([]);
          } else {
            setPoints(response.points);
            saveToCache(bbox, response.points);
          }
        } catch (err) {
          const errorName = (err as Error).name;
          if (errorName !== 'AbortError') {
            setError('Не удалось загрузить пункты выдачи');
          }
        } finally {
          setIsLoading(false);
        }
      }, DEBOUNCE_DELAY);
    },
    [getFromCache, saveToCache]
  );

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
    warning,
    loadPoints,
  };
}
