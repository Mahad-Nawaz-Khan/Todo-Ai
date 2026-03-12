import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
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
  const [operationPerformed, setOperationPerformed] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get Clerk token and user info
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const userName = user?.firstName || user?.fullName || 'friend';

  const { autoLoadHistory = true, enableStreaming = true } = options;

  // Set up the token getter for chatService whenever auth state changes
  useEffect(() => {
    if (isLoaded && getToken) {
      chatService.setTokenGetter(getToken);
    }
  }, [isLoaded, getToken]);

  /**
   * Load chat history from the server
   */
  const loadHistory = useCallback(async () => {
    // Only load if user is signed in
    if (!isSignedIn) {
      return;
    }

    try {
      setIsLoading(true);
      const history = await chatService.getHistory();

      // If no history, show personalized welcome message
      if (!history.messages || history.messages.length === 0) {
        const welcomeText = `Hello ${userName}! I'm your AI assistant for managing tasks. You can ask me to:\n\n• Create tasks\n• Complete tasks\n• Search for tasks\n• List your tasks\n\nHow can I help you today?`;
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: welcomeText,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);

        // Save welcome message to database so it's included in conversation history
        try {
          await chatService.saveWelcomeMessage(welcomeText);
        } catch (err) {
          // Silently fail - welcome message is for display only
        }
      } else {
        setMessages(history.messages);
      }
      setSessionId(history.session_id);
    } catch (error) {
      // Don't throw error - just continue with empty state
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, userName]);

  // Load chat history on mount (after Clerk is loaded and user is signed in)
  useEffect(() => {
    if (autoLoadHistory && isLoaded && isSignedIn) {
      loadHistory();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoLoadHistory, isLoaded, isSignedIn, loadHistory]);

  /**
   * Send a message to the chatbot
   */
  const sendMessage = useCallback(async (text: string) => {
    // Check if user is authenticated
    if (!isLoaded || !isSignedIn) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Please sign in to use the chat feature.',
        sender: 'ai',
        timestamp: new Date(),
      }]);
      return;
    }

    if (!text.trim() || isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setOperationPerformed(null);

    // Create a placeholder AI message for streaming
    const aiMessageId = (Date.now() + 1).toString();
    const aiPlaceholder: Message = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, aiPlaceholder]);

    try {
      if (enableStreaming) {
        // Use streaming endpoint
        abortControllerRef.current = chatService.sendMessageStream(
          text,
          {
            onContent: (delta: string) => {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, text: msg.text + delta }
                    : msg
                )
              );
            },
            onToolCall: (tool: string, args: any) => {
              // Tool call - no action needed
            },
            onToolOutput: (output: any) => {
              // Tool output - no action needed
            },
            onDone: (response) => {
              setMessages(prev =>
                prev.map(msg =>
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
              }

              setIsLoading(false);

              // Trigger a task list refresh after a short delay if an operation was performed
              if (response.operation_performed) {
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('tasksUpdated'));
                }, 500);
              }

              abortControllerRef.current = null;
            },
            onError: (error: string) => {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId
                    ? {
                        ...msg,
                        text: 'Sorry, I encountered an error. Please try again.',
                        isStreaming: false,
                      }
                    : msg
                )
              );
              setIsLoading(false);
              abortControllerRef.current = null;
            },
          }
        );
      } else {
        // Use non-streaming endpoint
        const response = await chatService.sendMessage(text);

        // Create AI message
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.message.content,
          sender: 'ai',
          timestamp: new Date(response.message.created_at),
        };

        setMessages(prev => [...prev, aiMessage]);

        // Store operation performed if any
        if (response.operation_performed) {
          setOperationPerformed(response.operation_performed);
        }

        // Trigger a task list refresh after a short delay if an operation was performed
        if (response.operation_performed) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('tasksUpdated'));
          }, 500);
        }

        setIsLoading(false);
      }

    } catch (error) {
      // Add error message
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: 'Sorry, I encountered an error processing your request. Please try again.',
                isStreaming: false,
              }
            : msg
        )
      );
      setIsLoading(false);
    }
  }, [isLoading, enableStreaming, isSignedIn, isLoaded]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(async () => {
    try {
      await chatService.clearHistory();
      setMessages([]);
      setOperationPerformed(null);
      setSessionId(chatService.getSessionId());
    } catch (error) {
      // Still clear local state even if API call fails
      setMessages([]);
    }
  }, []);

  /**
   * Start a new conversation (clear and generate new session)
   */
  const startNewConversation = useCallback(async () => {
    try {
      await chatService.clearHistory();
      setMessages([]);
      setOperationPerformed(null);
      setSessionId(chatService.getSessionId());

      // Personalized welcome message with user's name
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: `Hello ${userName}! I'm your AI assistant for managing tasks. You can ask me to:\n\n• Create tasks\n• Complete tasks\n• Search for tasks\n• List your tasks\n\nHow can I help you today?`,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      // Silently fail
    }
  }, [userName]);

  /**
   * Format message text for display (handles newlines, etc.)
   */
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
