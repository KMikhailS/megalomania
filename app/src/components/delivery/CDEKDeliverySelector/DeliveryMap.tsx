import { useCallback, useEffect, useRef, useState } from 'react';
import { Clusterer, Map, Placemark, YMaps, ZoomControl } from '@pbe/react-yandex-maps';
import { useDeliveryPoints } from './hooks/useDeliveryPoints';
import type { DeliveryPoint } from '../../../types/cdek';
import styles from './styles.module.css';

interface DeliveryMapProps {
  center: [number, number];
  zoom: number;
  cityCode: number | null;
  onSelectPoint: (point: DeliveryPoint) => void;
  selectedPoint: DeliveryPoint | null;
}

const MAP_CONSTANTS = {
  CLUSTER_THRESHOLD_ZOOM: 14,
};

export function DeliveryMap({
  center,
  zoom,
  cityCode,
  onSelectPoint,
  selectedPoint,
}: DeliveryMapProps) {
  const mapRef = useRef<any>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const { points, isLoading, error, loadPointsByCity, loadPointsByCoordinates } = useDeliveryPoints();

  // Load points when city is explicitly selected
  useEffect(() => {
    if (cityCode) {
      loadPointsByCity(cityCode);
    }
  }, [cityCode, loadPointsByCity]);

  const handleBoundsChange = useCallback((event: any) => {
    const map = event.get('target');
    const nextZoom = map.getZoom();
    setCurrentZoom(nextZoom);

    // Load points based on map center when user pans the map
    if (nextZoom >= 10) {
      const mapCenter = map.getCenter();
      loadPointsByCoordinates(mapCenter[0], mapCenter[1]);
    }
  }, [loadPointsByCoordinates]);

  const handleMapLoad = useCallback(
    (map: any) => {
      if (!map) return;
      mapRef.current = map;
      map.events.add('boundschange', handleBoundsChange);
    },
    [handleBoundsChange]
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

  const useCluster = currentZoom < MAP_CONSTANTS.CLUSTER_THRESHOLD_ZOOM;

  return (
    <div className={styles.mapContainer}>
      {/*<YMaps query={{ apikey: import.meta.env.VITE_YANDEX_MAPS_KEY }}>*/}
      <YMaps query={{ apikey: '3878f4b1-b0c2-4623-8ddse-9781243e39f0' }}>
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

          {points.length > 0 && (
            useCluster ? (
              <Clusterer
                options={{
                  preset: 'islands#greenClusterIcons',
                  groupByCoordinates: false,
                  clusterDisableClickZoom: false,
                }}
              >
                {points.map((point) => (
                  <Placemark
                    key={point.code}
                    geometry={[
                      point.coordinates.latitude,
                      point.coordinates.longitude,
                    ]}
                    properties={{
                      hintContent: point.name,
                      balloonContentHeader: point.name,
                      balloonContentBody: point.address,
                    }}
                    options={getPlacemarkOptions(point)}
                    onClick={() => onSelectPoint(point)}
                  />
                ))}
              </Clusterer>
            ) : (
              points.map((point) => (
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
              ))
            )
          )}
        </Map>
      </YMaps>

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
