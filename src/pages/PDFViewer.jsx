import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PDFViewerWithHighlights from "../components/PDFViewerWithHighlights.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// Generate distinct colors for papers (same as ResearchGraph)
const getPaperColor = (paperId) => {
  const paperColors = [
    "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
    "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#a855f7",
    "#eab308", "#22c55e", "#f43f5e", "#0ea5e9"
  ];
  const index = parseInt(paperId.replace(/\D/g, "")) || 0;
  return paperColors[index % paperColors.length];
};

// Get topic color based on category
const getTopicColor = (category) => {
  const colors = {
    method: "#60a5fa", theory: "#f472b6", application: "#34d399",
    dataset: "#fbbf24", metric: "#a78bfa", concept: "#fb923c"
  };
  return colors[category] || "#ffffff";
};

export default function PDFViewer() {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [topicsMap, setTopicsMap] = useState({}); // Map topic names to their colors
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    // Load graph data from sessionStorage
    const stored = sessionStorage.getItem("researchGraphData");
    if (stored) {
      const data = JSON.parse(stored);
      setGraphData(data);
      
      // Extract PDFs from graph data nodes
      const pdfList = (data.nodes || [])
        .filter(node => node.type === "paper")
        .map(node => ({
          id: node.id,
          filename: node.filename || node.id,
          title: node.title || node.label || node.filename || node.id
        }));
      setPdfs(pdfList);
      
      // Build topics map with colors
      const topics = {};
      (data.nodes || [])
        .filter(node => node.type === "topic")
        .forEach(topic => {
          const topicName = topic.name || topic.label;
          if (topic.papers && topic.papers.length > 0) {
            const firstPaperId = topic.papers[0];
            topics[topicName] = getPaperColor(firstPaperId);
          } else {
            topics[topicName] = getTopicColor(topic.category);
          }
        });
      setTopicsMap(topics);
    } else {
      // If no graph data, redirect back
      navigate("/research-graph");
    }
  }, [navigate]);

  const handlePdfSelect = (pdf) => {
    if (selectedPdfs.find(p => p.id === pdf.id)) {
      // Deselect
      setSelectedPdfs(prev => prev.filter(p => p.id !== pdf.id));
    } else {
      // Select (max 2)
      if (selectedPdfs.length >= 2) {
        // Remove first and add new one
        setSelectedPdfs(prev => [prev[1], pdf]);
      } else {
        setSelectedPdfs(prev => [...prev, pdf]);
      }
    }
  };

  // Get PDF URL for iframe
  const getPdfUrl = (filename) => {
    return `${API_BASE}/research-graph/pdf/${encodeURIComponent(filename)}`;
  };
  
  // Get topics for a PDF (for future highlighting feature)
  const getPdfTopics = (pdfId) => {
    if (!graphData) return [];
    return (graphData.nodes || [])
      .filter(node => 
        node.type === "topic" && 
        node.papers && 
        node.papers.includes(pdfId)
      ) || [];
  };

  return (
    <div className={`h-screen w-full overflow-hidden bg-black transition-all duration-300 ${sidebarVisible ? 'grid grid-cols-[22%_78%]' : 'grid grid-cols-[0%_100%]'}`}>
      {/* Left Sidebar */}
      <aside className={`h-full w-full border-r border-gray-700/50 bg-black backdrop-blur-sm p-6 flex flex-col gap-6 overflow-hidden shadow-2xl transition-all duration-300 ${sidebarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none overflow-hidden'}`}>
        <div className="flex items-center justify-between mb-2 animate-slide-up">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">PDFs</h2>
            <p className="text-xs text-gray-500 mt-1">Select up to 2 for comparison</p>
          </div>
          <button
            onClick={() => navigate("/research-graph")}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-white text-sm font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
          >
            ← Back
          </button>
        </div>

        {/* PDF List */}
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent pr-1">
          {pdfs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No PDFs available</p>
            </div>
          ) : (
            pdfs.map((pdf) => {
              const isSelected = selectedPdfs.find(p => p.id === pdf.id);
              return (
                <div
                  key={pdf.id}
                  onClick={() => handlePdfSelect(pdf)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer animate-slide-up ${
                    isSelected
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transform scale-[1.02] border-2 border-white"
                      : "bg-gray-900 hover:bg-gray-800 text-white hover:shadow-lg border border-gray-700 hover:border-gray-600 hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📄</span>
                      <span className="font-semibold truncate text-sm">{pdf.title}</span>
                    </div>
                    <div className={`text-xs truncate ${isSelected ? 'text-black/70' : 'text-gray-400'}`}>
                      {pdf.filename}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="ml-2 w-3 h-3 rounded-full" style={{ backgroundColor: getPaperColor(pdf.id) }}></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-col h-full min-h-0 relative bg-black">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarVisible(!sidebarVisible)}
          className={`absolute top-4 z-50 px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-white rounded-lg transition-all duration-300 hover:shadow-lg ${sidebarVisible ? 'left-4' : 'left-4'}`}
          title={sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
        >
          {sidebarVisible ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {selectedPdfs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-2xl font-bold mb-2">Select PDFs to View</h3>
              <p className="text-gray-400">Choose up to 2 PDFs from the sidebar to compare</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {selectedPdfs.map((pdf, index) => (
              <div
                key={pdf.id}
                className={`flex-1 flex flex-col overflow-hidden ${selectedPdfs.length === 2 && index === 0 ? 'border-r border-gray-700' : ''}`}
              >
                {/* PDF Header */}
                <div className="flex-shrink-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{pdf.title}</h3>
                    <p className="text-sm text-gray-400">{pdf.filename}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getPaperColor(pdf.id) }}></div>
                    <button
                      onClick={() => handlePdfSelect(pdf)}
                      className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* PDF Content */}
                <div className="flex-1 overflow-hidden bg-gray-900">
                  <PDFViewerWithHighlights
                    pdfUrl={getPdfUrl(pdf.filename)}
                    topics={getPdfTopics(pdf.id)}
                    topicsMap={topicsMap}
                    paperColor={getPaperColor(pdf.id)}
                    initialScale={selectedPdfs.length === 2 ? 1.0 : 1.5}
                  />
                </div>
                
                {/* Topics Info */}
                {getPdfTopics(pdf.id).length > 0 && (
                  <div className="flex-shrink-0 bg-gray-800 border-t border-gray-700 px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-gray-400 mr-2">Topics:</span>
                      {getPdfTopics(pdf.id).slice(0, 10).map((topic, idx) => {
                        const topicName = topic.name || topic.label;
                        const color = topicsMap[topicName] || getPaperColor(pdf.id);
                        return (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ backgroundColor: color, color: "white" }}
                          >
                            {topicName}
                          </span>
                        );
                      })}
                      {getPdfTopics(pdf.id).length > 10 && (
                        <span className="text-xs text-gray-400">+{getPdfTopics(pdf.id).length - 10} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

