import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function askBackend({ mode, question, session_id, use_rag }) {
  const { data } = await axios.post(`${API_BASE}/ask`, {
    mode,
    question,
    session_id,
    use_rag,
  });
  return data;
}

export async function askBackendStream({ mode, question, session_id, use_rag, onChunk, onComplete, onError }) {
  try {
    const response = await fetch(`${API_BASE}/ask/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
        question,
        session_id,
        use_rag,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              onError?.(new Error(data.content));
              return;
            }
            if (data.done) {
              onComplete?.();
              return;
            }
            if (data.content) {
              onChunk?.(data.content);
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      }
    }
  } catch (error) {
    onError?.(error);
  }
}

export async function fetchSessions() {
  const { data } = await axios.get(`${API_BASE}/sessions`);
  return data.sessions;
}

export async function fetchSessionMessages(session_id) {
  const { data } = await axios.get(`${API_BASE}/session/${session_id}`);
  return data.messages;
}

export async function deleteSession(session_id) {
  const { data } = await axios.delete(`${API_BASE}/session/${session_id}`);
  return data;
}

export async function reindex() {
  const { data } = await axios.post(`${API_BASE}/reindex`);
  return data;
}

export async function summarizeAll() {
  const { data } = await axios.post(`${API_BASE}/summarize_all`);
  return data;
}

export async function fetchSummaries() {
  const { data } = await axios.get(`${API_BASE}/summaries`);
  return data.summaries;
}

export async function fetchSummary(name) {
  const { data } = await axios.get(`${API_BASE}/summary/${name}`);
  return data.summary;
}

export async function uploadPdfs(files) {
  const formData = new FormData();
  for (const f of files) formData.append("files", f);

  const { data } = await axios.post(`${API_BASE}/upload_pdfs`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchResearchPapers({ query, maxResults = 20, category = null }) {
  const { data } = await axios.post(`${API_BASE}/research`, {
    query,
    max_results: maxResults,
    category,
  });
  return data;
}

export async function listPdfs() {
  const { data } = await axios.get(`${API_BASE}/research-graph/pdfs`);
  return data;
}

export async function buildResearchGraph(pdfFiles = null) {
  const { data } = await axios.post(`${API_BASE}/research-graph/build`, pdfFiles ? { pdf_files: pdfFiles } : {});
  return data;
}

export async function fetchResearchGraph(graphFilename = null) {
  const url = graphFilename 
    ? `${API_BASE}/research-graph?graph_filename=${encodeURIComponent(graphFilename)}`
    : `${API_BASE}/research-graph`;
  const { data } = await axios.get(url);
  return data;
}

export async function listGraphs() {
  const { data } = await axios.get(`${API_BASE}/research-graph/list`);
  return data;
}

export async function deleteGraph(graphFilename) {
  const { data } = await axios.delete(`${API_BASE}/research-graph/${encodeURIComponent(graphFilename)}`);
  return data;
}

export async function getPdfText(filename) {
  const { data } = await axios.get(`${API_BASE}/research-graph/pdf-text/${encodeURIComponent(filename)}`);
  return data;
}