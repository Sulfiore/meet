'use client';

import { formatChatMessageLinks, RoomContext, VideoConference } from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  LogLevel,
  MediaDeviceFailure,
  Room,
  RoomConnectOptions,
  RoomOptions,
  VideoPresets,
  type VideoCodec,
} from 'livekit-client';
import toast from 'react-hot-toast';
import { DebugMode } from '@/lib/Debug';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardShortcuts } from '@/lib/KeyboardShortcuts';
import { ChatNotifications } from '@/lib/ChatNotifications';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { useSetupE2EE } from '@/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '@/lib/usePerfomanceOptimiser';

export function VideoConferenceClientImpl(props: {
  liveKitUrl: string;
  token: string;
  codec: VideoCodec | undefined;
  singlePeerConnection: boolean | undefined;
}) {
  const keyProvider = new ExternalE2EEKeyProvider();
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(e2eePassphrase && worker);

  const [e2eeSetupComplete, setE2eeSetupComplete] = useState(false);

  const roomOptions = useMemo((): RoomOptions => {
    return {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec: props.codec,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
      singlePeerConnection: props.singlePeerConnection,
    };
  }, [e2eeEnabled, props.codec, keyProvider, worker]);

  const room = useMemo(() => new Room(roomOptions), [roomOptions]);

  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  useEffect(() => {
    if (e2eeEnabled) {
      keyProvider.setKey(e2eePassphrase).then(() => {
        room.setE2EEEnabled(true).then(() => {
          setE2eeSetupComplete(true);
        });
      });
    } else {
      setE2eeSetupComplete(true);
    }
  }, [e2eeEnabled, e2eePassphrase, keyProvider, room, setE2eeSetupComplete]);

  useEffect(() => {
    if (e2eeSetupComplete) {
      room.connect(props.liveKitUrl, props.token, connectOptions).catch((error) => {
        console.error(error);
      });
      room.localParticipant.enableCameraAndMicrophone().catch((error) => {
        console.error(error);
        const failure = MediaDeviceFailure.getFailure(error);
        if (failure) {
          let message: string;
          switch (failure) {
            case MediaDeviceFailure.PermissionDenied:
              message = 'Permission denied. Please allow access to your microphone/camera in your browser settings.';
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
          toast.error(message, {
            id: `media-device-error-${failure}`,
            duration: 5000,
            position: 'top-right',
            style: {
              backgroundColor: 'var(--lk-bg2)',
              color: 'var(--lk-fg)',
              border: '1px solid var(--lk-border-color)',
            },
          });
        }
      });
    }
  }, [room, props.liveKitUrl, props.token, connectOptions, e2eeSetupComplete]);

  useLowCPUOptimizer(room);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <KeyboardShortcuts />
        <VideoConference
          chatMessageFormatter={formatChatMessageLinks}
          SettingsComponent={
            process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU === 'true' ? SettingsMenu : undefined
          }
        />
        <ChatNotifications />
        <DebugMode logLevel={LogLevel.debug} />
      </RoomContext.Provider>
    </div>
  );
}
