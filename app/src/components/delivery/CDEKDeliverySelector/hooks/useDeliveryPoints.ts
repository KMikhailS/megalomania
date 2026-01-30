import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCdekDeliveryPoints } from '../../../../api/client';
import type { BoundingBox, DeliveryPoint } from '../../../../types/cdek';

const MIN_ZOOM_FOR_POINTS = 11;
const DEBOUNCE_DELAY = 300;
const REQUEST_BUFFER_PERCENT = 0.25;
const HYSTERESIS_BUFFER_PERCENT = 0.2;
const MAX_BACKEND_BBOX_AREA = 4.0;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const bboxContains = (outer: BoundingBox, inner: BoundingBox) => {
  return (
    outer.south <= inner.south &&
    outer.west <= inner.west &&
    outer.north >= inner.north &&
    outer.east >= inner.east
  );
};

const expandBbox = (bbox: BoundingBox, percent: number): BoundingBox => {
  if (percent <= 0) {
    return bbox;
  }
  const latDelta = (bbox.north - bbox.south) * percent;
  const lonDelta = (bbox.east - bbox.west) * percent;

  return {
    south: clamp(bbox.south - latDelta, -90, 90),
    west: clamp(bbox.west - lonDelta, -180, 180),
    north: clamp(bbox.north + latDelta, -90, 90),
    east: clamp(bbox.east + lonDelta, -180, 180),
  };
};

const filterPointsByBbox = (points: DeliveryPoint[], bbox: BoundingBox) => {
  return points.filter((point) => {
    const latitude = point.coordinates?.latitude;
    const longitude = point.coordinates?.longitude;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }

    return (
      latitude >= bbox.south &&
      latitude <= bbox.north &&
      longitude >= bbox.west &&
      longitude <= bbox.east
    );
  });
};

const getSafeBufferPercent = (bbox: BoundingBox, desiredPercent: number) => {
  const height = Math.abs(bbox.north - bbox.south);
  const width = Math.abs(bbox.east - bbox.west);
  const area = height * width;

  if (area <= 0 || area >= MAX_BACKEND_BBOX_AREA) {
    return 0;
  }

  const maxScale = Math.sqrt(MAX_BACKEND_BBOX_AREA / area);
  const maxPercent = (maxScale - 1) / 2;

  return Math.max(0, Math.min(desiredPercent, maxPercent));
};

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastResponseRef = useRef<{
    requestBbox: BoundingBox;
    hysteresisBbox: BoundingBox;
    points: DeliveryPoint[];
  } | null>(null);

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
        lastResponseRef.current = null;
        return;
      }

      setWarning(null);

      debounceTimerRef.current = window.setTimeout(async () => {
        const lastResponse = lastResponseRef.current;
        if (lastResponse && bboxContains(lastResponse.hysteresisBbox, bbox)) {
          setPoints(filterPointsByBbox(lastResponse.points, bbox));
          setError(null);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);
        abortControllerRef.current = new AbortController();

        try {
          const requestBuffer = getSafeBufferPercent(bbox, REQUEST_BUFFER_PERCENT);
          const hysteresisBuffer = getSafeBufferPercent(bbox, HYSTERESIS_BUFFER_PERCENT);
          const requestBbox = expandBbox(bbox, requestBuffer);
          const hysteresisBbox = expandBbox(bbox, hysteresisBuffer);

          const response = await fetchCdekDeliveryPoints(
            requestBbox,
            zoom,
            undefined,
            abortControllerRef.current.signal
          );

          if (response.warning) {
            setWarning(response.warning);
            setPoints([]);
            lastResponseRef.current = null;
          } else {
            const responsePoints = response.points ?? [];
            lastResponseRef.current = {
              requestBbox,
              hysteresisBbox,
              points: responsePoints,
            };
            setPoints(filterPointsByBbox(responsePoints, bbox));
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
    []
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
