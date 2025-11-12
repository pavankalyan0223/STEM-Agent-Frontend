import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function Chat({ messages, mode, isLoading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-900/50 backdrop-blur-sm text-gray-100 overflow-hidden">
      {/* this wrapper scrolls full width, scrollbar at screen edge */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 min-h-0"
        style={{ scrollbarGutter: "stable", scrollbarWidth: "thin" }}
      >
        {/* keep content centered visually */}
        <div className="max-w-3xl mx-auto py-6 grid gap-4">
          {messages.length > 0 ? (
            messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} mode={mode} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="p-6 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-3xl mb-4 border border-gray-700">
                <svg className="w-20 h-20 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-200 mb-2">Start a Conversation</h3>
              <p className="text-gray-400">Start chatting with your {mode} tutor 👋</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400 bg-gray-800 rounded-xl px-4 py-3 shadow-sm border border-gray-700">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="font-medium">Thinking</span>
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
