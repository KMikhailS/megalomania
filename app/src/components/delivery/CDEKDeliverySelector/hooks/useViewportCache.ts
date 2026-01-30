import { useCallback, useRef } from 'react';
import type { BoundingBox, DeliveryPoint, ViewportCacheEntry } from '../../../../types/cdek';

const CACHE_TTL = 5 * 60 * 1000; // 5 минут
const MAX_CACHE_SIZE = 10;

function bboxContains(outer: BoundingBox, inner: BoundingBox): boolean {
  return (
    outer.south <= inner.south &&
    outer.west <= inner.west &&
    outer.north >= inner.north &&
    outer.east >= inner.east
  );
}

export function useViewportCache() {
  const cacheRef = useRef<ViewportCacheEntry[]>([]);

  const getFromCache = useCallback((bbox: BoundingBox): DeliveryPoint[] | null => {
    const now = Date.now();

    // Удаляем устаревшие записи
    cacheRef.current = cacheRef.current.filter(
      (entry) => now - entry.timestamp < CACHE_TTL
    );

    // Ищем запись, которая содержит запрошенный bbox
    for (const entry of cacheRef.current) {
      if (bboxContains(entry.bbox, bbox)) {
        // Фильтруем точки по текущему bbox
        return entry.points.filter((point) => {
          const lat = point.coordinates.latitude;
          const lon = point.coordinates.longitude;
          return (
            lat >= bbox.south &&
            lat <= bbox.north &&
            lon >= bbox.west &&
            lon <= bbox.east
          );
        });
      }
    }

    return null;
  }, []);

  const saveToCache = useCallback((bbox: BoundingBox, points: DeliveryPoint[]): void => {
    // Ограничиваем размер кэша
    if (cacheRef.current.length >= MAX_CACHE_SIZE) {
      cacheRef.current.shift();
    }

    cacheRef.current.push({
      bbox,
      points,
      timestamp: Date.now(),
    });
  }, []);

  return { getFromCache, saveToCache };
}
