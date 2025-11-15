import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { listPdfs, buildResearchGraph, listGraphs, uploadPdfs, fetchResearchGraph, deleteGraph } from "../lib/api.js";

// Dynamic import for vis-network to avoid Vite optimization issues
let Network = null;
let visNetworkStylesLoaded = false;

const loadVisNetwork = async () => {
  if (!Network) {
    const visNetwork = await import("vis-network");
    Network = visNetwork.Network;
    if (!visNetworkStylesLoaded) {
      await import("vis-network/styles/vis-network.css");
      visNetworkStylesLoaded = true;
    }
  }
  return Network;
};

export default function GraphSetup({ onGraphReady, onGraphSelect }) {
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [graphs, setGraphs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [selectedGraphPreview, setSelectedGraphPreview] = useState(null);
  const [previewGraphData, setPreviewGraphData] = useState(null);
  const fileInputRef = useRef(null);
  const previewGraphRef = useRef(null);
  const previewNetworkRef = useRef(null);

  useEffect(() => {
    loadPdfs();
    loadGraphs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPdfs = async () => {
    try {
      const data = await listPdfs();
      setPdfs(data.pdfs || []);
    } catch (error) {
      console.error("Error loading PDFs:", error);
    }
  };

  const loadGraphs = async () => {
    try {
      const data = await listGraphs();
      const graphsList = data.graphs || [];
      setGraphs(graphsList);
      
      // Always set the first graph as preview (will be used in background)
      if (graphsList.length > 0) {
        const firstGraph = graphsList[0];
        setSelectedGraphPreview(firstGraph);
        // Load the graph data for preview using filename
        loadPreviewGraph(firstGraph.filename);
      } else {
        setSelectedGraphPreview(null);
        setPreviewGraphData(null);
      }
    } catch (error) {
      console.error("Error loading graphs:", error);
    }
  };

  const loadPreviewGraph = async (graphFilename = null) => {
    try {
      const graphData = await fetchResearchGraph(graphFilename);
      if (!graphData.error && graphData.nodes && graphData.nodes.length > 0) {
        setPreviewGraphData(graphData);
      }
    } catch (error) {
      console.error("Error loading preview graph:", error);
    }
  };

  const handlePdfToggle = (pdf) => {
    setSelectedPdfs((prev) =>
      prev.includes(pdf)
        ? prev.filter((p) => p !== pdf)
        : [...prev, pdf]
    );
  };

  const handleSelectAll = () => {
    if (selectedPdfs.length === pdfs.length) {
      setSelectedPdfs([]);
    } else {
      setSelectedPdfs([...pdfs]);
    }
  };

  const handleBuildGraph = async () => {
    if (selectedPdfs.length === 0) {
      alert("Please select at least one PDF to build the graph.");
      return;
    }

    setBuilding(true);
    try {
      const graph = await buildResearchGraph(selectedPdfs);
      if (graph.error) {
        alert(`Error building graph: ${graph.error}`);
      } else {
        // Reload graphs list
        await loadGraphs();
        // Load the newly built graph
        onGraphReady(graph);
      }
    } catch (error) {
      console.error("Error building graph:", error);
      alert("Failed to build graph. Please try again.");
    } finally {
      setBuilding(false);
    }
  };

  const handleUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    setUploading(true);
    setUploadMessage("Uploading PDFs...");
    try {
      const res = await uploadPdfs(Array.from(files));
      setUploadMessage(res.message || "Upload complete!");
      // Reload PDFs list
      await loadPdfs();
      setTimeout(() => setUploadMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setUploadMessage("Upload failed!");
      setTimeout(() => setUploadMessage(""), 3000);
    } finally {
      setUploading(false);
      event.target.value = ""; // reset input
    }
  };

  const handleLoadGraph = async (graph) => {
    setLoading(true);
    try {
      const graphData = await fetchResearchGraph(graph.filename);
      if (graphData.error) {
        alert(`Error loading graph: ${graphData.error}`);
      } else {
        onGraphSelect(graphData);
      }
    } catch (error) {
      console.error("Error loading graph:", error);
      alert("Failed to load graph. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGraph = async (graph, e) => {
    e.stopPropagation(); // Prevent triggering the graph selection
    
    if (!confirm(`Are you sure you want to delete "${graph.name}"?`)) {
      return;
    }

    try {
      const result = await deleteGraph(graph.filename);
      if (result.error) {
        alert(`Error deleting graph: ${result.error}`);
      } else {
        // Reload graphs list
        await loadGraphs();
        // If deleted graph was selected, clear selection
        if (selectedGraphPreview?.filename === graph.filename) {
          setSelectedGraphPreview(null);
          setPreviewGraphData(null);
        }
      }
    } catch (error) {
      console.error("Error deleting graph:", error);
      alert("Failed to delete graph. Please try again.");
    }
  };

  const handleViewGraph = async () => {
    if (firstGraph) {
      await handleLoadGraph(firstGraph);
    }
  };

  // Generate distinct colors for papers (same as ResearchGraph)
  const getPaperColor = (paperId) => {
    const paperColors = [
      "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
      "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#a855f7",
      "#eab308", "#22c55e", "#f43f5e", "#0ea5e9"
    ];
    const match = paperId.match(/paper_(\d+)/);
    if (match) {
      const index = parseInt(match[1], 10);
      return paperColors[index % paperColors.length];
    }
    let hash = 0;
    for (let i = 0; i < paperId.length; i++) {
      hash = paperId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return paperColors[Math.abs(hash) % paperColors.length];
  };

  const getTopicColor = (category) => {
    const colors = {
      method: "#60a5fa", theory: "#f472b6", application: "#34d399",
      dataset: "#fbbf24", metric: "#a78bfa", concept: "#fb923c"
    };
    return colors[category] || "#ffffff";
  };

  // Render preview graph visualization
  useEffect(() => {
    if (!previewGraphRef.current || !previewGraphData || previewGraphData.nodes.length === 0) return;

    loadVisNetwork().then((NetworkClass) => {
      const nodes = previewGraphData.nodes.map(node => {
        const isPaper = node.type === "paper";
        let nodeColor;
        
        if (isPaper) {
          nodeColor = getPaperColor(node.id);
        } else {
          if (node.papers && node.papers.length > 0) {
            const firstPaperId = node.papers[0];
            nodeColor = getPaperColor(firstPaperId);
          } else {
            nodeColor = getTopicColor(node.category);
          }
        }
        
        return {
          ...node,
          color: nodeColor,
          size: isPaper ? 25 : 15,
          font: { color: "#ffffff", size: 12 }
        };
      });

      const edges = previewGraphData.edges.map(edge => {
        const isContainsTopic = edge.type === "contains_topic";
        const isRelatedPaper = edge.type === "related_paper";
        let edgeColor = "#60a5fa";
        
        if (isContainsTopic) {
          const sourceNode = previewGraphData.nodes.find(n => n.id === edge.source);
          if (sourceNode && sourceNode.type === "paper") {
            edgeColor = getPaperColor(sourceNode.id);
          } else {
            edgeColor = "#ffffff";
          }
        } else if (isRelatedPaper) {
          edgeColor = "#34d399";
        }
        
        return {
          ...edge,
          id: edge.id || `${edge.source}_${edge.target}`,
          from: edge.source,
          to: edge.target,
          width: isContainsTopic ? 2 : Math.max(2, Math.min(5, (edge.weight || 1.0) * 3)),
          color: edgeColor,
          arrows: { to: { enabled: !isRelatedPaper, scaleFactor: 0.6 } }
        };
      });

      const options = {
        nodes: {
          shape: "dot",
          font: { color: "#ffffff", size: 12 },
          borderWidth: 2,
          borderColor: "#ffffff",
          shadow: false,
          size: 20
        },
        edges: {
          width: 2,
          smooth: { type: "continuous", roundness: 0.5 },
          arrows: { to: { enabled: true, scaleFactor: 0.6 } },
          color: {
            color: "#ffffff",
            highlight: "#60a5fa",
            hover: "#60a5fa"
          }
        },
        physics: {
          enabled: true,
          stabilization: { enabled: true, iterations: 100 },
          barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.2,
            springLength: 150,
            springConstant: 0.05,
            damping: 0.1
          }
        },
        interaction: {
          hover: false,
          zoomView: false,
          dragView: false,
          selectConnectedEdges: false,
          tooltipDelay: 0
        },
        configure: {
          enabled: false
        },
        backgroundColor: "#000000"
      };

      // Destroy existing network if it exists
      if (previewNetworkRef.current) {
        previewNetworkRef.current.destroy();
      }

      previewNetworkRef.current = new NetworkClass(previewGraphRef.current, { nodes, edges }, options);
      
      // Force redraw
      setTimeout(() => {
        if (previewNetworkRef.current) {
          previewNetworkRef.current.redraw();
        }
      }, 100);
    }).catch((error) => {
      console.error("Failed to load vis-network:", error);
    });

    return () => {
      if (previewNetworkRef.current) {
        previewNetworkRef.current.destroy();
        previewNetworkRef.current = null;
      }
    };
  }, [previewGraphData]);

  const firstGraph = graphs.length > 0 ? graphs[0] : null;

  return (
    <div className="h-screen w-full bg-black text-white flex overflow-hidden relative">
      {/* Sidebar - Everything goes here */}
      <div className="w-96 border-r border-white bg-black flex flex-col overflow-hidden h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Research Graph Builder</h1>
            <p className="text-xs text-white mt-1">Upload & build graphs</p>
          </div>
          <Link
            to="/"
            className="px-3 py-1.5 rounded-lg border border-white bg-black hover:bg-gray-900 transition-all hover:border-gray-400 font-medium text-xs text-white flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Chat
          </Link>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          {/* Upload Section - Fixed */}
          <div className="flex-shrink-0 bg-black border border-white rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 text-white">1. Upload PDFs</h2>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full px-4 py-2 bg-black hover:bg-gray-900 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-colors border border-white text-white"
              >
                {uploading ? "Uploading..." : "📄 Upload PDFs"}
              </button>
              {uploadMessage && (
                <p className={`text-xs ${uploadMessage.includes("failed") ? "text-red-400" : "text-green-400"}`}>
                  {uploadMessage}
                </p>
              )}
            </div>
          </div>

          {/* PDF Selection Section - Scrollable */}
          <div className="flex-1 flex flex-col min-h-0 bg-black border border-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h2 className="text-lg font-semibold text-white">2. Select PDFs</h2>
              {pdfs.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="px-2 py-1 bg-black hover:bg-gray-900 rounded text-xs border border-white text-white"
                >
                  {selectedPdfs.length === pdfs.length ? "Deselect" : "Select All"}
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0">
              {pdfs.length === 0 ? (
                <p className="text-white text-sm">No PDFs available</p>
              ) : (
                <div className="space-y-2">
                  {pdfs.map((pdf) => (
                    <label
                      key={pdf}
                      className="flex items-center gap-2 p-2 bg-black hover:bg-gray-900 rounded cursor-pointer border border-white hover:border-gray-400 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPdfs.includes(pdf)}
                        onChange={() => handlePdfToggle(pdf)}
                        className="w-4 h-4 text-white rounded focus:ring-white border-white"
                      />
                      <span className="flex-1 text-white text-sm truncate">{pdf}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {selectedPdfs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white flex-shrink-0">
                <button
                  onClick={handleBuildGraph}
                  disabled={building}
                  className="w-full px-4 py-2 bg-black hover:bg-gray-900 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-colors border border-white text-white"
                >
                  {building ? "Building..." : `🔨 Build (${selectedPdfs.length})`}
                </button>
              </div>
            )}
          </div>

          {/* Available Graphs Section - Scrollable */}
          <div className="flex-1 flex flex-col min-h-0 bg-black border border-white rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 text-white flex-shrink-0">3. Available Graphs</h2>
            <div className="flex-1 overflow-y-auto min-h-0">
              {graphs.length === 0 ? (
                <p className="text-white text-sm">No graphs available</p>
              ) : (
                <div className="space-y-2">
                  {graphs.map((graph) => (
                    <div
                      key={graph.filename}
                      onClick={() => {
                        setSelectedGraphPreview(graph);
                        loadPreviewGraph(graph.filename);
                      }}
                      className={`p-3 bg-black border rounded-lg cursor-pointer transition-all relative group ${
                        selectedGraphPreview?.filename === graph.filename
                          ? "border-white bg-gray-900"
                          : "border-white hover:border-gray-400"
                      }`}
                    >
                      <button
                        onClick={(e) => handleDeleteGraph(graph, e)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs"
                        title="Delete graph"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <h3 className="text-sm font-semibold text-white mb-1 pr-6">{graph.name}</h3>
                      <div className="flex gap-2 text-xs text-white">
                        <span>📄 {graph.papers_count}</span>
                        <span>🔖 {graph.topics_count}</span>
                        <span>🔗 {graph.edges_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Area - Background Graph Preview */}
      <div className="flex-1 relative overflow-hidden h-full">
        {firstGraph && previewGraphData ? (
          <>
            {/* Background Graph Visualization - Transparent */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div
                ref={previewGraphRef}
                className="w-full h-full"
                style={{ backgroundColor: "#000000" }}
              />
            </div>

            {/* Center Button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <button
                onClick={handleViewGraph}
                disabled={loading}
                className="px-12 py-6 bg-black hover:bg-gray-900 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-2xl font-bold text-xl shadow-2xl transition-all transform hover:scale-105 disabled:transform-none flex items-center gap-4 border-4 border-white z-10 text-white"
              >
                {loading ? (
                  <>
                    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View Graph</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-6">📊</div>
              <h3 className="text-3xl font-semibold mb-2">No Graphs Available</h3>
              <p className="text-gray-400 text-lg">Build a graph from your PDFs to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

