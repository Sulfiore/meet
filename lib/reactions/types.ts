export const EMOJI_REACTIONS = [
  { key: 'thumbsup', emoji: '\u{1F44D}' },
  { key: 'heart', emoji: '\u{2764}\u{FE0F}' },
  { key: 'joy', emoji: '\u{1F602}' },
  { key: 'tada', emoji: '\u{1F389}' },
  { key: 'clap', emoji: '\u{1F44F}' },
] as const;

export type EmojiReactionKey = (typeof EMOJI_REACTIONS)[number]['key'];

export const HAND_RAISE_ATTRIBUTE = 'handRaised';
export const EMOJI_REACTION_TOPIC = 'emoji-reaction';

export interface EmojiReactionMessage {
  emoji: EmojiReactionKey;
  timestamp: number;
}

export interface FloatingEmoji {
  id: string;
  emoji: string;
  senderName: string;
  left: number;
}
