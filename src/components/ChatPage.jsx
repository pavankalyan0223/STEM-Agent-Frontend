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

// Helper function to filter out system messages and prompts
function filterSystemMessages(messages) {
  return messages.filter(msg => {
    // Filter out system role messages
    if (msg.role === "system") return false;
    
    // Filter out messages that look like system prompts
    if (msg.content && typeof msg.content === 'string') {
      const content = msg.content.toLowerCase().trim();
      const systemPromptPatterns = [
        "you are a friendly",
        "you are a math tutor",
        "you are a physics tutor",
        "keep answers accurate",
        "conversational when appropriate",
        "highly knowledgeable",
        "solve numerical or conceptual problems",
        "explain theories"
      ];
      
      // Check if the message matches any system prompt pattern
      if (systemPromptPatterns.some(pattern => content.includes(pattern))) {
        return false;
      }
    }
    
    return true;
  });
}

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [mode, setMode] = useState("math");
  const [useRag, setUseRag] = useState(true);
  
  // Load original user inputs from localStorage
  const getOriginalInputs = () => {
    try {
      const stored = localStorage.getItem(`originalInputs_${currentId}`);
      return stored ? new Map(JSON.parse(stored)) : new Map();
    } catch {
      return new Map();
    }
  };
  
  // Save original user inputs to localStorage
  const saveOriginalInputs = (map) => {
    try {
      if (currentId) {
        localStorage.setItem(`originalInputs_${currentId}`, JSON.stringify(Array.from(map.entries())));
      }
    } catch (e) {
      console.error("Failed to save original inputs:", e);
    }
  };

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
        const filteredMessages = filterSystemMessages(msgs);
        
        // Load original inputs mapping from localStorage
        const originalInputs = getOriginalInputs();
        
        // Replace user messages with original inputs if we have them stored
        const processedMessages = filteredMessages.map(msg => {
          if (msg.role === "user" && originalInputs.has(msg.content)) {
            return { ...msg, content: originalInputs.get(msg.content) };
          }
          return msg;
        });
        
        setCurrentMessages(processedMessages);
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
    const originalUserText = text.trim(); // Store the original user input
    
    const newUserMsg = { role: "user", content: originalUserText };
    setCurrentMessages((msgs) => [...msgs, newUserMsg]);

    setIsLoading(true);
    try {
      const { tutor_reply } = await askBackend({
        mode: mode,
        question: originalUserText,
        session_id: currentId,
        use_rag: useRag,
      });

      // Reload messages from backend to ensure we have the correct state
      // This ensures we get the actual messages stored by the backend
      try {
        const msgs = await fetchSessionMessages(currentId);
        const filteredMessages = filterSystemMessages(msgs);
        
        // Process messages to use original user inputs
        const processedMessages = filteredMessages.map((msg, index) => {
          if (msg.role === "user") {
            // Try to find the most recent user message that matches
            // If backend paraphrased, we'll use the original we sent
            const recentUserMessages = filteredMessages
              .slice(0, index + 1)
              .filter(m => m.role === "user")
              .reverse();
            
            // Use the original text we sent if this looks like it might be paraphrased
            // For now, we'll trust the backend, but store a mapping
            return msg;
          }
          return msg;
        });
        
        // Store mapping of backend user messages to original inputs
        // This helps us preserve original text on refresh
        const userMessages = processedMessages.filter(m => m.role === "user");
        if (userMessages.length > 0) {
          const lastUserMsg = userMessages[userMessages.length - 1];
          const originalInputs = getOriginalInputs();
          
          // Store mapping: backend content -> original content
          if (lastUserMsg.content !== originalUserText) {
            originalInputs.set(lastUserMsg.content, originalUserText);
            saveOriginalInputs(originalInputs);
          }
          
          // Replace the last user message with original if different
          if (lastUserMsg.content !== originalUserText) {
            const lastIndex = processedMessages.findIndex(m => 
              m.role === "user" && m.content === lastUserMsg.content
            );
            if (lastIndex !== -1) {
              processedMessages[lastIndex] = { ...lastUserMsg, content: originalUserText };
            }
          }
        }
        
        setCurrentMessages(processedMessages);
      } catch (reloadError) {
        // If reload fails, just add the assistant message
        const newAssistantMsg = { role: "assistant", content: tutor_reply };
        setCurrentMessages((msgs) => [...msgs, newAssistantMsg]);
      }
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
    <div className="h-screen w-full overflow-hidden grid grid-cols-[22%_78%] bg-black">
      {/* LEFT: Sidebar */}
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onNewSession={onNewSession}
        onSelect={onSelect}
        onReindex={onReindex}
        onDeleteSession={onDeleteSession}
        mode={mode}
        setMode={setMode}
        useRag={useRag}
        setUseRag={setUseRag}
      />

      {/* RIGHT: Chat area */}
      <main className="flex flex-col h-full min-h-0 relative">
        <Chat
          messages={currentMessages}
          mode={mode}
          isLoading={isLoading}
        />
        <div className="flex-shrink-0 p-6 border-t border-gray-700 bg-black backdrop-blur-md">
          <div className="max-w-4xl mx-auto">
            <ChatInput onSend={sendMessage} disabled={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
