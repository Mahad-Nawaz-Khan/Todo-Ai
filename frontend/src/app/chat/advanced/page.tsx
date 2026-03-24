'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const demoMessages: Message[] = [
  {
    id: '1',
    text: 'Hello there! 👋 Welcome to the chat interface.',
    sender: 'ai',
    timestamp: new Date('2024-01-01T12:00:00.000Z'),
  },
  {
    id: '2',
    text: 'Thanks! This looks great.',
    sender: 'user',
    timestamp: new Date('2024-01-01T12:01:00.000Z'),
  },
  {
    id: '3',
    text: 'The messages are displayed chronologically with timestamps.',
    sender: 'ai',
    timestamp: new Date('2024-01-01T12:02:00.000Z'),
  },
];

export default function AdvancedChatPage() {
  const [showDemo, setShowDemo] = useState(true);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold md:text-4xl">Advanced Chat Interface</h1>
          <p className="mt-2 text-white/70">A responsive chat component with message history</p>
        </header>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowDemo(true)}
            className={`rounded-lg px-4 py-2 ${showDemo ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            Show Demo
          </button>
          <button
            onClick={() => setShowDemo(false)}
            className={`rounded-lg px-4 py-2 ${!showDemo ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            Empty Chat
          </button>
        </div>

        <main>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <ChatInterface initialMessages={showDemo ? demoMessages : []} />
          </div>
        </main>

        <div className="mt-8 text-sm text-white/60">
          <p>This chat interface includes:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
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
