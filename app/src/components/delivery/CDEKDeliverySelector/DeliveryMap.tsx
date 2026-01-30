import { useCallback, useEffect, useRef } from 'react';
import { Map, Placemark, YMaps, ZoomControl } from '@pbe/react-yandex-maps';
import { useDeliveryPoints } from './hooks/useDeliveryPoints';
import { ZoomWarning } from './ZoomWarning';
import type { BoundingBox, DeliveryPoint } from '../../../types/cdek';
import styles from './styles.module.css';

interface DeliveryMapProps {
  center: [number, number];
  zoom: number;
  onSelectPoint: (point: DeliveryPoint) => void;
  selectedPoint: DeliveryPoint | null;
}


export function DeliveryMap({
  center,
  zoom,
  onSelectPoint,
  selectedPoint,
}: DeliveryMapProps) {
  const mapRef = useRef<any>(null);
  const { points, isLoading, error, warning, loadPoints } = useDeliveryPoints();

  const VITE_YANDEX_MAP_API_KEY = import.meta.env.VITE_YANDEX_MAP_API_KEY

  const handleBoundsChange = useCallback(
    (event: any) => {
      const map = event.get('target');
      const bounds = map.getBounds();
      const nextZoom = map.getZoom();

      if (!bounds) return;

      const bbox: BoundingBox = {
        south: bounds[0][0],
        west: bounds[0][1],
        north: bounds[1][0],
        east: bounds[1][1],
      };

      loadPoints(bbox, Math.floor(nextZoom));
    },
    [loadPoints]
  );

  const handleMapLoad = useCallback(
    (map: any) => {
      if (!map) return;
      mapRef.current = map;

      const bounds = map.getBounds();
      const initialZoom = map.getZoom();
      if (bounds) {
        const bbox: BoundingBox = {
          south: bounds[0][0],
          west: bounds[0][1],
          north: bounds[1][0],
          east: bounds[1][1],
        };
        loadPoints(bbox, Math.floor(initialZoom));
      }

      map.events.add('boundschange', handleBoundsChange);
    },
    [loadPoints, handleBoundsChange]
  );

  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setCenter(center, zoom, { duration: 300 });
    }
  }, [center, zoom]);

  useEffect(() => {
    return () => {
      if (mapRef.current?.events) {
        mapRef.current.events.remove('boundschange', handleBoundsChange);
      }
    };
  }, [handleBoundsChange]);

  const getPlacemarkOptions = useCallback(
    (point: DeliveryPoint) => {
      const isSelected = selectedPoint?.code === point.code;
      const isPostamat = point.type === 'POSTAMAT';

      return {
        preset: isSelected
          ? 'islands#redDotIcon'
          : isPostamat
          ? 'islands#darkBlueDotIcon'
          : 'islands#greenDotIcon',
        iconColor: isSelected ? '#FF0000' : undefined,
      };
    },
    [selectedPoint]
  );

  return (
    <div className={styles.mapContainer}>
      {/*<YMaps query={{ apikey: import.meta.env.VITE_YANDEX_MAPS_KEY }}>*/}
      <YMaps query={{ apikey: VITE_YANDEX_MAP_API_KEY }}>
        <Map
          defaultState={{
            center,
            zoom,
          }}
          width="100%"
          height="100%"
          instanceRef={handleMapLoad}
          options={{
            suppressMapOpenBlock: true,
          }}
        >
          <ZoomControl options={{ position: { right: 12, top: 12 } }} />

          {!warning && points.length > 0 && points.map((point) => (
            <Placemark
              key={point.code}
              geometry={[
                point.coordinates.latitude,
                point.coordinates.longitude,
              ]}
              properties={{
                hintContent: point.name,
              }}
              options={getPlacemarkOptions(point)}
              onClick={() => onSelectPoint(point)}
            />
          ))}
        </Map>
      </YMaps>

      {warning && <ZoomWarning message={warning.message} />}

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          Загрузка ПВЗ...
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => window.location.reload()}>Повторить</button>
        </div>
      )}
    </div>
  );
}
