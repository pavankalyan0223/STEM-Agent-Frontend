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
    <aside className="h-full w-full border-r border-gray-800 bg-black p-3 flex flex-col gap-3 overflow-hidden text-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sessions</h2>
        <button
          className="px-2 py-1 rounded-xl border border-gray-700 hover:bg-neutral-900"
          onClick={() => onNewSession(uuidv4())}
          title="New chat"
        >
          + New
        </button>
      </div>

      {/* Session List */}
      <div className="flex flex-col gap-1">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={clsx(
              "flex items-center justify-between px-3 py-2 rounded-xl border border-gray-700 hover:bg-neutral-900",
              currentId === s.id && "border-blue-500 bg-neutral-900"
            )}
          >
            <button
              onClick={() => onSelect(s.id)}
              className="flex-1 text-left overflow-hidden"
              title="Open session"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{s.mode === "math" ? "📐" : "⚛️"}</span>
                <span className="font-medium truncate">{s.title || "Untitled"}</span>
              </div>
              <div className="text-xs text-gray-400 truncate">
                {s.preview || "Start chatting…"}
              </div>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onDeleteSession(s.id)}
              className="ml-2 text-gray-500 hover:text-red-500 transition"
              title="Delete session"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Mode Controls */}
      <div className="mt-2 grid gap-2">
        <label className="text-sm font-medium">Mode</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("math")}
            className={clsx(
              "px-3 py-2 rounded-xl border border-gray-700 hover:bg-neutral-900",
              mode === "math" && "border-blue-500 bg-neutral-900"
            )}
          >
            📐 Math+General
          </button>
          <button
            onClick={() => setMode("physics")}
            className={clsx(
              "px-3 py-2 rounded-xl border border-gray-700 hover:bg-neutral-900",
              mode === "physics" && "border-purple-500 bg-neutral-900"
            )}
          >
            ⚛️ Physics+General
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm mt-2">
          <input
            type="checkbox"
            checked={useRag}
            onChange={(e) => setUseRag(e.target.checked)}
          />
          Use textbook retrieval (RAG)
        </label>

        <button
          onClick={onReindex}
          className="mt-2 px-3 py-2 rounded-xl border border-gray-700 hover:bg-neutral-900"
          title="Reindex PDFs"
        >
          ♻️ Reindex PDFs
        </button>


{/* --- Upload PDFs --- */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">Knowledge Base</h3>
        <button
          onClick={() => fileInputRef.current.click()}
          className="w-full px-3 py-2 rounded-xl border border-gray-700 hover:bg-neutral-900 disabled:opacity-50"
          disabled={uploading}
        >
          📤 Upload PDFs
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
          <p className="text-xs text-gray-400 mt-1 animate-pulse">
            {uploadMsg}
          </p>
        ) : uploadMsg ? (
          <p className="text-xs text-gray-400 mt-1">{uploadMsg}</p>
        ) : null}
      </div>

        <Link
        to="/summaries"
        className="mt-3 px-3 py-2 rounded-xl border border-gray-700 text-center hover:bg-neutral-900"
        >
        🧾 Summarized Content
        </Link>
      </div>

      <div className="mt-auto text-[11px] text-gray-500">
        20% / 80% layout • Dark mode
      </div>
    </aside>
  );
}
