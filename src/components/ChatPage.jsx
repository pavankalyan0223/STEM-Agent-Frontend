import { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Chat from "./Chat.jsx";
import ChatInput from "./ChatInput.jsx";
import {
  askBackend,
  fetchSessions,
  fetchSessionMessages,
  deleteSession,
  reindex,
} from "../lib/api.js";

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessages, setCurrentMessages] = useState([]);

  // Load sessions from backend
  useEffect(() => {
    (async () => {
      try {
        const ids = await fetchSessions();
        if (ids.length === 0) {
          setSessions([{ id: "default", title: "New Session" }]);
          setCurrentId("default");
        } else {
          const sessionObjects = ids.map((id) => ({ id, title: id }));
          setSessions(sessionObjects);
          setCurrentId(sessionObjects[0].id);
        }
      } catch (e) {
        console.error("Failed to load sessions:", e);
      }
    })();
  }, []);

  // Load messages whenever current session changes
  useEffect(() => {
    if (!currentId) return;
    (async () => {
      try {
        const msgs = await fetchSessionMessages(currentId);
        setCurrentMessages(msgs);
      } catch (e) {
        console.error("Failed to load messages:", e);
        setCurrentMessages([]);
      }
    })();
  }, [currentId]);

  const onReindex = async () => {
    try {
      await reindex();
      alert("Reindex complete!");
    } catch (e) {
      alert("Reindex failed: " + e.message);
    }
  };

  const onNewSession = async (id) => {
    // create a new frontend entry only (backend auto-creates on first /ask)
    const fresh = { id, title: "New Session" };
    setSessions((all) => [fresh, ...all]);
    setCurrentId(id);
    setCurrentMessages([
      {
        role: "assistant",
        content: "Hi! I’m your tutor. Ask me problems or just chat.",
      },
    ]);
  };

  const onSelect = (id) => setCurrentId(id);

  const onDeleteSession = async (id) => {
    try {
      await deleteSession(id);
      const updated = sessions.filter((s) => s.id !== id);
      setSessions(updated);
      if (updated.length > 0) {
        setCurrentId(updated[0].id);
      } else {
        setCurrentId(null);
        setCurrentMessages([]);
      }
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  async function sendMessage(text) {
    if (!currentId) return;
    const newUserMsg = { role: "user", content: text };
    setCurrentMessages((msgs) => [...msgs, newUserMsg]);

    setIsLoading(true);
    try {
      const { tutor_reply } = await askBackend({
        mode: "math",
        question: text,
        session_id: currentId,
        use_rag: true,
      });

      const newAssistantMsg = { role: "assistant", content: tutor_reply };
      setCurrentMessages((msgs) => [...msgs, newAssistantMsg]);
    } catch (e) {
      setCurrentMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: `⚠️ ${e.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen w-full overflow-hidden grid grid-cols-[20%_80%] bg-black text-white">
      {/* LEFT: Sidebar */}
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onNewSession={onNewSession}
        onSelect={onSelect}
        onReindex={onReindex}
        onDeleteSession={onDeleteSession}
        mode="math"
        setMode={() => {}}
        useRag={true}
        setUseRag={() => {}}
      />

      {/* RIGHT: Chat area */}
      <main className="flex flex-col min-h-0">
        <Chat
          messages={currentMessages}
          mode="math"
          isLoading={isLoading}
        />
        <div className="p-4 border-t border-gray-800 bg-black">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={sendMessage} disabled={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
