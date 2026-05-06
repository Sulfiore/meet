'use client';
import * as React from 'react';
import { Track } from 'livekit-client';
import {
  useMaybeLayoutContext,
  MediaDeviceMenu,
  TrackToggle,
  useRoomContext,
  useIsRecording,
  useChat,
} from '@livekit/components-react';
import styles from '../styles/SettingsMenu.module.css';
import { CameraSettings } from './CameraSettings';
import { MicrophoneSettings } from './MicrophoneSettings';
/**
 * @alpha
 */
export interface SettingsMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * @alpha
 */
export function SettingsMenu(props: SettingsMenuProps) {
  const layoutContext = useMaybeLayoutContext();
  const room = useRoomContext();
  const { send: sendChatMessage } = useChat();
  const recordingEndpoint = process.env.NEXT_PUBLIC_LK_RECORD_ENDPOINT;

  // Track E2EE state with React state to ensure re-renders
  const [isE2EEEnabled, setIsE2EEEnabled] = React.useState(room.isE2EEEnabled);

  React.useEffect(() => {
    // Update E2EE state when it changes
    const updateE2EEState = () => {
      console.log('[SettingsMenu] E2EE status:', room.isE2EEEnabled);
      setIsE2EEEnabled(room.isE2EEEnabled);
    };

    // Check on mount and update state
    updateE2EEState();

    // Poll E2EE status periodically since there's no specific room-level event
    // (E2EE is set at connection time, but we poll to keep UI in sync)
    const interval = setInterval(updateE2EEState, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [room]);

  const settings = React.useMemo(() => {
    return {
      media: { camera: true, microphone: true, label: 'Media Devices', speaker: true },
      recording: recordingEndpoint ? { label: 'Recording' } : undefined,
    };
  }, []);

  const tabs = React.useMemo(
    () => Object.keys(settings).filter((t) => t !== undefined) as Array<keyof typeof settings>,
    [settings],
  );
  const [activeTab, setActiveTab] = React.useState(tabs[0]);

  const isRecording = useIsRecording();
  const [initialRecStatus, setInitialRecStatus] = React.useState(isRecording);
  const [processingRecRequest, setProcessingRecRequest] = React.useState(false);
  const [sendRecordingToChat, setSendRecordingToChat] = React.useState(false);

  React.useEffect(() => {
    if (initialRecStatus !== isRecording) {
      setProcessingRecRequest(false);
    }
  }, [isRecording, initialRecStatus]);

  const toggleRoomRecording = async () => {
    if (!recordingEndpoint) {
      throw TypeError('No recording endpoint specified');
    }
    if (room.isE2EEEnabled) {
      throw Error('Recording of encrypted meetings is currently not supported');
    }
    setProcessingRecRequest(true);
    setInitialRecStatus(isRecording);
    let response: Response;
    if (isRecording) {
      response = await fetch(recordingEndpoint + `/stop?roomName=${room.name}`);
      if (response.ok) {
        // Get the recording URL and send it to chat if enabled
        try {
          const data = await response.json();
          if (data.url && sendRecordingToChat) {
            await sendChatMessage(`Recording available: ${data.url}`);
          }
        } catch (error) {
          console.error('Error sending recording URL to chat:', error);
        }
      }
    } else {
      response = await fetch(recordingEndpoint + `/start?roomName=${room.name}`);
    }
    if (!response.ok) {
      console.error(
        'Error handling recording request, check server logs:',
        response.status,
        response.statusText,
      );
      setProcessingRecRequest(false);
    }
  };

  return (
    <div className="settings-menu" style={{ width: '100%', position: 'relative' }} {...props}>
      <div className={styles.tabs}>
        {tabs.map(
          (tab) =>
            settings[tab] && (
              <button
                className={`${styles.tab} lk-button`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-pressed={tab === activeTab}
              >
                {
                  // @ts-ignore
                  settings[tab].label
                }
              </button>
            ),
        )}
      </div>
      <div className="tab-content">
        {activeTab === 'media' && (
          <>
            {settings.media && settings.media.camera && (
              <>
                <h3>Camera</h3>
                <section>
                  <CameraSettings />
                </section>
              </>
            )}
            {settings.media && settings.media.microphone && (
              <>
                <h3>Microphone</h3>
                <section>
                  <MicrophoneSettings />
                </section>
              </>
            )}
            {settings.media && settings.media.speaker && (
              <>
                <h3>Speaker & Headphones</h3>
                <section className="lk-button-group">
                  <span className="lk-button">Audio Output</span>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="audiooutput"></MediaDeviceMenu>
                  </div>
                </section>
              </>
            )}
          </>
        )}
        {activeTab === 'recording' && (
          <>
            <h3>Record Meeting</h3>
            <section>
              {isE2EEEnabled ? (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--lk-bg3)',
                    borderRadius: '8px',
                    border: '1px solid var(--lk-border-color)',
                  }}
                >
                  <p style={{ margin: 0, color: 'var(--lk-fg2)' }}>
                    🔒 Recording is disabled for end-to-end encrypted meetings
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--lk-fg3)' }}>
                    End-to-end encryption prevents server-side recording to protect your privacy.
                  </p>
                </div>
              ) : (
                <>
                  <p>
                    {isRecording
                      ? 'Meeting is currently being recorded'
                      : 'No active recordings for this meeting'}
                  </p>
                  <button
                    disabled={processingRecRequest}
                    onClick={() => toggleRoomRecording()}
                    style={{ cursor: processingRecRequest ? 'not-allowed' : 'pointer' }}
                  >
                    {isRecording ? 'Stop' : 'Start'} Recording
                  </button>
                  <div style={{ marginTop: '1rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={sendRecordingToChat}
                        onChange={(e) => setSendRecordingToChat(e.target.checked)}
                      />
                      <span>Send recording link to chat when finished</span>
                    </label>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <button
          className={`lk-button`}
          onClick={() => layoutContext?.widget.dispatch?.({ msg: 'toggle_settings' })}
        >
          Close
        </button>
      </div>
    </div>
  );
}
