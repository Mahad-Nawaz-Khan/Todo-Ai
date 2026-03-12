'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { useChat } from '@/hooks/useChat';

// Use the same Message type as ChatInterface to avoid type conflicts
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AdvancedChatPage() {
  const [showDemo, setShowDemo] = useState(true);

  // Sample initial messages
  const initialMessages: Message[] = [
    {
      id: '1',
      text: 'Hello there! 👋 Welcome to the chat interface.',
      sender: 'ai',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    },
    {
      id: '2',
      text: 'Thanks! This looks great.',
      sender: 'user',
      timestamp: new Date(Date.now() - 240000), // 4 minutes ago
    },
    {
      id: '3',
      text: 'The messages are displayed chronologically with timestamps.',
      sender: 'ai',
      timestamp: new Date(Date.now() - 180000), // 3 minutes ago
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">Advanced Chat Interface</h1>
          <p className="mt-2 text-white/70">A responsive chat component with message history</p>
        </header>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowDemo(true)}
            className={`px-4 py-2 rounded-lg ${
              showDemo
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Show Demo
          </button>
          <button
            onClick={() => setShowDemo(false)}
            className={`px-4 py-2 rounded-lg ${
              !showDemo
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Empty Chat
          </button>
        </div>

        <main>
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <ChatInterface initialMessages={showDemo ? initialMessages : []} />
          </div>
        </main>
        
        <div className="mt-8 text-sm text-white/60">
          <p>This chat interface includes:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Chronological message display with timestamps</li>
            <li>Different styling for user vs other messages</li>
            <li>Auto-scroll to latest message</li>
            <li>Loading states during message sending</li>
            <li>Responsive design that works on all screen sizes</li>
            <li>TypeScript type safety</li>
          </ul>
        </div>
      </div>
    </div>
  );
}