import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">Chat Interface Demo</h1>
          <p className="mt-2 text-white/70">A responsive chat component with message history</p>
        </header>

        <main>
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <ChatInterface />
          </div>
        </main>
      </div>
    </div>
  );
}