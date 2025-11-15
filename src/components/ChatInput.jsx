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
      <div className="flex-1 relative group">
        <input
          className="w-full bg-black border border-gray-700 text-white placeholder-gray-500 rounded-2xl px-6 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:border-gray-600 backdrop-blur-sm"
          placeholder="Ask anything about math or physics..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors duration-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      <button
        className="px-6 py-4 rounded-2xl bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-medium flex items-center gap-2 relative overflow-hidden group"
        disabled={disabled || !text.trim()}
        type="submit"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
        <span className="relative flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span className="hidden sm:inline">Send</span>
        </span>
      </button>
    </form>
  );
}
