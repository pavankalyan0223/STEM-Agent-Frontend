import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function MessageBubble({ role, content, mode }) {
  const isUser = role === "user";
  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div
          className={`mr-2 mt-1 size-8 rounded-full grid place-items-center shadow
            ${mode === "math" ? "bg-blue-900/50" : "bg-purple-900/50"}`}
          title={mode === "math" ? "Math tutor" : "Physics tutor"}
        >
          {mode === "math" ? "📐" : "⚛️"}
        </div>
      )}

      <div
        className={[
          "max-w-[72ch] px-4 py-3 rounded-2xl shadow-sm break-words",
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-neutral-900 border border-gray-800 text-gray-100 rounded-bl-sm",
        ].join(" ")}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code(props) {
              const { children, className } = props;
              return (
                <pre className={`overflow-auto rounded-lg p-3 bg-neutral-950 text-gray-200 ${className || ""}`}>
                  <code>{children}</code>
                </pre>
              );
            },
            a(props) {
              return <a {...props} className="underline text-blue-400 hover:text-blue-300" />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
