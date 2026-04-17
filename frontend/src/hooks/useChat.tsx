import { useState, useEffect, useCallback, useRef } from 'react';

import { useAuth } from '@/context/AuthContext';
import chatService from '@/services/chatService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseChatOptions {
  autoLoadHistory?: boolean;
  enableStreaming?: boolean;
}

export const useChat = (initialMessages: Message[] = [], options: UseChatOptions = {}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(chatService.getSessionId());
  const [operationPerformed, setOperationPerformed] = useState<unknown>(null);
  const operationTimerRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typingAnimationRef = useRef(0);
  const streamRafRef = useRef(0);

  const { isLoaded, isSignedIn, getToken } = useAuth();

  const { autoLoadHistory = true, enableStreaming = true } = options;

  useEffect(() => {
    if (isLoaded) {
      chatService.setTokenGetter(getToken);
    }
  }, [isLoaded, getToken]);

  const loadHistory = useCallback(async () => {
    if (!isSignedIn) {
      return;
    }

    try {
      setIsLoading(true);
      const history = await chatService.getHistory();

      if (!history.messages || history.messages.length === 0) {
        setMessages([]);
      } else {
        setMessages(history.messages);
      }
      setSessionId(history.session_id);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (autoLoadHistory && isLoaded && isSignedIn) {
      loadHistory();
    }

    return () => {
      abortControllerRef.current?.abort();
      if (typingAnimationRef.current) {
        window.clearTimeout(typingAnimationRef.current);
      }
      if (streamRafRef.current) {
        cancelAnimationFrame(streamRafRef.current);
        streamRafRef.current = 0;
      }
      if (operationTimerRef.current) {
        window.clearTimeout(operationTimerRef.current);
        operationTimerRef.current = 0;
      }
    };
  }, [autoLoadHistory, isLoaded, isSignedIn, loadHistory]);

  const sendMessage = useCallback(async (text: string) => {
    if (!isLoaded || !isSignedIn) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: 'Please sign in to use the chat feature.',
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    if (!text.trim() || isLoading) return;

    abortControllerRef.current?.abort();
    if (typingAnimationRef.current) {
      window.clearTimeout(typingAnimationRef.current);
      typingAnimationRef.current = 0;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    const aiPlaceholder: Message = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, aiPlaceholder]);

    try {
      if (enableStreaming) {
        let pendingDelta = '';

        const flushStreamDelta = () => {
          if (!pendingDelta) return;
          const deltaToFlush = pendingDelta;
          pendingDelta = '';
          streamRafRef.current = 0;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === aiMessageId ? { ...msg, text: msg.text + deltaToFlush } : msg))
          );
        };

        abortControllerRef.current = chatService.sendMessageStream(text, {
          onContent: (delta: string) => {
            pendingDelta += delta;
            if (!streamRafRef.current) {
              streamRafRef.current = requestAnimationFrame(flushStreamDelta);
            }
          },
          onDone: (response) => {
            if (operationTimerRef.current) {
              window.clearTimeout(operationTimerRef.current);
              operationTimerRef.current = 0;
            }
            if (streamRafRef.current) {
              cancelAnimationFrame(streamRafRef.current);
              streamRafRef.current = 0;
            }
            pendingDelta = '';
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      text: response.message.content,
                      timestamp: new Date(response.message.created_at),
                      isStreaming: false,
                    }
                  : msg
              )
            );

            if (response.operation_performed) {
              setOperationPerformed(response.operation_performed);
              operationTimerRef.current = window.setTimeout(() => {
                setOperationPerformed(null);
                operationTimerRef.current = 0;
              }, 2000);
              setTimeout(() => window.dispatchEvent(new CustomEvent('tasksUpdated')), 500);
            }

            setIsLoading(false);
            abortControllerRef.current = null;
          },
          onError: () => {
            if (streamRafRef.current) {
              cancelAnimationFrame(streamRafRef.current);
              streamRafRef.current = 0;
            }
            pendingDelta = '';
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, text: 'Sorry, I encountered an error. Please try again.', isStreaming: false }
                  : msg
              )
            );
            setIsLoading(false);
            abortControllerRef.current = null;
          },
        });
      } else {
        const response = await chatService.sendMessage(text);
        if (operationTimerRef.current) {
          window.clearTimeout(operationTimerRef.current);
          operationTimerRef.current = 0;
        }
        const finalText = response.message.content;
        let index = 0;

        const typeNextChunk = () => {
          const nextIndex = Math.min(index + 8, finalText.length);
          const nextText = finalText.slice(0, nextIndex);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    text: nextText,
                    timestamp: new Date(response.message.created_at),
                    isStreaming: nextIndex < finalText.length,
                  }
                : msg
            )
          );

          index = nextIndex;

          if (index < finalText.length) {
            typingAnimationRef.current = window.setTimeout(typeNextChunk, 18);
            return;
          }

          typingAnimationRef.current = 0;

          if (response.operation_performed) {
            setOperationPerformed(response.operation_performed);
            operationTimerRef.current = window.setTimeout(() => {
              setOperationPerformed(null);
              operationTimerRef.current = 0;
            }, 2000);
            setTimeout(() => window.dispatchEvent(new CustomEvent('tasksUpdated')), 500);
          }

          setIsLoading(false);
        };

        typeNextChunk();
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, text: 'Sorry, I encountered an error processing your request. Please try again.', isStreaming: false }
            : msg
        )
      );
      setIsLoading(false);
    }
  }, [enableStreaming, isLoaded, isLoading, isSignedIn]);

  const clearMessages = useCallback(async () => {
    try {
      await chatService.clearHistory();
    } finally {
      setMessages([]);
      setOperationPerformed(null);
      setSessionId(chatService.getSessionId());
    }
  }, []);

  const startNewConversation = useCallback(async () => {
    try {
      await chatService.clearHistory();
      setMessages([]);
      setOperationPerformed(null);
      setSessionId(chatService.getSessionId());
    } catch {}
  }, []);

  const formatMessage = useCallback((text: string) => {
    return text.split('\n').map((line, i) => (
      <p key={i} className={i > 0 ? 'mt-2' : ''}>
        {line}
      </p>
    ));
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    clearMessages,
    startNewConversation,
    loadHistory,
    sessionId,
    operationPerformed,
    formatMessage,
  };
};
