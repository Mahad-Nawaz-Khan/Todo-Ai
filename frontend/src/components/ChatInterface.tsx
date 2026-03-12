'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useChat } from '@/hooks/useChat';

// Define TypeScript interfaces
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
  showWelcome = true,
  onTaskUpdated,
}) => {
  const {
    messages,
    sendMessage,
    isLoading,
    clearMessages,
    startNewConversation,
    formatMessage,
  } = useChat(initialMessages, { autoLoadHistory: !initialMessages.length });

  const [inputText, setInputText] = useState('');
  const { user, isLoaded: userLoaded } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for task updates from other components
  useEffect(() => {
    const handleTasksUpdated = () => {
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    };

    window.addEventListener('tasksUpdated', handleTasksUpdated);
    return () => {
      window.removeEventListener('tasksUpdated', handleTasksUpdated);
    };
  }, [onTaskUpdated]);

  // Focus input when user loads
  useEffect(() => {
    if (userLoaded && user) {
      inputRef.current?.focus();
    }
  }, [userLoaded, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please sign in to use the chat feature');
      return;
    }

    if (inputText.trim() === '' || isLoading) return;

    sendMessage(inputText);

    // Clear input
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleNewConversation = () => {
    if (confirm('Start a new conversation? This will clear your chat history.')) {
      startNewConversation();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-lg">
      {/* Chat header */}
      <div className="bg-slate-800/50 px-4 py-3 border-b border-white/10 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            AI Assistant
          </h2>
          <p className="text-xs text-white/60 mt-0.5">
            {messages.length} message{messages.length !== 1 ? 's' : ''} • Session: {messages.length > 0 ? 'Active' : 'New'}
          </p>
        </div>
        <button
          onClick={handleNewConversation}
          className="text-white/60 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Start new conversation"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] min-h-[300px]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/50 flex-col gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-medium">No messages yet</p>
              <p className="text-sm mt-1">Try saying "Create a task to buy groceries"</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md shadow-lg shadow-blue-900/20'
                    : 'bg-white/10 text-white rounded-bl-md border border-white/10'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {formatMessage(message.text)}
                </div>
                <div
                  className={`text-xs mt-2 flex items-center gap-2 ${
                    message.sender === 'user' ? 'text-blue-200' : 'text-white/50'
                  }`}
                >
                  <span>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.sender === 'ai' && (
                    <span className="text-white/40">• AI</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white rounded-2xl rounded-bl-md px-4 py-3 border border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-white/60 ml-2">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="border-t border-white/10 p-3 bg-slate-900/30">
        {!userLoaded ? (
          <div className="text-center text-white/50 text-sm py-2">
            Loading...
          </div>
        ) : !user ? (
          <div className="text-center text-white/50 text-sm py-2">
            Please <a href="/sign-in" className="text-blue-400 hover:text-blue-300 underline">sign in</a> to use the chat
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to create, update, or find tasks..."
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pr-12 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Type your message"
                maxLength={5000}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">
                {inputText.length}/5000
              </div>
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                inputText.trim() && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20'
                  : 'bg-white/5 text-white/40 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInterface;