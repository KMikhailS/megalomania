import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCdekDeliveryPoints } from '../../../../api/client';
import type { BoundingBox, DeliveryPoint } from '../../../../types/cdek';

const MIN_ZOOM_FOR_POINTS = 11;
const DEBOUNCE_DELAY = 500;

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

  const debounceTimerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const allPointsRef = useRef<Map<string, DeliveryPoint>>(new Map());

  const loadPoints = useCallback(
    (bbox: BoundingBox, zoom: number) => {
      // Отменяем предыдущий debounce таймер
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      // Проверка zoom
      if (zoom < MIN_ZOOM_FOR_POINTS) {
        setWarning({
          code: 'ZOOM_TOO_LOW',
          message: 'Приблизьте карту для отображения пунктов выдачи',
          min_zoom: MIN_ZOOM_FOR_POINTS,
        });
        setError(null);
        setIsLoading(false);
        // Не очищаем points - показываем что было
        return;
      }

      setWarning(null);

      debounceTimerRef.current = window.setTimeout(async () => {
        const currentRequestId = ++requestIdRef.current;

        setIsLoading(true);
        setError(null);

        try {
          const response = await fetchCdekDeliveryPoints(bbox, zoom);

          // Игнорируем устаревший ответ
          if (currentRequestId !== requestIdRef.current) {
            return;
          }

          if (response.warning) {
            setWarning(response.warning);
          } else if (response.points && response.points.length > 0) {
            // Добавляем новые точки к существующим
            for (const point of response.points) {
              if (point.code) {
                allPointsRef.current.set(point.code, point);
              }
            }
            // Фильтруем точки по текущему bbox
            const visiblePoints = Array.from(allPointsRef.current.values()).filter(
              (p) =>
                p.coordinates.latitude >= bbox.south &&
                p.coordinates.latitude <= bbox.north &&
                p.coordinates.longitude >= bbox.west &&
                p.coordinates.longitude <= bbox.east
            );
            setPoints(visiblePoints);
          }
        } catch (err) {
          if (currentRequestId === requestIdRef.current) {
            setError('Не удалось загрузить пункты выдачи');
          }
        } finally {
          if (currentRequestId === requestIdRef.current) {
            setIsLoading(false);
          }
        }
      }, DEBOUNCE_DELAY);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
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
