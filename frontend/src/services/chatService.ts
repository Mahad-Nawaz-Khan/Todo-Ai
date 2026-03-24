/**
 * Chat Service - Client for AI Chatbot API
 */

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface ChatResponse {
  message: {
    id: string;
    content: string;
    sender_type: 'USER' | 'AI';
    intent?: string;
    created_at: string;
  };
  operation_performed?: {
    type: string;
    result?: unknown;
    count?: number;
    task_id?: number;
  };
  model_used?: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total_count: number;
  session_id: string;
}

interface TokenResponse {
  accessToken?: string;
}

interface ErrorResponse {
  detail?: string;
}

interface HistoryApiMessage {
  id: string;
  content: string;
  sender_type: 'USER' | 'AI';
  created_at: string;
}

interface HistoryApiResponse {
  messages: HistoryApiMessage[];
  total_count: number;
  session_id: string;
}

interface StreamEvent {
  type?: string;
  content?: string;
  tool?: string;
  args?: unknown;
  output?: unknown;
  operation_performed?: ChatResponse['operation_performed'];
  model_used?: string;
}

type TokenGetter = () => Promise<string | null>;

type StreamCallbacks = {
  onContent: (delta: string) => void;
  onToolCall?: (tool: string, args: unknown) => void;
  onToolOutput?: (output: unknown) => void;
  onDone: (response: ChatResponse) => void;
  onError: (error: string) => void;
};

function createSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function mapHistoryMessage(msg: HistoryApiMessage): ChatMessage {
  return {
    id: msg.id,
    text: msg.content,
    sender: msg.sender_type === 'USER' ? 'user' : 'ai',
    timestamp: new Date(msg.created_at),
  };
}

class ChatService {
  private baseUrl: string;
  private sessionId: string;
  private tokenGetter: TokenGetter | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    if (typeof window !== 'undefined') {
      this.sessionId = localStorage.getItem('chat_session_id') || createSessionId();
      localStorage.setItem('chat_session_id', this.sessionId);
    } else {
      this.sessionId = 'session_server';
    }
  }

  setTokenGetter(getter: TokenGetter) {
    this.tokenGetter = getter;
  }

  formatResponse(text: string): string {
    return text.replace(/\n/g, '<br>');
  }

  getOperationType(response: ChatResponse): string | null {
    return response.operation_performed?.type || null;
  }

  isOperationSuccessful(response: ChatResponse): boolean {
    return Boolean(response.operation_performed?.type);
  }

  private generateSessionId(): string {
    return createSessionId();
  }

  private async getAuthToken(): Promise<string> {
    if (this.tokenGetter) {
      const token = await this.tokenGetter();
      if (token) {
        return token;
      }
    }

    if (typeof window !== 'undefined') {
      const response = await fetch('/api/auth/token', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = (await response.json()) as TokenResponse;
        if (data.accessToken) {
          return data.accessToken;
        }
      }
    }

    throw new Error('No authentication token available. Please sign in.');
  }

  async sendMessage(content: string): Promise<ChatResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content,
        session_id: this.sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as ErrorResponse;
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as ChatResponse;
  }

  sendMessageStream(content: string, callbacks: StreamCallbacks): AbortController {
    const controller = new AbortController();

    this.getAuthToken()
      .then((token) => {
        const url = new URL(`${this.baseUrl}/api/v1/chat/stream`);
        url.searchParams.set('content', content);
        url.searchParams.set('session_id', this.sessionId);

        fetch(url.toString(), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let fullResponse = '';

            const readStream = (): Promise<void> => {
              return reader.read().then(({ done, value }) => {
                if (done) {
                  try {
                    callbacks.onDone(JSON.parse(fullResponse) as ChatResponse);
                  } catch {
                    callbacks.onDone({
                      message: {
                        id: Date.now().toString(),
                        content: fullResponse || 'Response completed',
                        sender_type: 'AI',
                        created_at: new Date().toISOString(),
                      },
                    });
                  }
                  return Promise.resolve();
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (!line.startsWith('data: ')) {
                    continue;
                  }

                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data) as StreamEvent;

                    if (parsed.type === 'content_delta') {
                      callbacks.onContent(parsed.content || '');
                      fullResponse += parsed.content || '';
                    } else if (parsed.type === 'tool_call') {
                      callbacks.onToolCall?.(parsed.tool || '', parsed.args);
                    } else if (parsed.type === 'tool_output') {
                      callbacks.onToolOutput?.(parsed.output);
                    } else if (parsed.type === 'final') {
                      callbacks.onDone({
                        message: {
                          id: Date.now().toString(),
                          content: parsed.content || '',
                          sender_type: 'AI',
                          created_at: new Date().toISOString(),
                        },
                        operation_performed: parsed.operation_performed,
                        model_used: parsed.model_used,
                      });
                      controller.abort();
                      return Promise.resolve();
                    } else if (parsed.type === 'error') {
                      callbacks.onError(parsed.content || 'Unknown error');
                      controller.abort();
                      return Promise.resolve();
                    }
                  } catch {
                    // Ignore malformed SSE chunks.
                  }
                }

                return readStream();
              });
            };

            return readStream();
          })
          .catch((error: unknown) => {
            if (error instanceof Error && error.name === 'AbortError') {
              return;
            }
            callbacks.onError(error instanceof Error ? error.message : 'Stream error');
          });
      })
      .catch((error: unknown) => {
        callbacks.onError(error instanceof Error ? error.message : 'Failed to get authentication token');
      });

    return controller;
  }

  async getHistory(): Promise<ChatHistoryResponse> {
    try {
      const token = await this.getAuthToken();

      const url = new URL(`${this.baseUrl}/api/v1/chat/history`);
      url.searchParams.set('session_id', this.sessionId);
      url.searchParams.set('limit', '50');

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as HistoryApiResponse;
      return {
        messages: data.messages.map(mapHistoryMessage),
        total_count: data.total_count,
        session_id: data.session_id,
      };
    } catch {
      return {
        messages: [],
        total_count: 0,
        session_id: this.sessionId,
      };
    }
  }

  async clearHistory(): Promise<void> {
    const token = await this.getAuthToken();

    await fetch(`${this.baseUrl}/api/v1/chat/history`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.sessionId = this.generateSessionId();
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat_session_id', this.sessionId);
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async saveWelcomeMessage(content: string): Promise<void> {
    const token = await this.getAuthToken();

    await fetch(`${this.baseUrl}/api/v1/chat/message/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content,
        session_id: this.sessionId,
        is_welcome: true,
      }),
    });
  }

  cancelRequest(): void {}
}

const chatService = new ChatService();

export default chatService;
