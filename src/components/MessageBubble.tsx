"use client";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="message message-user">
        {content}
      </div>
    );
  }

  return (
    <div className="message message-llm">
      <div className="message-llm-header">
        🦞 The Oracle
      </div>
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
}
