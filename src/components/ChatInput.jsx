import { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const t = text.trim();
        if (!t) return;
        onSend(t);
        setText("");
      }}
      className="w-full flex gap-2"
    >
      <div className="flex-1 relative">
        <input
          className="w-full bg-gray-800/80 border border-gray-700/50 text-gray-100 placeholder-gray-500 rounded-xl px-5 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-lg hover:shadow-xl backdrop-blur-sm"
          placeholder="Ask anything about math or physics..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      <button
        className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-medium flex items-center gap-2"
        disabled={disabled || !text.trim()}
        type="submit"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <span className="hidden sm:inline">Send</span>
      </button>
    </form>
  );
}
