/**
 * Test Suite for Chat Service Streaming Functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import chatService from '@/services/chatService';

// Mock Clerk authentication
const mockToken = 'mock_jwt_token';
Object.defineProperty(window, 'clerk', {
  value: {
    session: {
      getToken: vi.fn().mockResolvedValue(mockToken),
    },
  },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn() as any;

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await chatService.sendMessage('Hello');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/chat/message'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`,
          }),
          body: expect.stringContaining('Hello'),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal Server Error' }),
      });

      await expect(chatService.sendMessage('Hello')).rejects.toThrow();
    });
  });

  describe('sendMessageStream', () => {
    it('should return an AbortController to cancel the stream', () => {
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

      // Mock a streaming response
      const streamData = [
        'event: content\ndata: {"content":"Hello "}\n\n',
        'event: content\ndata: {"content":"there!"}\n\n',
        'event: done\ndata: {"content":"Hello there!","message_id":"123"}\n\n',
      ].join('');

      (global.fetch as any).mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => {
              let done = false;
              let index = 0;
              return {
                read: () => {
                  if (done) return Promise.resolve({ done: true });
                  done = true;
                  return Promise.resolve({
                    done: false,
                    value: new TextEncoder().encode(streamData),
                  });
                },
              };
            },
          },
        });
      });

      chatService.sendMessageStream('Hello', {
        onContent,
        onDone,
        onError: vi.fn(),
      });

      // Wait a bit for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onContent).toHaveBeenCalled();
    });

    it('should call onDone callback when stream completes', async () => {
      const onDone = vi.fn();

      const streamData = [
        'event: done\ndata: {"content":"Complete!","message_id":"123"}\n\n',
      ].join('');

      (global.fetch as any).mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => {
              let done = false;
              return {
                read: () => {
                  if (done) return Promise.resolve({ done: true });
                  done = true;
                  return Promise.resolve({
                    done: false,
                    value: new TextEncoder().encode(streamData),
                  });
                },
              };
            },
          },
        });
      });

      chatService.sendMessageStream('Test', {
        onContent: vi.fn(),
        onDone,
        onError: vi.fn(),
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onDone).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            content: 'Complete!',
          }),
        })
      );
    });

    it('should call onError callback on error', async () => {
      const onError = vi.fn();

      (global.fetch as any).mockRejectedValueOnce(
        new Error('Network error')
      );

      chatService.sendMessageStream('Test', {
        onContent: vi.fn(),
        onDone: vi.fn(),
        onError,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onError).toHaveBeenCalledWith('Network error');
    });

    it('should allow cancelling the stream with AbortController', async () => {
      const onContent = vi.fn();

      (global.fetch as any).mockImplementationOnce(() => {
        return new Promise((resolve, reject) => {
          // Never resolve to simulate a long-running request
          setTimeout(() => resolve({
            ok: true,
            body: {
              getReader: () => ({
                read: () => new Promise(() => {}), // Never completes
              }),
            },
          }), 10000);
        });
      });

      const controller = chatService.sendMessageStream('Test', {
        onContent,
        onDone: vi.fn(),
        onError: vi.fn(),
      });

      // Cancel immediately
      controller.abort();

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should have called fetch with the abort signal
      expect(global.fetch).toHaveBeenCalledWith(
        expect.anything(),
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

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const result = await chatService.getHistory();

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].sender).toBe('user');
      expect(result.messages[1].sender).toBe('ai');
    });
  });

  describe('clearHistory', () => {
    it('should clear chat history and generate new session ID', async () => {
      const oldSessionId = chatService.getSessionId();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'History cleared' }),
      });

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

      // Create new instance to test recovery
      const ChatServiceClass = chatService.constructor as any;
      const newService = new ChatServiceClass();

      expect(newService.getSessionId()).toBe(customSessionId);
    });
  });

  describe('utility methods', () => {
    it('formatResponse should convert newlines to br', () => {
      const input = 'Line 1\nLine 2\nLine 3';
      const expected = 'Line 1<br>Line 2<br>Line 3';

      expect(chatService.formatResponse(input)).toBe(expected);
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
