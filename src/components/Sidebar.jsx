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
    <aside className="h-full w-full border-r border-gray-700/50 bg-black backdrop-blur-sm p-6 flex flex-col gap-6 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between mb-2 animate-slide-up">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Chat Sessions</h2>
          <p className="text-xs text-gray-500 mt-1">Your conversations</p>
        </div>
        <button
          className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-medium text-sm relative overflow-hidden group"
          onClick={() => onNewSession(uuidv4())}
          title="New chat"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
          <span className="relative flex items-center gap-1.5">
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
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer animate-slide-up",
                currentId === s.id
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transform scale-[1.02] border-2 border-white"
                  : "bg-gray-900 hover:bg-gray-800 text-white hover:shadow-lg border border-gray-700 hover:border-gray-600 hover:scale-[1.01]"
              )}
              style={{ animationDelay: `${sessions.indexOf(s) * 0.05}s` }}
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
                <div className={`text-xs truncate ${currentId === s.id ? 'text-black/70' : 'text-gray-400'}`}>
                  {s.preview || "Start chatting…"}
                </div>
              </button>

              {/* Delete Button */}
              <button
                onClick={() => onDeleteSession(s.id)}
                className={`ml-2 p-1 rounded-lg transition-colors ${
                  currentId === s.id
                    ? "text-black/70 hover:bg-black/20 hover:text-black"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
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
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Subject Mode</label>
          <div className="flex gap-4 justify-center items-center">
          <button
            onClick={() => setMode("math")}
            className={clsx(
              "relative w-18 h-18 rounded-full border-2 transition-all duration-500 ease-out font-medium text-sm flex flex-col items-center justify-center group overflow-hidden",
              mode === "math"
                ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-105"
                : "bg-black border-gray-600 text-white hover:bg-gray-900 hover:border-gray-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-110 active:scale-95"
            )}
            style={{ transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)", width: "4.5rem", height: "4.5rem" }}
          >
            <div className={clsx(
              "absolute inset-0 rounded-full opacity-0 transition-opacity duration-500",
              mode === "math" ? "bg-gradient-to-br from-white/20 to-transparent opacity-100" : "group-hover:bg-gradient-to-br group-hover:from-white/10 group-hover:to-transparent group-hover:opacity-100"
            )}></div>
            <span className={clsx(
              "text-2xl mb-0.5 relative z-10 transition-transform duration-300",
              mode === "math" ? "animate-float" : "group-hover:scale-110"
            )}>📐</span>
            <span className="relative z-10 text-xs font-semibold tracking-wide">Math</span>
          </button>
          <button
            onClick={() => setMode("physics")}
            className={clsx(
              "relative w-18 h-18 rounded-full border-2 transition-all duration-500 ease-out font-medium text-sm flex flex-col items-center justify-center group overflow-hidden",
              mode === "physics"
                ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-105"
                : "bg-black border-gray-600 text-white hover:bg-gray-900 hover:border-gray-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-110 active:scale-95"
            )}
            style={{ transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)", width: "4.5rem", height: "4.5rem" }}
          >
            <div className={clsx(
              "absolute inset-0 rounded-full opacity-0 transition-opacity duration-500",
              mode === "physics" ? "bg-gradient-to-br from-white/20 to-transparent opacity-100" : "group-hover:bg-gradient-to-br group-hover:from-white/10 group-hover:to-transparent group-hover:opacity-100"
            )}></div>
            <span className={clsx(
              "text-2xl mb-0.5 relative z-10 transition-transform duration-300",
              mode === "physics" ? "animate-float" : "group-hover:scale-110"
            )}>⚛️</span>
            <span className="relative z-10 text-xs font-semibold tracking-wide">Physics</span>
          </button>
        </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-gray-200 transition-colors">
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
              className="w-4 h-4 text-white border-gray-600 rounded focus:ring-white bg-black"
            />
            <span>Use textbook retrieval (RAG)</span>
          </label>

          <button
            onClick={onReindex}
            className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-black hover:bg-gray-900 text-white transition-all hover:shadow-md hover:border-gray-600 font-medium text-sm"
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
            <p className="text-xs text-white mt-2 flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {uploadMsg}
            </p>
          ) : uploadMsg ? (
            <p className={`text-xs mt-2 ${uploadMsg.includes("failed") ? "text-gray-400" : "text-white"}`}>{uploadMsg}</p>
          ) : null}
        </div>

        <Link
          to="/summaries"
          className="px-3 py-2 rounded-lg border border-gray-700 text-center bg-black hover:bg-gray-900 transition-all hover:shadow-md hover:border-gray-600 font-medium text-sm text-white flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Summarized Content
        </Link>

        <Link
          to="/research"
          className="px-3 py-2 rounded-lg border border-gray-700 text-center bg-black hover:bg-gray-900 transition-all hover:shadow-md hover:border-gray-600 font-medium text-sm text-white flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Research Papers
        </Link>

        <Link
          to="/research-graph"
          className="px-3 py-2 rounded-lg border border-gray-700 text-center bg-black hover:bg-gray-900 transition-all hover:shadow-md hover:border-gray-600 font-medium text-sm text-white flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Research Graph
        </Link>
      </div>
    </aside>
  );
}
