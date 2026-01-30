import { useEffect, useState } from 'react';
import { calculateCdekDelivery } from '../../../../api/client';
import type { DeliveryCost, DeliveryPoint } from '../../../../types/cdek';

export interface DeliveryPackageInfo {
  weight: number;
  length: number;
  width: number;
  height: number;
  declaredValue?: number;
}

export function useDeliveryCost(
  point: DeliveryPoint | null,
  pkg: DeliveryPackageInfo
) {
  const [cost, setCost] = useState<DeliveryCost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!point) {
      setCost(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    calculateCdekDelivery({
      delivery_point_code: point.code,
      weight: pkg.weight,
      length: pkg.length,
      width: pkg.width,
      height: pkg.height,
      declared_value: pkg.declaredValue,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setCost(data);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError((err as Error).message || 'Не удалось рассчитать стоимость доставки');
          setCost(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [point?.code, pkg.weight, pkg.length, pkg.width, pkg.height, pkg.declaredValue]);

  return {
    cost,
    isLoading,
    error,
  };
}
