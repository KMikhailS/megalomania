import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchUserCity, type UserCityResponse } from '../../../api/client';
import type { DeliveryCost, DeliveryPoint } from '../../../types/cdek';
import { CitySelector } from './CitySelector';
import { DeliveryMap } from './DeliveryMap';
import { DeliveryPointCard } from './DeliveryPointCard';
import { useDeliveryCost, type DeliveryPackageInfo } from './hooks/useDeliveryCost';
import styles from './styles.module.css';

interface CDEKDeliverySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  packageInfo: DeliveryPackageInfo;
  selectedPoint?: DeliveryPoint | null;
  selectedCost?: DeliveryCost | null;
  onSelect: (point: DeliveryPoint, cost: DeliveryCost | null) => void;
}

const DEFAULT_CENTER: [number, number] = [55.7558, 37.6173]; // Москва
const DEFAULT_ZOOM = 11;
const STORAGE_KEY = 'cdek_user_city';

function loadSavedCity(): UserCityResponse | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return null;
}

function saveCity(city: UserCityResponse): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
  } catch {
    // ignore
  }
}

export function CDEKDeliverySelector({
  isOpen,
  onClose,
  packageInfo,
  selectedPoint,
  selectedCost,
  onSelect,
}: CDEKDeliverySelectorProps) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [activePoint, setActivePoint] = useState<DeliveryPoint | null>(null);
  const [localCost, setLocalCost] = useState<DeliveryCost | null>(null);
  const [isLoadingCity, setIsLoadingCity] = useState(true);
  const cityLoadedRef = useRef(false);

  // Определение города пользователя при первом открытии
  const initializeUserCity = useCallback(async () => {
    if (cityLoadedRef.current) return;
    cityLoadedRef.current = true;

    // Сначала проверяем localStorage
    const savedCity = loadSavedCity();
    if (savedCity) {
      setCenter([savedCity.latitude, savedCity.longitude]);
      setZoom(12);
      setIsLoadingCity(false);
      return;
    }

    // Если нет сохранённого города, запрашиваем по IP
    setIsLoadingCity(true);
    try {
      const city = await fetchUserCity();
      setCenter([city.latitude, city.longitude]);
      setZoom(12);
      saveCity(city);
    } catch (error) {
      console.error('Failed to fetch user city:', error);
      // Используем Москву по умолчанию
      setCenter(DEFAULT_CENTER);
    } finally {
      setIsLoadingCity(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActivePoint(selectedPoint ?? null);
      setLocalCost(selectedCost ?? null);
      initializeUserCity();
    }
  }, [isOpen, selectedPoint, selectedCost, initializeUserCity]);

  const handleSelectCity = useCallback((city: { latitude: number; longitude: number; code: number; name: string }) => {
    setCenter([city.latitude, city.longitude]);
    setZoom(12);
    // Сохраняем выбранный город
    saveCity({
      city_code: city.code,
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
    });
  }, []);

  useEffect(() => {
    if (!activePoint) {
      setLocalCost(null);
      return;
    }
    if (selectedPoint?.code !== activePoint.code) {
      setLocalCost(null);
    }
  }, [activePoint?.code, selectedPoint?.code]);

  const { cost, isLoading: isLoadingCost } = useDeliveryCost(activePoint, packageInfo);

  useEffect(() => {
    if (cost) {
      setLocalCost(cost);
    }
  }, [cost]);

  const displayCost = useMemo(() => {
    return cost ?? localCost;
  }, [cost, localCost]);

  if (!isOpen) return null;

  return (
    <div className={styles.selectorRoot}>
      <div className={styles.selectorHeader}>
        <button className={styles.backButton} onClick={onClose}>
          <svg width="12" height="21" viewBox="0 0 12 21" fill="none">
            <path d="M11 1L2 10.5L11 20" stroke="black" strokeWidth="2" />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>Пункты выдачи СДЭК</h1>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.selectorBody}>
        <CitySelector onSelectCity={handleSelectCity} />

        {isLoadingCity || !center ? (
          <div className={styles.mapContainer}>
            <div className={styles.loadingOverlay} style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className={styles.spinner} />
              Определяем ваш город...
            </div>
          </div>
        ) : (
          <DeliveryMap
            center={center}
            zoom={zoom}
            selectedPoint={activePoint}
            onSelectPoint={(point) => setActivePoint(point)}
          />
        )}
      </div>

      {activePoint && (
        <DeliveryPointCard
          point={activePoint}
          deliveryCost={displayCost}
          isLoadingCost={isLoadingCost}
          onClose={() => setActivePoint(null)}
          onSelect={() => onSelect(activePoint, displayCost)}
        />
      )}
    </div>
  );
}
