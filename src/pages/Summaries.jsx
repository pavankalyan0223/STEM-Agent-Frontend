import { useEffect, useState } from "react";
import { fetchSummaries, fetchSummary, summarizeAll } from "../lib/api.js";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function Summaries() {
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSummaries, setHasSummaries] = useState(false);

useEffect(() => {
  (async () => {
    const list = await fetchSummaries();
    setFiles(list);
    setHasSummaries(list.length > 0);
  })();
}, []);

 

  const handleSelect = async (name) => {
    setLoading(true);
    const data = await fetchSummary(name);
    setSections(data);
    setSelected(name);
    setLoading(false);
  };

  const handleSummarizeAll = async () => {
  setLoading(true);
  const existing = await fetchSummaries();

  if (existing && existing.length > 0) {
    // Just load what’s already summarized
    setFiles(existing);
  } else {
    // No summaries found → run summarization
    await summarizeAll();
    const newList = await fetchSummaries();
    setFiles(newList);
  }

  setLoading(false);
};


  return (
    <div className="h-screen w-full flex bg-gray-50 text-black">
      {/* LEFT PANEL */}
      <div className="w-1/4 border-r border-gray-300 p-4 flex flex-col bg-white shadow-md">
        <h2 className="text-lg font-semibold mb-2">Summarized Files</h2>
              <button
        onClick={handleSummarizeAll}
        className="mb-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
      >
        {hasSummaries ? "Load Summaries" : "Summarize PDFs"}
      </button>


        <div className="flex-1 overflow-y-auto space-y-1">
          {files.map((name) => (
            <button
              key={name}
              onClick={() => handleSelect(name)}
              className={`block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 ${
                selected === name ? "bg-gray-200 font-semibold border-l-4 border-blue-500" : ""
              }`}
            >
              {name.replace("_summary.json", "")}
            </button>
          ))}
        </div>

        <Link
          to="/"
          className="mt-4 text-sm text-gray-500 hover:text-blue-600 underline"
        >
          ← Back to Chat
        </Link>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-8 overflow-y-auto prose prose-lg max-w-none bg-white">
        {loading ? (
          <p className="text-gray-400 animate-pulse">Loading...</p>
        ) : selected ? (
          <>
            <h1 className="text-3xl font-bold mb-6">
              {selected.replace("_summary.json", "").toUpperCase()}
            </h1>
            {sections.map((s) => (
              <section key={s.section} className="mb-10">
                <h2 className="text-2xl font-semibold mb-3">
                  Section {s.section}
                </h2>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {s.summary}
                </ReactMarkdown>
              </section>
            ))}
          </>
        ) : (
          <p className="text-gray-500">Select a file to view its summary.</p>
        )}
      </div>
    </div>
  );
}
