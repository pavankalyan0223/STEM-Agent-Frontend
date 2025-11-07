import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function Chat({ messages, mode, isLoading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black text-white">
      {/* this wrapper scrolls full width, scrollbar at screen edge */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8"
        style={{ scrollbarGutter: "stable", scrollbarWidth: "thin" }}
      >
        {/* keep content centered visually */}
        <div className="max-w-3xl mx-auto py-4 grid gap-3">
          {messages.length > 0 ? (
            messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} mode={mode} />
            ))
          ) : (
            <div className="text-gray-500 text-center mt-20">
              Start chatting with your {mode} tutor 👋
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400">
              <span className="animate-pulse">Thinking</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
