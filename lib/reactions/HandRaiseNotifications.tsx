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
            duration: 4000,
            position: 'top-right',
            style: {
              backgroundColor: 'var(--lk-bg2)',
              color: 'var(--lk-fg)',
              border: '1px solid var(--lk-border-color)',
            },
          });
        }
      }
    }

    previousState.current = currentRaised;
  }, [participants]);

  return null;
}
