import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function Chat({ messages, mode, isLoading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black backdrop-blur-sm text-white overflow-hidden">
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
            <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4 animate-scale-in">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full animate-glow-pulse"></div>
                <div className="relative p-10 bg-gray-900 rounded-3xl border border-gray-700 backdrop-blur-sm shadow-2xl">
                  <div className={`text-7xl mb-2 ${mode === "math" ? "animate-float" : "animate-float"}`} style={{ animationDelay: "1s" }}>
                    {mode === "math" ? "📐" : "⚛️"}
                  </div>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Welcome to your {mode === "math" ? "Math" : "Physics"} Tutor
              </h3>
              <p className="text-gray-400 text-lg mb-2 max-w-md">Ask questions, solve problems, or explore concepts</p>
              <p className="text-gray-500 text-sm">Powered by AI with local documents & web search</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-4 text-white bg-gray-900 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-xl border border-gray-700 animate-slide-up">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium tracking-wide">Thinking</span>
              <div className="flex gap-1 ml-2">
                <span className="animate-bounce text-xl" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce text-xl" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce text-xl" style={{ animationDelay: "300ms" }}>.</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
