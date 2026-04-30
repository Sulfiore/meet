import { useChat, useMaybeLayoutContext } from '@livekit/components-react';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export function ChatNotifications() {
  const { chatMessages } = useChat();
  const layoutContext = useMaybeLayoutContext();
  const lastMessageCount = useRef(chatMessages.length);

  useEffect(() => {
    if (chatMessages.length <= lastMessageCount.current) {
      lastMessageCount.current = chatMessages.length;
      return;
    }

    const newMessages = chatMessages.slice(lastMessageCount.current);
    lastMessageCount.current = chatMessages.length;

    const isChatOpen = layoutContext?.widget.state?.showChat;
    if (isChatOpen) {
      return;
    }

    for (const msg of newMessages) {
      if (msg.from?.isLocal) {
        continue;
      }
      const sender = msg.from?.name || msg.from?.identity || 'Someone';
      toast(`${sender}: ${msg.message}`, {
        duration: 4000,
        position: 'top-right',
        style: {
          backgroundColor: 'var(--lk-bg2)',
          color: 'var(--lk-fg)',
          border: '1px solid var(--lk-border-color)',
        },
      });

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(sender, { body: msg.message });
      }
    }
  }, [chatMessages, layoutContext?.widget.state?.showChat]);

  return null;
}
