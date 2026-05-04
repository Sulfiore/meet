import { MediaDeviceFailure } from 'livekit-client';
import { showErrorToast } from '@/lib/toast-utils';

export function handleMediaDeviceError(error: Error) {
  console.error(error);
  const failure = MediaDeviceFailure.getFailure(error);
  if (failure) {
    let message: string;
    switch (failure) {
      case MediaDeviceFailure.PermissionDenied:
        message =
          'Permission denied. Please allow access to your microphone/camera in your browser settings.';
        break;
      case MediaDeviceFailure.NotFound:
        message = 'No microphone or camera found. Please check your device connections.';
        break;
      case MediaDeviceFailure.DeviceInUse:
        message = 'Your device is already in use by another application.';
        break;
      default:
        message = 'Could not access your media devices.';
    }
    showErrorToast(message, `media-device-error-${failure}`);
    return true;
  }
  return false;
}
