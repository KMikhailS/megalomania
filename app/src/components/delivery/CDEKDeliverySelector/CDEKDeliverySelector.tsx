import { useEffect, useMemo, useState } from 'react';
import type { CdekCity, DeliveryCost, DeliveryPoint } from '../../../types/cdek';
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

// Default city: Moscow
const DEFAULT_CITY: CdekCity = {
  code: 44,
  name: 'Москва',
  region: '',
  latitude: 55.7558,
  longitude: 37.6173,
};
const DEFAULT_ZOOM = 11;

export function CDEKDeliverySelector({
  isOpen,
  onClose,
  packageInfo,
  selectedPoint,
  selectedCost,
  onSelect,
}: CDEKDeliverySelectorProps) {
  const [center, setCenter] = useState<[number, number]>([DEFAULT_CITY.latitude, DEFAULT_CITY.longitude]);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [selectedCity, setSelectedCity] = useState<CdekCity | null>(DEFAULT_CITY);
  const [activePoint, setActivePoint] = useState<DeliveryPoint | null>(null);
  const [localCost, setLocalCost] = useState<DeliveryCost | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActivePoint(selectedPoint ?? null);
      setLocalCost(selectedCost ?? null);
    }
  }, [isOpen, selectedPoint, selectedCost]);

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
        <CitySelector
          initialCity={DEFAULT_CITY}
          onSelectCity={(city) => {
            setSelectedCity(city);
            setCenter([city.latitude, city.longitude]);
            setZoom(12);
            setActivePoint(null);
          }}
        />

        <DeliveryMap
          center={center}
          zoom={zoom}
          cityCode={selectedCity?.code ?? null}
          selectedPoint={activePoint}
          onSelectPoint={(point) => setActivePoint(point)}
        />
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
