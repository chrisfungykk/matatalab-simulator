import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ValidationError } from '../../core/types';
import styles from './ErrorDisplay.module.css';

interface ErrorDisplayProps {
  errorInfo?: ValidationError;
  goalReached?: boolean;
  executionStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error';
}

const AUTO_DISMISS_MS = 5000;

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errorInfo,
  goalReached,
  executionStatus,
}) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when the notification content changes
  useEffect(() => {
    setDismissed(false);
  }, [errorInfo, goalReached, executionStatus]);

  // Auto-dismiss after a timeout
  useEffect(() => {
    if (dismissed) return;

    const showError = executionStatus === 'error' && errorInfo;
    const showSuccess = executionStatus === 'completed' && goalReached;

    if (!showError && !showSuccess) return;

    const timer = setTimeout(() => setDismissed(true), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [dismissed, errorInfo, goalReached, executionStatus]);

  if (dismissed) return null;

  // Error toast
  if (executionStatus === 'error' && errorInfo) {
    return (
      <div className={`${styles.toast} ${styles.toastError}`} role="alert">
        <span className={styles.message}>{t(errorInfo.messageKey)}</span>
        <button
          className={styles.dismissBtn}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    );
  }

  // Success toast
  if (executionStatus === 'completed' && goalReached) {
    return (
      <div className={`${styles.toast} ${styles.toastSuccess}`} role="status">
        <span className={styles.message}>{t('challenge.success')}</span>
        <button
          className={styles.dismissBtn}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    );
  }

  return null;
};

export default ErrorDisplay;
