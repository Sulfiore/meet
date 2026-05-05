import { useCallback, useMemo } from 'react';
import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { HAND_RAISE_ATTRIBUTE } from './types';

export function useHandRaise() {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  const isHandRaised = localParticipant.attributes?.[HAND_RAISE_ATTRIBUTE] === 'true';

  const toggleHandRaise = useCallback(() => {
    const newValue = localParticipant.attributes?.[HAND_RAISE_ATTRIBUTE] === 'true' ? 'false' : 'true';
    localParticipant.setAttributes({ [HAND_RAISE_ATTRIBUTE]: newValue });
  }, [localParticipant]);

  const raisedHands = useMemo(
    () => participants.filter((p) => p.attributes?.[HAND_RAISE_ATTRIBUTE] === 'true'),
    [participants],
  );

  return { isHandRaised, toggleHandRaise, raisedHands };
}
