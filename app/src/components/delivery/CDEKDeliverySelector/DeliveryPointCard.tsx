import type { DeliveryCost, DeliveryPoint } from '../../../types/cdek';
import styles from './styles.module.css';

interface DeliveryPointCardProps {
  point: DeliveryPoint;
  deliveryCost: DeliveryCost | null;
  isLoadingCost: boolean;
  onClose: () => void;
  onSelect: () => void;
}

export function DeliveryPointCard({
  point,
  deliveryCost,
  isLoadingCost,
  onClose,
  onSelect,
}: DeliveryPointCardProps) {
  return (
    <div className={styles.pointCard}>
      <button className={styles.pointCardClose} onClick={onClose}>
        ×
      </button>

      <div className={styles.pointCardHeader}>
        <span className={styles.pointType}>
          {point.type === 'POSTAMAT' ? 'Постамат' : 'Пункт выдачи'}
        </span>
        <h3 className={styles.pointName}>{point.name}</h3>
      </div>

      <div>
        <div className={styles.pointInfoRow}>
          <span className={styles.pointInfoIcon}>📍</span>
          <span>{point.address_full || point.address}</span>
        </div>

        {point.work_time && (
          <div className={styles.pointInfoRow}>
            <span className={styles.pointInfoIcon}>🕐</span>
            <span>{point.work_time}</span>
          </div>
        )}

        {point.phones?.[0] && (
          <div className={styles.pointInfoRow}>
            <span className={styles.pointInfoIcon}>📞</span>
            <a href={`tel:${point.phones[0].number}`}>
              {point.phones[0].number}
            </a>
          </div>
        )}

        <div className={styles.pointFeatures}>
          {point.have_cash && (
            <span className={styles.featureBadge}>Наличные</span>
          )}
          {point.have_cashless && (
            <span className={styles.featureBadge}>Карта</span>
          )}
          {point.is_dressing_room && (
            <span className={styles.featureBadge}>Примерочная</span>
          )}
          {point.allowed_cod && (
            <span className={styles.featureBadge}>Наложенный платеж</span>
          )}
        </div>

        <div className={styles.deliveryCost}>
          {isLoadingCost ? (
            <div>Расчет стоимости...</div>
          ) : deliveryCost ? (
            <>
              <div className={styles.costValue}>
                <span className={styles.costLabel}>Доставка:</span>
                <span className={styles.costAmount}>
                  {deliveryCost.delivery_sum} ₽
                </span>
              </div>
              <div className={styles.costPeriod}>
                {deliveryCost.period_min === deliveryCost.period_max
                  ? `${deliveryCost.period_min} дн.`
                  : `${deliveryCost.period_min}-${deliveryCost.period_max} дн.`}
              </div>
            </>
          ) : (
            <div>Стоимость не рассчитана</div>
          )}
        </div>
      </div>

      <button className={styles.selectButton} onClick={onSelect}>
        Выбрать этот пункт
      </button>
    </div>
  );
}
