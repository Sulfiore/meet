import { useEffect, useRef } from 'react';
import { useParticipants } from '@livekit/components-react';
import toast from 'react-hot-toast';
import { HAND_RAISE_ATTRIBUTE } from './types';

export function HandRaiseNotifications() {
  const participants = useParticipants();
  const previousState = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentRaised = new Set<string>();

    for (const participant of participants) {
      if (participant.attributes?.[HAND_RAISE_ATTRIBUTE] === 'true') {
        currentRaised.add(participant.identity);

        if (!participant.isLocal && !previousState.current.has(participant.identity)) {
          const name = participant.name || participant.identity;
          toast(`${name} raised their hand \u{270B}`, {
            id: `hand-raise-${participant.identity}`,
            duration: Infinity,
            position: 'top-right',
            style: {
              backgroundColor: 'var(--lk-bg2)',
              color: 'var(--lk-fg)',
              border: '1px solid var(--lk-border-color)',
            },
          });

          if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(name, { body: 'raised their hand \u{270B}' });
          }
        }
      }
    }

    // Dismiss toasts for participants who lowered their hand
    for (const identity of previousState.current) {
      if (!currentRaised.has(identity)) {
        toast.dismiss(`hand-raise-${identity}`);
      }
    }

    previousState.current = currentRaised;
  }, [participants]);

  return null;
}
