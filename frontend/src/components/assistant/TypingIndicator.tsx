export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1" aria-label="Assistant is thinking">
      <span className="typing-dot size-1.5 rounded-full bg-accent-text" />
      <span className="typing-dot size-1.5 rounded-full bg-accent-text" />
      <span className="typing-dot size-1.5 rounded-full bg-accent-text" />
    </div>
  );
}
