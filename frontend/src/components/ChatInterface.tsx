'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

import { useUser } from '@/context/AuthContext';
import { useChat } from '@/hooks/useChat';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatInterfaceProps {
  initialMessages?: Message[];
  showWelcome?: boolean;
  onTaskUpdated?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialMessages = [],
  onTaskUpdated,
}) => {
  const { messages, sendMessage, isLoading, startNewConversation, formatMessage } = useChat(initialMessages, {
    autoLoadHistory: !initialMessages.length,
  });

  const [inputText, setInputText] = useState('');
  const { user, isLoaded: userLoaded } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleTasksUpdated = () => {
      onTaskUpdated?.();
    };

    window.addEventListener('tasksUpdated', handleTasksUpdated);
    return () => window.removeEventListener('tasksUpdated', handleTasksUpdated);
  }, [onTaskUpdated]);

  useEffect(() => {
    if (userLoaded && user) {
      inputRef.current?.focus();
    }
  }, [userLoaded, user]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please sign in to use the chat feature');
      return;
    }

    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleNewConversation = () => {
    if (confirm('Start a new conversation? This will clear your chat history.')) {
      startNewConversation();
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-800/50 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            AI Assistant
          </h2>
          <p className="mt-0.5 text-xs text-white/60">
            {messages.length} message{messages.length !== 1 ? 's' : ''} • Session: {messages.length > 0 ? 'Active' : 'New'}
          </p>
        </div>
        <button
          onClick={handleNewConversation}
          className="rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          title="Start new conversation"
        >
          New chat
        </button>
      </div>

      <div className="max-h-100 min-h-75 flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-white/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-medium">No messages yet</p>
              <p className="mt-1 text-sm">Try saying &quot;Create a task to buy groceries&quot;</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'rounded-br-md bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'rounded-bl-md border border-white/10 bg-white/10 text-white'
                }`}
              >
                <div className="markdown-content text-sm leading-relaxed">
                  {message.sender === 'ai' ? <ReactMarkdown>{message.text}</ReactMarkdown> : formatMessage(message.text)}
                </div>
                <div className={`mt-2 flex items-center gap-2 text-xs ${message.sender === 'user' ? 'text-blue-200' : 'text-white/50'}`}>
                  <span>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.sender === 'ai' && <span className="text-white/40">• AI</span>}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/10 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="ml-2 text-sm text-white/60">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-white/10 bg-slate-900/30 p-3">
        {!userLoaded ? (
          <div className="py-2 text-center text-sm text-white/50">Loading...</div>
        ) : !user ? (
          <div className="py-2 text-center text-sm text-white/50">
            Please <Link href="/sign-in" className="text-blue-400 underline hover:text-blue-300">sign in</Link> to use the chat
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask me to create, update, or find tasks..."
                disabled={isLoading}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-12 text-white placeholder-white/40 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Type your message"
                maxLength={5000}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">{inputText.length}/5000</div>
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`rounded-lg px-4 py-2.5 font-medium transition-all ${
                inputText.trim() && !isLoading ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-700' : 'cursor-not-allowed bg-white/5 text-white/40'
              }`}
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInterface;
