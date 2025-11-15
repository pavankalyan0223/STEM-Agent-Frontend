import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { buildResearchGraph, fetchResearchGraph } from "../lib/api.js";
import GraphSetup from "../components/GraphSetup.jsx";

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

export default function ResearchGraph() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState("all"); // "all", "papers", "topics"
  const [showSetup, setShowSetup] = useState(true);
  const graphRef = useRef(null);
  const networkRef = useRef(null);

  // Generate distinct colors for papers
  const getPaperColor = (paperId) => {
    // Palette of distinct, vibrant colors that work well on dark backgrounds
    const paperColors = [
      "#ef4444",  // red
      "#3b82f6",  // blue
      "#10b981",  // emerald
      "#f59e0b",  // amber
      "#8b5cf6",  // violet
      "#ec4899",  // pink
      "#06b6d4",  // cyan
      "#84cc16",  // lime
      "#f97316",  // orange
      "#6366f1",  // indigo
      "#14b8a6",  // teal
      "#a855f7",  // purple
      "#eab308",  // yellow
      "#22c55e",  // green
      "#f43f5e",  // rose
      "#0ea5e9",  // sky
    ];
    
    // Extract paper index from paper ID (e.g., "paper_0" -> 0)
    const match = paperId.match(/paper_(\d+)/);
    if (match) {
      const index = parseInt(match[1], 10);
      return paperColors[index % paperColors.length];
    }
    
    // Fallback: hash the ID to get a consistent color
    let hash = 0;
    for (let i = 0; i < paperId.length; i++) {
      hash = paperId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return paperColors[Math.abs(hash) % paperColors.length];
  };

  const getTopicColor = (category) => {
    const colors = {
      method: "#60a5fa",      // blue
      theory: "#f472b6",      // pink
      application: "#34d399", // green
      dataset: "#fbbf24",    // yellow
      metric: "#a78bfa",     // purple
      concept: "#fb923c"     // orange
    };
    return colors[category] || "#ffffff";
  };

  useEffect(() => {
    loadGraph();
  }, []);

  useEffect(() => {
    if (!graphRef.current || !graphData || graphData.nodes.length === 0) return;

    // Load vis-network dynamically
    loadVisNetwork().then((NetworkClass) => {
      // Filter nodes based on filterType
      let filteredNodes = graphData.nodes;
      if (filterType === "papers") {
        filteredNodes = graphData.nodes.filter(n => n.type === "paper");
      } else if (filterType === "topics") {
        filteredNodes = graphData.nodes.filter(n => n.type === "topic");
      }

      // Filter edges to only include edges between visible nodes
      const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredEdges = graphData.edges.filter(
        e => {
          const hasSource = visibleNodeIds.has(e.source);
          const hasTarget = visibleNodeIds.has(e.target);
          return hasSource && hasTarget;
        }
      );
      
      console.log(`Graph data: ${filteredNodes.length} nodes, ${filteredEdges.length} edges`);

      const options = {
        nodes: {
          shape: "dot",
          font: {
            color: "#ffffff",
            size: 16,
            face: "Sans-Serif"
          },
          borderWidth: 2,
          shadow: true,
          size: 20,
          chosen: {
            node: (values) => {
              values.size = 30;
              values.borderWidth = 4;
            }
          }
        },
        edges: {
          width: 2,
          color: {
            color: "#ffffff",
            highlight: "#60a5fa",
            hover: "#60a5fa"
          },
          smooth: {
            type: "continuous",
            roundness: 0.5
          },
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 0.7,
              type: "arrow"
            }
          },
          selectionWidth: 4,
          hoverWidth: 4
        },
        physics: {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 200
          },
          barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.2,
            springLength: 150,
            springConstant: 0.05,
            damping: 0.1
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true,
          selectConnectedEdges: true
        },
        backgroundColor: "#000000"
      };

      const data = {
        nodes: filteredNodes.map(node => {
          const isPaper = node.type === "paper";
          let nodeColor;
          
          if (isPaper) {
            // Papers get their assigned color
            nodeColor = getPaperColor(node.id);
          } else {
            // Topics get the color of their associated paper(s)
            // If topic belongs to multiple papers, use the first paper's color
            if (node.papers && node.papers.length > 0) {
              const firstPaperId = node.papers[0];
              nodeColor = getPaperColor(firstPaperId);
            } else {
              // Fallback to category color if no papers associated
              nodeColor = getTopicColor(node.category);
            }
          }
          
          return {
            ...node,
            color: nodeColor,
            size: isPaper ? 25 : 15,
            title: isPaper 
              ? `${node.label}\n\n${node.abstract || "No abstract available"}`
              : `${node.label}\n\n${node.description || ""}\n\nCategory: ${node.category || "concept"}`
          };
        }),
        edges: filteredEdges.map(edge => {
          const isContainsTopic = edge.type === "contains_topic";
          const isRelatedPaper = edge.type === "related_paper";
          const weight = edge.weight || 1.0;
          
          // Color coding: paper color for paper-topic, green for paper-paper, blue for topic-topic
          let edgeColor = "#60a5fa"; // default: topic-topic similarity
          
          if (isContainsTopic) {
            // Paper -> Topic edge: use the paper's color
            const sourceNode = filteredNodes.find(n => n.id === edge.source);
            if (sourceNode && sourceNode.type === "paper") {
              edgeColor = getPaperColor(sourceNode.id);
            } else {
              edgeColor = "#ffffff"; // fallback to white
            }
          } else if (isRelatedPaper) {
            edgeColor = "#34d399"; // paper -> paper (green)
          }
          
          return {
            ...edge,
            id: edge.id || `${edge.source}_${edge.target}`,
            from: edge.source,
            to: edge.target,
            width: isContainsTopic ? 2 : Math.max(2, Math.min(5, weight * 3)),
            color: edgeColor,
            label: isContainsTopic ? "" : (isRelatedPaper && edge.shared_topics_count ? `${edge.shared_topics_count} topics` : weight.toFixed(2)),
            font: {
              color: "#ffffff",
              size: 11,
              align: "middle",
              strokeWidth: 2,
              strokeColor: "#000000"
            },
            smooth: {
              type: "continuous",
              roundness: 0.5
            },
            arrows: {
              to: {
                enabled: !isRelatedPaper, // No arrows for paper-paper relationships (bidirectional)
                scaleFactor: 0.6
              }
            }
          };
        })
      };

      // Destroy existing network if it exists
      if (networkRef.current) {
        networkRef.current.destroy();
      }

      console.log("Network data:", {
        nodes: data.nodes.length,
        edges: data.edges.length,
        sampleEdge: data.edges[0]
      });
      
      networkRef.current = new NetworkClass(graphRef.current, data, options);
      
      // Force redraw after a short delay to ensure edges render
      setTimeout(() => {
        if (networkRef.current) {
          networkRef.current.redraw();
        }
      }, 100);

      networkRef.current.on("click", (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = graphData.nodes.find(n => n.id === nodeId);
          if (node) {
            setSelectedNode(node);
          }
        } else {
          setSelectedNode(null);
        }
      });

      networkRef.current.on("hoverNode", (params) => {
        graphRef.current.style.cursor = "pointer";
      });

      networkRef.current.on("blurNode", () => {
        graphRef.current.style.cursor = "default";
      });

      networkRef.current.on("hoverEdge", (params) => {
        graphRef.current.style.cursor = "pointer";
      });

      networkRef.current.on("blurEdge", () => {
        graphRef.current.style.cursor = "default";
      });
    }).catch((error) => {
      console.error("Failed to load vis-network:", error);
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [graphData, filterType]);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await fetchResearchGraph();
      if (data.error && (!data.nodes || data.nodes.length === 0)) {
        console.error("Error loading graph:", data.error);
        setGraphData(null);
        setShowSetup(true);
      } else {
        // Set graph data even if there's an error message but nodes exist
        setGraphData(data);
        setShowSetup(false);
      }
    } catch (error) {
      console.error("Failed to load graph:", error);
      setGraphData(null);
      setShowSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGraphReady = (graph) => {
    setGraphData(graph);
    setShowSetup(false);
  };

  const handleGraphSelect = (graph) => {
    setGraphData(graph);
    setShowSetup(false);
  };

  const handleBuildGraph = async () => {
    setBuilding(true);
    try {
      const result = await buildResearchGraph();
      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        setGraphData(result);
        alert(`Successfully built graph!\nPapers: ${result.metadata?.papers_count || 0}\nTopics: ${result.metadata?.topics_count || 0}\nEdges: ${result.metadata?.edges_count || 0}`);
      }
    } catch (error) {
      console.error("Failed to build graph:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setBuilding(false);
    }
  };

  // Show setup page if no graph data or if explicitly requested
  if (showSetup || (!graphData && !loading)) {
    return (
      <div className="h-screen w-full">
        <GraphSetup onGraphReady={handleGraphReady} onGraphSelect={handleGraphSelect} />
      </div>
    );
  }

  const papers = graphData?.nodes?.filter(n => n.type === "paper") || [];
  const topics = graphData?.nodes?.filter(n => n.type === "topic") || [];
  
  // Store papers array for easy access
  const papersArray = papers;

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="bg-black backdrop-blur-md border-b border-gray-700/50 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSetup(true)}
            className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-white text-sm font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
          >
            ← Back to Setup
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Research Graph</h1>
            <p className="text-sm text-gray-400 mt-1">
              Papers: {papers.length} • Topics: {topics.length} • Connections: {graphData?.edges?.length || 0}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {graphData && papersArray && papersArray.length > 0 && (
            <button
              onClick={() => {
                // Store graph data in sessionStorage to pass to PDF viewer
                sessionStorage.setItem("researchGraphData", JSON.stringify(graphData));
                navigate("/research-graph/pdfs");
              }}
              className="px-6 py-2.5 rounded-xl bg-white text-black hover:bg-gray-100 transition-all duration-300 font-medium flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              <span className="relative flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>View PDFs ({papersArray.length})</span>
              </span>
            </button>
          )}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-300 hover:border-gray-600 backdrop-blur-sm shadow-lg"
            style={{ backgroundColor: "#111827", color: "#ffffff" }}
          >
            <option value="all" style={{ backgroundColor: "#111827", color: "#ffffff" }}>All Nodes</option>
            <option value="papers" style={{ backgroundColor: "#111827", color: "#ffffff" }}>Papers Only</option>
            <option value="topics" style={{ backgroundColor: "#111827", color: "#ffffff" }}>Topics Only</option>
          </select>
          <button
            onClick={handleBuildGraph}
            disabled={building}
            className="px-6 py-2.5 rounded-xl bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            <span className="relative flex items-center gap-2">
              {building ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Building...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Rebuild Graph</span>
                </>
              )}
            </span>
          </button>
          <button
            onClick={loadGraph}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-white disabled:opacity-50 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph Visualization */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center animate-scale-in">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full animate-glow-pulse"></div>
                  <div className="relative w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
                <div className="flex items-center gap-4 text-white bg-gray-900 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-xl border border-gray-700 animate-slide-up">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-medium tracking-wide">Loading graph</span>
                  <div className="flex gap-1 ml-2">
                    <span className="animate-bounce text-xl" style={{ animationDelay: "0ms" }}>.</span>
                    <span className="animate-bounce text-xl" style={{ animationDelay: "150ms" }}>.</span>
                    <span className="animate-bounce text-xl" style={{ animationDelay: "300ms" }}>.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={graphRef}
                className="w-full h-full"
                style={{ backgroundColor: "#000000" }}
              />
              
              {/* Node Info Panel */}
              {selectedNode && (
                <div className="absolute top-4 right-4 w-96 bg-gray-900 backdrop-blur-sm border border-gray-700 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto z-10 animate-slide-up">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className={`inline-block px-3 py-1.5 rounded-xl text-xs font-semibold mb-3 ${
                        selectedNode.type === "paper" 
                          ? "bg-white text-black" 
                          : "bg-gray-800 border border-gray-600 text-white"
                      }`}>
                        {selectedNode.type === "paper" ? "📄 Paper" : "🔖 Topic"}
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{selectedNode.label}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-gray-400 hover:text-white ml-2 transition-colors duration-300 p-1 hover:bg-gray-800 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    {selectedNode.type === "paper" ? (
                      <>
                        {selectedNode.abstract && (
                          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                            <span className="text-gray-300 font-semibold text-xs uppercase tracking-wider">Abstract</span>
                            <p className="mt-2 text-gray-200 leading-relaxed">{selectedNode.abstract}</p>
                          </div>
                        )}
                        {selectedNode.keywords && selectedNode.keywords.length > 0 && (
                          <div>
                            <span className="text-gray-300 font-semibold text-xs uppercase tracking-wider">Keywords</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedNode.keywords.map((kw, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-xs hover:bg-gray-700 transition-colors duration-300"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedNode.topics_count !== undefined && (
                          <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                            <span className="text-gray-400 text-xs uppercase tracking-wider">Topics Found</span>
                            <span className="ml-2 text-white font-bold text-lg">{selectedNode.topics_count}</span>
                          </div>
                        )}
                        {selectedNode.filename && (
                          <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                            <span className="text-gray-400 text-xs uppercase tracking-wider">File</span>
                            <span className="ml-2 text-gray-200 font-mono text-xs">{selectedNode.filename}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {selectedNode.description && (
                          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                            <span className="text-gray-300 font-semibold text-xs uppercase tracking-wider">Description</span>
                            <p className="mt-2 text-gray-200 leading-relaxed">{selectedNode.description}</p>
                          </div>
                        )}
                        {selectedNode.category && (
                          <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                            <span className="text-gray-400 text-xs uppercase tracking-wider">Category</span>
                            <span className="ml-2 text-white capitalize font-medium">{selectedNode.category}</span>
                          </div>
                        )}
                        {selectedNode.papers && selectedNode.papers.length > 0 && (
                          <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                            <span className="text-gray-400 text-xs uppercase tracking-wider">Appears in</span>
                            <span className="ml-2 text-white font-semibold">{selectedNode.papers.length} paper(s)</span>
                          </div>
                        )}
                        {selectedNode.contexts && selectedNode.contexts.length > 0 && (
                          <div className="mt-4">
                            <span className="text-gray-300 font-semibold text-xs uppercase tracking-wider">Context Lines</span>
                            <div className="mt-3 space-y-3">
                              {selectedNode.contexts.map((context, idx) => (
                                <div key={idx} className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 hover:border-gray-600 transition-colors duration-300">
                                  <div className="mb-3">
                                    <span className="text-white font-semibold text-sm">
                                      📄 {context.paper_title || context.paper_filename || `Paper ${idx + 1}`}
                                    </span>
                                    {context.paper_filename && (
                                      <span className="ml-2 text-gray-400 text-xs font-mono">
                                        ({context.paper_filename})
                                      </span>
                                    )}
                                  </div>
                                  {context.context_lines && context.context_lines.length > 0 ? (
                                    <div className="space-y-2">
                                      {context.context_lines.map((line, lineIdx) => (
                                        <p key={lineIdx} className="text-gray-200 text-sm leading-relaxed italic pl-2 border-l-2 border-gray-700">
                                          "{line}"
                                        </p>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 text-sm italic">No context lines available</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Related Topics Section - Show for both papers and topics */}
                    {(() => {
                      if (!graphData) return null;
                      
                      let relatedTopics = [];
                      
                      if (selectedNode.type === "topic") {
                        // For topics: find topics connected via similar_topic edges
                        relatedTopics = graphData.edges
                          .filter(edge => 
                            edge.type === "similar_topic" && 
                            (edge.source === selectedNode.id || edge.target === selectedNode.id)
                          )
                          .map(edge => {
                            const relatedTopicId = edge.source === selectedNode.id ? edge.target : edge.source;
                            const relatedTopic = graphData.nodes.find(n => n.id === relatedTopicId && n.type === "topic");
                            return relatedTopic ? { ...relatedTopic, similarity: edge.weight } : null;
                          })
                          .filter(topic => topic !== null);
                      } else if (selectedNode.type === "paper") {
                        // For papers: find all topics connected to this paper
                        relatedTopics = graphData.edges
                          .filter(edge => 
                            edge.type === "contains_topic" && 
                            edge.source === selectedNode.id
                          )
                          .map(edge => {
                            const topic = graphData.nodes.find(n => n.id === edge.target && n.type === "topic");
                            return topic ? { ...topic } : null;
                          })
                          .filter(topic => topic !== null);
                      }
                      
                      return relatedTopics.length > 0 ? (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <span className="text-gray-300 font-semibold text-xs uppercase tracking-wider">
                            {selectedNode.type === "paper" ? "Related Topics" : "Similar Topics"}
                          </span>
                          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                            {relatedTopics.map((topic, idx) => (
                              <div 
                                key={idx} 
                                className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 hover:border-gray-600 hover:bg-gray-800 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                                onClick={() => {
                                  // Click on related topic to select it
                                  if (networkRef.current) {
                                    const nodeId = topic.id;
                                    networkRef.current.selectNodes([nodeId]);
                                    const clickedNode = graphData.nodes.find(n => n.id === nodeId);
                                    if (clickedNode) {
                                      setSelectedNode(clickedNode);
                                    }
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-white text-sm font-medium">{topic.label || topic.name}</span>
                                  {topic.similarity !== undefined && (
                                    <span className="text-gray-400 text-xs bg-gray-900 px-2 py-1 rounded-lg">
                                      {(topic.similarity * 100).toFixed(0)}% similar
                                    </span>
                                  )}
                                </div>
                                {topic.papers && topic.papers.length > 0 && (
                                  <div className="mt-2 text-xs text-gray-400">
                                    In {topic.papers.length} paper(s)
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-gray-900 backdrop-blur-sm border border-gray-700 rounded-3xl p-5 shadow-2xl z-10 animate-slide-up">
                <h4 className="text-sm font-semibold text-white mb-4 tracking-tight">Legend</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: "#ef4444" }}></div>
                    <span className="text-gray-300">Papers (different colors)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: "#60a5fa" }}></div>
                    <span className="text-gray-300">Method</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: "#f472b6" }}></div>
                    <span className="text-gray-300">Theory</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: "#34d399" }}></div>
                    <span className="text-gray-300">Application</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: "#fbbf24" }}></div>
                    <span className="text-gray-300">Dataset</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: "#fb923c" }}></div>
                    <span className="text-gray-300">Concept</span>
                  </div>
                  <div className="border-t border-gray-700 my-3"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-1 bg-gray-400 rounded"></div>
                    <span className="text-gray-300">Paper → Topic</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-1 rounded" style={{ backgroundColor: "#34d399" }}></div>
                    <span className="text-gray-300">Paper ↔ Paper</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-1 rounded" style={{ backgroundColor: "#60a5fa" }}></div>
                    <span className="text-gray-300">Topic → Topic</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Click nodes to view details</div>
                    <div>Drag to pan • Scroll to zoom</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

