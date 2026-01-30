import { useRef, useCallback } from 'react';
import type { BoundingBox, DeliveryPoint, ViewportCacheEntry } from '../../../../types/cdek';

const CACHE_TTL = 60 * 60 * 1000;

function bboxToCacheKey(bbox: BoundingBox, precision: number = 2): string {
  return [
    bbox.south.toFixed(precision),
    bbox.west.toFixed(precision),
    bbox.north.toFixed(precision),
    bbox.east.toFixed(precision),
  ].join('_');
}

function bboxContains(outer: BoundingBox, inner: BoundingBox): boolean {
  return (
    outer.south <= inner.south &&
    outer.west <= inner.west &&
    outer.north >= inner.north &&
    outer.east >= inner.east
  );
}

export function useViewportCache() {
  const cacheRef = useRef<Map<string, ViewportCacheEntry>>(new Map());

  const getFromCache = useCallback((bbox: BoundingBox): DeliveryPoint[] | null => {
    const now = Date.now();

    const exactKey = bboxToCacheKey(bbox);
    const exactEntry = cacheRef.current.get(exactKey);
    if (exactEntry && now - exactEntry.timestamp < CACHE_TTL) {
      return exactEntry.points;
    }

    for (const [key, entry] of cacheRef.current) {
      if (now - entry.timestamp >= CACHE_TTL) {
        cacheRef.current.delete(key);
        continue;
      }

      if (bboxContains(entry.bbox, bbox)) {
        return entry.points.filter((point) =>
          point.coordinates.latitude >= bbox.south &&
          point.coordinates.latitude <= bbox.north &&
          point.coordinates.longitude >= bbox.west &&
          point.coordinates.longitude <= bbox.east
        );
      }
    }

    return null;
  }, []);

  const saveToCache = useCallback((bbox: BoundingBox, points: DeliveryPoint[]) => {
    const key = bboxToCacheKey(bbox);
    cacheRef.current.set(key, {
      points,
      timestamp: Date.now(),
      bbox,
    });

    if (cacheRef.current.size > 50) {
      const entries = Array.from(cacheRef.current.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < 10; i += 1) {
        cacheRef.current.delete(entries[i][0]);
      }
    }
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    getFromCache,
    saveToCache,
    clearCache,
  };
}
