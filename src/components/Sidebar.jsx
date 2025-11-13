import { v4 as uuidv4 } from "uuid";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { uploadPdfs } from "../lib/api.js";
import { useRef, useState } from "react";


export default function Sidebar({
  sessions,
  currentId,
  onNewSession,
  onSelect,
  onReindex,
  onDeleteSession,
  mode,
  setMode,
  useRag,
  setUseRag,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const handleUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    setUploading(true);
    setUploadMsg("Uploading and processing...");
    try {
      const res = await uploadPdfs(files);
      setUploadMsg(res.message || "Upload complete!");
    } catch (err) {
      console.error(err);
      setUploadMsg("Upload failed!");
    } finally {
      setUploading(false);
      event.target.value = ""; // reset input
    }
  };


  return (
    <aside className="h-full w-full border-r border-gray-700/50 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 backdrop-blur-sm p-5 flex flex-col gap-5 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Chat Sessions</h2>
          <p className="text-xs text-gray-500 mt-0.5">Your conversations</p>
        </div>
        <button
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all shadow-md hover:shadow-lg hover:scale-105 font-medium text-sm"
          onClick={() => onNewSession(uuidv4())}
          title="New chat"
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New</span>
          </span>
        </button>
      </div>

      {/* Session List */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent pr-1">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No sessions yet</p>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={clsx(
                "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group",
                currentId === s.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.01]"
                  : "bg-gray-800/50 hover:bg-gray-700/70 text-gray-200 hover:shadow-md border border-gray-700/50 hover:border-gray-600"
              )}
            >
              <button
                onClick={() => onSelect(s.id)}
                className="flex-1 text-left overflow-hidden"
                title="Open session"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{s.mode === "math" ? "📐" : "⚛️"}</span>
                  <span className="font-semibold truncate text-sm">{s.title || "Untitled"}</span>
                </div>
                <div className={`text-xs truncate ${currentId === s.id ? 'text-white/80' : 'text-gray-400'}`}>
                  {s.preview || "Start chatting…"}
                </div>
              </button>

              {/* Delete Button */}
              <button
                onClick={() => onDeleteSession(s.id)}
                className={`ml-2 p-1 rounded-lg transition-colors ${
                  currentId === s.id
                    ? "text-white/80 hover:bg-white/20 hover:text-white"
                    : "text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                }`}
                title="Delete session"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Mode Controls */}
      <div className="mt-auto space-y-3 pt-4 border-t border-gray-700/50">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Subject Mode</label>
          <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("math")}
            className={clsx(
              "px-3 py-2 rounded-xl border transition-all duration-200 font-medium text-sm",
              mode === "math"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500 shadow-md"
                : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-blue-500"
            )}
          >
            📐 Math
          </button>
          <button
            onClick={() => setMode("physics")}
            className={clsx(
              "px-3 py-2 rounded-xl border transition-all duration-200 font-medium text-sm",
              mode === "physics"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-500 shadow-md"
                : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-purple-500"
            )}
          >
            ⚛️ Physics
          </button>
        </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-gray-200 transition-colors">
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-600 rounded focus:ring-blue-500 bg-gray-800"
            />
            <span>Use textbook retrieval (RAG)</span>
          </label>

          <button
            onClick={onReindex}
            className="w-full px-3 py-2 rounded-lg border border-gray-700/50 bg-gray-800/50 hover:bg-gray-700/70 text-gray-300 transition-all hover:shadow-md hover:border-gray-600 font-medium text-sm"
            title="Reindex PDFs"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reindex PDFs
            </span>
          </button>
        </div>

        {/* --- Upload PDFs --- */}
        <div>
          <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wider">Knowledge Base</h3>
          <button
            onClick={() => fileInputRef.current.click()}
            className="w-full px-3 py-2 rounded-lg border border-gray-700/50 bg-gray-800/50 hover:bg-gray-700/70 disabled:opacity-50 transition-all hover:shadow-md hover:border-gray-600 font-medium text-sm text-gray-300"
            disabled={uploading}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload PDFs
            </span>
          </button>
          <input
            type="file"
            accept=".pdf"
            multiple
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />
          {uploading ? (
            <p className="text-xs text-blue-400 mt-2 flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {uploadMsg}
            </p>
          ) : uploadMsg ? (
            <p className={`text-xs mt-2 ${uploadMsg.includes("failed") ? "text-red-400" : "text-green-400"}`}>{uploadMsg}</p>
          ) : null}
        </div>

        <Link
          to="/summaries"
          className="px-3 py-2 rounded-lg border border-gray-700/50 text-center bg-gray-800/50 hover:bg-gray-700/70 transition-all hover:shadow-md hover:border-gray-600 font-medium text-sm text-gray-300 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Summarized Content
        </Link>
      </div>
    </aside>
  );
}
