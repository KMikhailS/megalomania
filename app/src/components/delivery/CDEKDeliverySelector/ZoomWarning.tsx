import styles from './styles.module.css';

interface ZoomWarningProps {
  message: string;
}

export function ZoomWarning({ message }: ZoomWarningProps) {
  return (
    <div className={styles.zoomWarning}>
      <div className={styles.zoomWarningIcon}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className={styles.zoomWarningText}>{message}</p>
      <p className={styles.zoomWarningHint}>Используйте жесты или кнопки масштаба</p>
    </div>
  );
}
