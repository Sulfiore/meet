import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, type RemoteParticipant } from 'livekit-client';
import { useHandRaise } from './useHandRaise';
import {
  EMOJI_REACTIONS,
  EMOJI_REACTION_TOPIC,
  type EmojiReactionKey,
  type EmojiReactionMessage,
  type FloatingEmoji,
} from './types';
import styles from '@/styles/Reactions.module.css';

const MAX_FLOATING_EMOJIS = 20;
const EMOJI_LIFETIME_MS = 3000;

function getEmojiChar(key: EmojiReactionKey): string {
  return EMOJI_REACTIONS.find((r) => r.key === key)?.emoji ?? key;
}

export function ReactionsBar() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);
  const room = useRoomContext();
  const { isHandRaised, toggleHandRaise } = useHandRaise();

  const addFloatingEmoji = useCallback((emoji: string, senderName: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const left = 10 + Math.random() * 80;
    setFloatingEmojis((prev) => {
      const next = [...prev, { id, emoji, senderName, left }];
      return next.length > MAX_FLOATING_EMOJIS ? next.slice(-MAX_FLOATING_EMOJIS) : next;
    });
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, EMOJI_LIFETIME_MS);
  }, []);

  // Listen for incoming emoji reactions via RoomEvent.DataReceived
  useEffect(() => {
    const handleData = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: unknown,
      topic?: string,
    ) => {
      if (topic !== EMOJI_REACTION_TOPIC) return;
      try {
        const data: EmojiReactionMessage = JSON.parse(new TextDecoder().decode(payload));
        const senderName = participant?.name ?? participant?.identity ?? '';
        addFloatingEmoji(getEmojiChar(data.emoji), senderName);
      } catch {
        // ignore malformed messages
      }
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, addFloatingEmoji]);

  const handleEmojiClick = useCallback(
    (key: EmojiReactionKey) => {
      const message: EmojiReactionMessage = { emoji: key, timestamp: Date.now() };
      const payload = new TextEncoder().encode(JSON.stringify(message));
      room.localParticipant
        .publishData(payload, { topic: EMOJI_REACTION_TOPIC, reliable: true })
        .catch(console.error);
      // Add locally since DataReceived doesn't fire for the sender
      addFloatingEmoji(getEmojiChar(key), '');
      setPickerOpen(false);
    },
    [room, addFloatingEmoji],
  );

  // Close picker on click outside
  useEffect(() => {
    if (!pickerOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpen]);

  return (
    <>
      {/* Control bar */}
      <div className={styles.controlBar}>
        <div className={styles.pickerWrapper} ref={pickerRef}>
          <button
            className={styles.controlButton}
            onClick={() => setPickerOpen((prev) => !prev)}
            aria-label="Send reaction"
            title="Send reaction"
          >
            {'\u{1F44D}'}
          </button>
          {pickerOpen && (
            <div className={styles.picker}>
              {EMOJI_REACTIONS.map((reaction) => (
                <button
                  key={reaction.key}
                  className={styles.emojiButton}
                  onClick={() => handleEmojiClick(reaction.key)}
                  aria-label={reaction.key}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={`${styles.controlButton} ${isHandRaised ? styles.controlButtonActive : ''}`}
          onClick={toggleHandRaise}
          aria-label={isHandRaised ? 'Lower hand' : 'Raise hand'}
          title={isHandRaised ? 'Lower hand' : 'Raise hand'}
        >
          {'\u{270B}'}
        </button>
      </div>

      {/* Floating emoji overlay */}
      {floatingEmojis.length > 0 && (
        <div className={styles.overlay}>
          {floatingEmojis.map((item) => (
            <span
              key={item.id}
              className={styles.floatingEmoji}
              style={{ left: `${item.left}%` }}
            >
              {item.emoji}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
