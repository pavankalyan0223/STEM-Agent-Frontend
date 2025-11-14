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

  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState(null);

  async function askThisDoc() {
    if (!selected || !chatInput.trim()) return;
    setChatLoading(true);
    const res = await fetch("http://localhost:8000/ask_doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdf_name: selected.replace("_summary.json", ".pdf"), question: chatInput })
    });
    const data = await res.json();
    setChatResponse(data.answer);
    setChatLoading(false);
  }


useEffect(() => {
  (async () => {
    try {
      const list = await fetchSummaries();
      setFiles(list || []);
      setHasSummaries((list || []).length > 0);
    } catch (err) {
      console.error("Error fetching summaries:", err);
      setError("Failed to load summaries list");
    }
  })();
}, []);

 

  const handleSelect = async (name) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSummary(name);
      if (data && Array.isArray(data)) {
        setSections(data);
        setSelected(name);
      } else {
        setError("Invalid data format received from server");
        console.error("Expected array but got:", data);
      }
    } catch (err) {
      setError(err.message || "Failed to load summary. Please try again.");
      console.error("Error fetching summary:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const existing = await fetchSummaries();

      if (existing && existing.length > 0) {
        // Just load what's already summarized
        setFiles(existing);
        setHasSummaries(true);
      } else {
        // No summaries found → run summarization
        await summarizeAll();
        const newList = await fetchSummaries();
        setFiles(newList || []);
        setHasSummaries((newList || []).length > 0);
      }
    } catch (err) {
      setError(err.message || "Failed to summarize PDFs. Please try again.");
      console.error("Error summarizing:", err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="h-screen w-full flex bg-black text-white">
      {/* LEFT PANEL */}
      <div className="w-80 border-r border-gray-700 p-6 flex flex-col bg-black backdrop-blur-sm shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">
            Document Summaries
          </h2>
          <p className="text-xs text-gray-400">Browse your summarized PDFs</p>
        </div>
        
        <button
          onClick={handleSummarizeAll}
          disabled={loading}
          className="mb-6 px-4 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {hasSummaries ? "Refresh Summaries" : "Summarize PDFs"}
            </>
          )}
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {files.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No summaries yet</p>
            </div>
          ) : (
            files.map((name) => (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group ${
                  selected === name
                    ? "bg-white text-black shadow-lg transform scale-[1.02]"
                    : "bg-gray-900 hover:bg-gray-800 text-white hover:shadow-md border border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selected === name ? 'bg-black/20' : 'bg-gray-800'}`}>
                    <svg className={`w-4 h-4 ${selected === name ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className={`font-medium text-sm truncate flex-1 ${selected === name ? 'text-black' : 'text-white'}`}>
                    {name.replace("_summary.json", "")}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <Link
          to="/"
          className="mt-4 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Chat
        </Link>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-8 overflow-y-auto prose prose-lg max-w-none bg-black backdrop-blur-sm prose-invert">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white border-t-gray-400 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-400 font-medium">Loading document summary...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-6 bg-gray-900 rounded-3xl mb-4 border border-gray-700">
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Summary</h3>
            <p className="text-gray-400 max-w-md mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                if (selected) handleSelect(selected);
              }}
              className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        ) : selected ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-lg">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-white">
                  {selected.replace("_summary.json", "")}
                </h1>
              </div>
              <div className="h-1 w-24 bg-white rounded-full mt-2"></div>
            </div>
            
            <div className="space-y-8">
              {sections && sections.length > 0 ? (
                sections.map((s, index) => (
                  <section key={s.section || index} className="bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-700 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-black font-bold shadow-md">
                        {s.section || index + 1}
                      </div>
                      <h2 className="text-2xl font-bold text-white">
                        Section {s.section || index + 1}
                      </h2>
                    </div>
                    <div className="prose prose-lg max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-code:text-white prose-pre:bg-black text-gray-300 prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {s.summary || s.content || ""}
                      </ReactMarkdown>
                    </div>
                  </section>
                ))
              ) : (
                <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700 text-center">
                  <p className="text-gray-400">No sections found in this summary.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-6 bg-gray-900 rounded-3xl mb-4 border border-gray-700">
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">No Document Selected</h3>
            <p className="text-gray-400 max-w-md">Select a document from the sidebar to view its summary</p>
          </div>
        )}
      </div>
      {selected && (
        <>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`fixed bottom-6 right-6 bg-white text-black px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 font-medium ${
              showChat ? 'scale-95' : 'scale-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Ask This Document
          </button>

          {showChat && (
            <div className="fixed bottom-24 right-6 w-[420px] bg-gray-800 shadow-2xl rounded-3xl border border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-4 bg-white text-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black/20 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Chat with Document</h3>
                      <p className="text-xs text-black/80 truncate max-w-[200px]">
                        {selected.replace("_summary.json", "")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1 hover:bg-black/20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4 h-80 overflow-y-auto bg-gray-900 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {chatLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="relative">
                      <div className="w-10 h-10 border-2 border-white border-t-gray-400 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-3 text-gray-400 text-sm">Thinking...</p>
                  </div>
                ) : chatResponse ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full shrink-0 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">You asked:</p>
                        <p className="text-sm text-gray-200">{chatInput}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-white rounded-full shrink-0 flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1 bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-700">
                        <p className="text-xs text-gray-400 mb-2">AI Response:</p>
                        <div className="prose prose-sm max-w-none text-gray-200 prose-invert">
                          <ReactMarkdown>{chatResponse}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="p-4 bg-gray-900 rounded-2xl mb-3 border border-gray-700">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">Ask a question about this document</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !chatLoading && askThisDoc()}
                    placeholder="Type your question..."
                    className="flex-1 px-4 py-3 bg-black border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all text-white placeholder-gray-500"
                  />
                  <button
                    onClick={askThisDoc}
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
