import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function MessageBubble({ role, content, mode }) {
  const isUser = role === "user";
  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"} gap-3`}>
      {!isUser && (
        <div
          className={`mt-1 size-10 rounded-full grid place-items-center shadow-lg shrink-0
            ${mode === "math" ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-purple-500 to-purple-600"}`}
          title={mode === "math" ? "Math tutor" : "Physics tutor"}
        >
          <span className="text-lg">{mode === "math" ? "📐" : "⚛️"}</span>
        </div>
      )}

      <div
        className={[
          "max-w-[75ch] px-5 py-4 rounded-2xl shadow-xl break-words transition-all backdrop-blur-sm",
          isUser
            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm hover:shadow-2xl"
            : "bg-gray-800/90 border border-gray-700/50 text-gray-100 rounded-bl-sm hover:shadow-2xl",
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
                  <pre className={`overflow-auto rounded-lg p-3 ${isUser ? 'bg-white/20 text-gray-100' : 'bg-gray-900 text-gray-200'} ${className || ""}`}>
                  <code>{children}</code>
                </pre>
              );
            },
            a(props) {
                return <a {...props} className={`underline ${isUser ? 'text-blue-200 hover:text-white' : 'text-blue-400 hover:text-blue-300'}`} />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      </div>

      {isUser && (
        <div className="mt-1 size-10 rounded-full grid place-items-center bg-gray-700 shrink-0">
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
}
