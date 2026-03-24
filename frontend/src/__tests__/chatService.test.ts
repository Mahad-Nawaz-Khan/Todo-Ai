import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import chatService from '@/services/chatService';

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>;
type ChatServiceInstance = {
  getSessionId: () => string;
};

const mockToken = 'mock_jwt_token';
const fetchMock = vi.fn<typeof fetch>();

global.fetch = fetchMock as FetchMock;

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    chatService.setTokenGetter(vi.fn().mockResolvedValue(mockToken));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message and return a response', async () => {
      const mockResponse = {
        message: {
          id: '123',
          content: 'Hello! How can I help you?',
          sender_type: 'AI' as const,
          created_at: new Date().toISOString(),
        },
        model_used: 'OpenAI Agents SDK (gpt-4o-mini)',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await chatService.sendMessage('Hello');

      expect(result).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/chat/message'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          }),
          body: expect.stringContaining('Hello'),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal Server Error' }),
      } as Response);

      await expect(chatService.sendMessage('Hello')).rejects.toThrow('Internal Server Error');
    });
  });

  describe('sendMessageStream', () => {
    it('should return an AbortController to cancel the stream', () => {
      fetchMock.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: undefined }),
          }),
        },
      } as unknown as Response);

      const controller = chatService.sendMessageStream('Test message', {
        onContent: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      });

      expect(controller).toBeInstanceOf(AbortController);
    });

    it('should call onContent callback for each content delta', async () => {
      const onContent = vi.fn();
      const onDone = vi.fn();
      const streamData = [
        'data: {"type":"content_delta","content":"Hello "}\n',
        'data: {"type":"content_delta","content":"there!"}\n',
        'data: {"type":"final","content":"Hello there!"}\n',
      ].join('');

      fetchMock.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => {
            let done = false;
            return {
              read: () => {
                if (done) {
                  return Promise.resolve({ done: true, value: undefined });
                }
                done = true;
                return Promise.resolve({
                  done: false,
                  value: new TextEncoder().encode(streamData),
                });
              },
            };
          },
        },
      } as unknown as Response);

      chatService.sendMessageStream('Hello', {
        onContent,
        onDone,
        onError: vi.fn(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onContent).toHaveBeenCalledTimes(2);
      expect(onContent).toHaveBeenNthCalledWith(1, 'Hello ');
      expect(onContent).toHaveBeenNthCalledWith(2, 'there!');
      expect(onDone).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            content: 'Hello there!',
          }),
        })
      );
    });

    it('should call onError callback on error', async () => {
      const onError = vi.fn();

      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      chatService.sendMessageStream('Test', {
        onContent: vi.fn(),
        onDone: vi.fn(),
        onError,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onError).toHaveBeenCalledWith('Network error');
    });

    it('should allow cancelling the stream with AbortController', async () => {
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                body: {
                  getReader: () => ({
                    read: () => new Promise(() => {}),
                  }),
                },
              } as unknown as Response);
            }, 10000);
          })
      );

      const controller = chatService.sendMessageStream('Test', {
        onContent: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      });

      controller.abort();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe('getHistory', () => {
    it('should fetch chat history', async () => {
      const mockHistory = {
        messages: [
          {
            id: '1',
            content: 'Hello',
            sender_type: 'USER' as const,
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            content: 'Hi there!',
            sender_type: 'AI' as const,
            created_at: new Date().toISOString(),
          },
        ],
        total_count: 2,
        session_id: 'session_123',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      } as Response);

      const result = await chatService.getHistory();

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].sender).toBe('user');
      expect(result.messages[1].sender).toBe('ai');
    });
  });

  describe('clearHistory', () => {
    it('should clear chat history and generate new session ID', async () => {
      const oldSessionId = chatService.getSessionId();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'History cleared' }),
      } as Response);

      await chatService.clearHistory();

      const newSessionId = chatService.getSessionId();
      expect(newSessionId).not.toBe(oldSessionId);
    });
  });

  describe('session management', () => {
    it('should persist session ID in localStorage', () => {
      const sessionId = chatService.getSessionId();
      expect(localStorage.getItem('chat_session_id')).toBe(sessionId);
    });

    it('should recover session ID from localStorage', () => {
      const customSessionId = 'custom_session_123';
      localStorage.setItem('chat_session_id', customSessionId);

      const ChatServiceClass = chatService.constructor as new () => ChatServiceInstance;
      const newService = new ChatServiceClass();

      expect(newService.getSessionId()).toBe(customSessionId);
    });
  });

  describe('utility methods', () => {
    it('formatResponse should convert newlines to br', () => {
      expect(chatService.formatResponse('Line 1\nLine 2\nLine 3')).toBe('Line 1<br>Line 2<br>Line 3');
    });

    it('getOperationType should extract operation type', () => {
      const response = {
        message: {
          id: '1',
          content: 'Task created',
          sender_type: 'AI' as const,
          created_at: new Date().toISOString(),
        },
        operation_performed: {
          type: 'create_task',
          result: { id: 1 },
        },
      };

      expect(chatService.getOperationType(response)).toBe('create_task');
    });

    it('isOperationSuccessful should return true for successful operations', () => {
      const successfulResponse = {
        message: {
          id: '1',
          content: 'Done',
          sender_type: 'AI' as const,
          created_at: new Date().toISOString(),
        },
        operation_performed: {
          type: 'create_task',
        },
      };

      expect(chatService.isOperationSuccessful(successfulResponse)).toBe(true);
    });

    it('isOperationSuccessful should return false when no operation performed', () => {
      const noOperationResponse = {
        message: {
          id: '1',
          content: 'Hello',
          sender_type: 'AI' as const,
          created_at: new Date().toISOString(),
        },
      };

      expect(chatService.isOperationSuccessful(noOperationResponse)).toBe(false);
    });
  });
});
