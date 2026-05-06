'use client';
import { useEffect } from 'react';
import { showErrorToast } from './toast-utils';

export function GlobalErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);

      const message = event.reason?.message || '';

      // Filter out known LiveKit Components internal errors that are handled gracefully
      if (message.includes('Element not part of the array') ||
          message.includes('camera_placeholder')) {
        console.warn('Suppressed LiveKit grid layout error (known issue)');
        event.preventDefault();
        return;
      }

      // Show user-friendly error message for real errors
      showErrorToast(message || 'An unexpected error occurred', 'unhandled-rejection');

      // Prevent default browser behavior (console error)
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error);

      const message = event.error?.message || event.message || '';

      // Filter out known LiveKit Components internal errors
      if (message.includes('Element not part of the array') ||
          message.includes('camera_placeholder') ||
          message.includes('updatePages')) {
        console.warn('Suppressed LiveKit grid layout error (known issue)');
        event.preventDefault();
        return;
      }

      // Show user-friendly error message for real errors
      showErrorToast(message || 'An unexpected error occurred', 'uncaught-error');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
