import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function MessageBubble({ role, content, mode }) {
  const isUser = role === "user";
  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"} gap-4 animate-slide-up`}>
      {!isUser && (
        <div
          className="mt-1 size-12 rounded-full grid place-items-center shadow-lg shrink-0 bg-white hover:scale-110 transition-transform duration-300"
          title={mode === "math" ? "Math expert" : "Physics expert"}
        >
          <span className="text-xl">{mode === "math" ? "📐" : "⚛️"}</span>
        </div>
      )}

      <div
        className={[
          "max-w-[75ch] px-6 py-5 rounded-3xl shadow-xl break-words transition-all duration-300 backdrop-blur-sm",
          isUser
            ? "bg-white text-black rounded-br-sm hover:shadow-2xl hover:scale-[1.02]"
            : "bg-gray-900 border border-gray-700 text-white rounded-bl-sm hover:shadow-2xl hover:border-gray-600 hover:scale-[1.01]",
        ].join(" ")}
      >
        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-invert'}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code(props) {
              const { children, className } = props;
              return (
                  <pre className={`overflow-auto rounded-lg p-3 ${isUser ? 'bg-gray-200 text-black' : 'bg-black text-white'} ${className || ""}`}>
                  <code>{children}</code>
                </pre>
              );
            },
            a(props) {
                return <a {...props} className={`underline ${isUser ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'}`} />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      </div>

      {isUser && (
        <div className="mt-1 size-12 rounded-full grid place-items-center bg-white shrink-0 hover:scale-110 transition-transform duration-300 shadow-lg">
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
}
