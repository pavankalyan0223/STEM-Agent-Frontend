import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function Chat({ messages, mode, isLoading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-gray-900/80 via-gray-900/50 to-gray-900/80 backdrop-blur-sm text-gray-100 overflow-hidden">
      {/* this wrapper scrolls full width, scrollbar at screen edge */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 min-h-0"
        style={{ scrollbarGutter: "stable", scrollbarWidth: "thin" }}
      >
        {/* keep content centered visually */}
        <div className="max-w-4xl mx-auto py-8 grid gap-5">
          {messages.length > 0 ? (
            messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} mode={mode} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl rounded-full"></div>
                <div className="relative p-8 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-3xl border border-gray-700/50 backdrop-blur-sm">
                  <div className={`text-6xl mb-2 ${mode === "math" ? "animate-pulse" : ""}`}>
                    {mode === "math" ? "📐" : "⚛️"}
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Welcome to your {mode === "math" ? "Math" : "Physics"} Tutor
              </h3>
              <p className="text-gray-400 text-lg mb-1">Ask questions, solve problems, or explore concepts</p>
              <p className="text-gray-500 text-sm">Powered by AI with local documents & web search</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-3 text-gray-300 bg-gray-800/60 backdrop-blur-sm rounded-xl px-5 py-4 shadow-lg border border-gray-700/50">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Thinking</span>
              <div className="flex gap-1 ml-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
