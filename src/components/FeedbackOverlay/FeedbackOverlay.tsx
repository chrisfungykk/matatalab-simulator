import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ValidationError } from '../../core/types';
import ConfettiCanvas from '../ConfettiCanvas/ConfettiCanvas';
import StarRating from '../StarRating/StarRating';
import styles from './FeedbackOverlay.module.css';

export interface FeedbackOverlayProps {
  executionStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  goalReached?: boolean;
  errorInfo?: ValidationError;
  challengeDifficulty?: 'easy' | 'medium' | 'hard';
  language: 'zh' | 'en';
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 5000;
const FADE_OUT_MS = 300;

const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
  executionStatus,
  goalReached,
  errorInfo,
  challengeDifficulty,
  language,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const [fadingOut, setFadingOut] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the language prop to satisfy the interface (used by parent for re-render)
  void language;

  const isSuccess = executionStatus === 'completed' && goalReached === true;
  const isFailure = executionStatus === 'completed' && goalReached === false;
  const isError = executionStatus === 'error' && !!errorInfo;
  const isVisible = isSuccess || isFailure || isError;

  const handleDismiss = useCallback(() => {
    if (fadingOut) return;
    setFadingOut(true);
    fadeTimerRef.current = setTimeout(() => {
      onDismiss();
    }, FADE_OUT_MS);
  }, [fadingOut, onDismiss]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!isVisible) return;
    setFadingOut(false);
    dismissTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, AUTO_DISMISS_MS);
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [isVisible, executionStatus, goalReached, errorInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isVisible) return null;

  // ── Error toast ──────────────────────────────────────────────────
  if (isError) {
    return (
      <div
        data-testid="feedback-overlay"
        className={`${styles.errorToast}${fadingOut ? ` ${styles.fadeOut}` : ''}`}
        role="alert"
        onClick={handleDismiss}
      >
        <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
        <span className={styles.errorMessage} data-testid="error-message">
          {t(errorInfo!.messageKey)}
        </span>
        <button
          className={styles.dismissBtn}
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          aria-label={t('ui.dismiss', 'Dismiss')}
        >
          ×
        </button>
      </div>
    );
  }

  // ── Success overlay ──────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div
        data-testid="feedback-overlay"
        className={`${styles.overlay}${fadingOut ? ` ${styles.fadeOut}` : ''}`}
        role="status"
        aria-live="polite"
        onClick={handleDismiss}
      >
        <ConfettiCanvas active={!fadingOut} duration={3000} particleCount={80} />
        <div className={styles.successContent}>
          <span className={styles.successEmoji} aria-hidden="true">🎉</span>
          {challengeDifficulty && <StarRating difficulty={challengeDifficulty} />}
          <p className={styles.successMessage} data-testid="success-message">
            {t('challenge.success')}
          </p>
        </div>
      </div>
    );
  }

  // ── Try-again overlay ────────────────────────────────────────────
  if (isFailure) {
    return (
      <div
        data-testid="feedback-overlay"
        className={`${styles.overlay}${fadingOut ? ` ${styles.fadeOut}` : ''}`}
        role="status"
        aria-live="polite"
        onClick={handleDismiss}
      >
        <div className={styles.tryAgainContent}>
          <span className={styles.tryAgainEmoji} aria-hidden="true">💪</span>
          <p className={styles.tryAgainMessage} data-testid="tryagain-message">
            {t('challenge.failure')}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default FeedbackOverlay;
