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
      <input
        className="flex-1 bg-neutral-900 border border-gray-700 text-white placeholder-gray-400 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Type your question… or chat casually."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />
      <button
        className="px-4 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={disabled}
      >
        Send
      </button>
    </form>
  );
}
