import { useState, useEffect, useCallback, useRef } from 'react';

import { useAuth, useUser } from '@/context/AuthContext';
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const userName = user?.firstName || user?.name || user?.email || 'friend';

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
        const welcomeText = `Hello ${userName}! I'm your AI assistant for managing tasks. You can ask me to:\n\n• Create tasks\n• Complete tasks\n• Search for tasks\n• List your tasks\n\nHow can I help you today?`;
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: welcomeText,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);

        try {
          await chatService.saveWelcomeMessage(welcomeText);
        } catch {}
      } else {
        setMessages(history.messages);
      }
      setSessionId(history.session_id);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, userName]);

  useEffect(() => {
    if (autoLoadHistory && isLoaded && isSignedIn) {
      loadHistory();
    }

    return () => {
      abortControllerRef.current?.abort();
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

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setOperationPerformed(null);

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
        abortControllerRef.current = chatService.sendMessageStream(text, {
          onContent: (delta: string) => {
            setMessages((prev) => prev.map((msg) => (msg.id === aiMessageId ? { ...msg, text: msg.text + delta } : msg)));
          },
          onDone: (response) => {
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
              setTimeout(() => window.dispatchEvent(new CustomEvent('tasksUpdated')), 500);
            }

            setIsLoading(false);
            abortControllerRef.current = null;
          },
          onError: () => {
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
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.message.content,
          sender: 'ai',
          timestamp: new Date(response.message.created_at),
        };

        setMessages((prev) => [...prev, aiMessage]);

        if (response.operation_performed) {
          setOperationPerformed(response.operation_performed);
          setTimeout(() => window.dispatchEvent(new CustomEvent('tasksUpdated')), 500);
        }

        setIsLoading(false);
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

      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: `Hello ${userName}! I'm your AI assistant for managing tasks. You can ask me to:\n\n• Create tasks\n• Complete tasks\n• Search for tasks\n• List your tasks\n\nHow can I help you today?`,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages([welcomeMessage]);
    } catch {}
  }, [userName]);

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
