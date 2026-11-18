import { Tooltip } from "@/components/ui/Tooltip";

export function UserMessage({
  text,
  timestamp,
}: Readonly<{ text: string; timestamp: Date }>) {
  const timeLabel = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex justify-end">
      <Tooltip label={timeLabel} side="top">
        <div className="max-w-[85%] rounded-xl rounded-br-xs border border-line-subtle bg-surface-2 px-3 py-2 text-sm leading-[22px] text-fg whitespace-pre-wrap">
          {text}
        </div>
      </Tooltip>
    </div>
  );
}
