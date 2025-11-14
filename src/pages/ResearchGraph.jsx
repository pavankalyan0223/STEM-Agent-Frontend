import { useState, useEffect, useRef } from "react";
import { buildResearchGraph, fetchResearchGraph } from "../lib/api.js";

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
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState("all"); // "all", "papers", "topics"
  const graphRef = useRef(null);
  const networkRef = useRef(null);

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
        }
      };

      const data = {
        nodes: filteredNodes.map(node => {
          const isPaper = node.type === "paper";
          return {
            ...node,
            color: isPaper ? "#ffffff" : getTopicColor(node.category),
            size: isPaper ? 25 : 15,
            title: isPaper 
              ? `${node.label}\n\n${node.abstract || "No abstract available"}`
              : `${node.label}\n\n${node.description || ""}\n\nCategory: ${node.category || "concept"}`
          };
        }),
        edges: filteredEdges.map(edge => {
          const isContainsTopic = edge.type === "contains_topic";
          const weight = edge.weight || 1.0;
          
          // Simple color string for vis-network
          const edgeColor = isContainsTopic ? "#ffffff" : "#60a5fa";
          
          return {
            ...edge,
            id: edge.id || `${edge.source}_${edge.target}`,
            from: edge.source,
            to: edge.target,
            width: isContainsTopic ? 2 : Math.max(2, Math.min(5, weight * 3)),
            color: edgeColor, // Simple color string
            label: isContainsTopic ? "" : weight.toFixed(2),
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
                enabled: true,
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

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await fetchResearchGraph();
      if (data.error && (!data.nodes || data.nodes.length === 0)) {
        console.error("Error loading graph:", data.error);
        setGraphData(null);
      } else {
        // Set graph data even if there's an error message but nodes exist
        setGraphData(data);
      }
    } catch (error) {
      console.error("Failed to load graph:", error);
      setGraphData(null);
    } finally {
      setLoading(false);
    }
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

  if (!graphData && !loading) {
    return (
      <div className="h-screen flex flex-col bg-black text-white">
        <div className="bg-gray-900 border-b border-gray-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Research Graph</h1>
          <p className="text-sm text-gray-400 mt-1">
            Visualize connections between research papers and topics
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-400 text-lg mb-4">No graph data available</p>
            <button
              onClick={handleBuildGraph}
              disabled={building}
              className="px-6 py-3 rounded-xl bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {building ? "Building Graph..." : "Build Graph from Papers"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const papers = graphData?.nodes?.filter(n => n.type === "paper") || [];
  const topics = graphData?.nodes?.filter(n => n.type === "topic") || [];

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Research Graph</h1>
          <p className="text-sm text-gray-400 mt-1">
            Papers: {papers.length} • Topics: {topics.length} • Connections: {graphData?.edges?.length || 0}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="all">All Nodes</option>
            <option value="papers">Papers Only</option>
            <option value="topics">Topics Only</option>
          </select>
          <button
            onClick={handleBuildGraph}
            disabled={building}
            className="px-6 py-2 rounded-xl bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
          >
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
          </button>
          <button
            onClick={loadGraph}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50 transition-all font-medium"
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
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading graph...</p>
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
                <div className="absolute top-4 right-4 w-96 bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold mb-2 ${
                        selectedNode.type === "paper" 
                          ? "bg-white text-black" 
                          : "bg-blue-500 text-white"
                      }`}>
                        {selectedNode.type === "paper" ? "📄 Paper" : "🔖 Topic"}
                      </div>
                      <h3 className="text-xl font-bold text-white">{selectedNode.label}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-gray-400 hover:text-white ml-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    {selectedNode.type === "paper" ? (
                      <>
                        {selectedNode.abstract && (
                          <div>
                            <span className="text-gray-400 font-semibold">Abstract:</span>
                            <p className="mt-1 text-gray-300 leading-relaxed">{selectedNode.abstract}</p>
                          </div>
                        )}
                        {selectedNode.keywords && selectedNode.keywords.length > 0 && (
                          <div>
                            <span className="text-gray-400 font-semibold">Keywords:</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedNode.keywords.map((kw, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs border border-gray-700"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedNode.topics_count !== undefined && (
                          <div>
                            <span className="text-gray-400">Topics Found:</span>
                            <span className="ml-2 text-white font-semibold">{selectedNode.topics_count}</span>
                          </div>
                        )}
                        {selectedNode.filename && (
                          <div>
                            <span className="text-gray-400">File:</span>
                            <span className="ml-2 text-gray-300 font-mono text-xs">{selectedNode.filename}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {selectedNode.description && (
                          <div>
                            <span className="text-gray-400 font-semibold">Description:</span>
                            <p className="mt-1 text-gray-300 leading-relaxed">{selectedNode.description}</p>
                          </div>
                        )}
                        {selectedNode.category && (
                          <div>
                            <span className="text-gray-400">Category:</span>
                            <span className="ml-2 text-white capitalize">{selectedNode.category}</span>
                          </div>
                        )}
                        {selectedNode.papers && selectedNode.papers.length > 0 && (
                          <div>
                            <span className="text-gray-400">Appears in {selectedNode.papers.length} paper(s)</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl z-10">
                <h4 className="text-sm font-semibold text-white mb-3">Legend</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-white"></div>
                    <span className="text-gray-300">Paper</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#60a5fa" }}></div>
                    <span className="text-gray-300">Method</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#f472b6" }}></div>
                    <span className="text-gray-300">Theory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#34d399" }}></div>
                    <span className="text-gray-300">Application</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#fbbf24" }}></div>
                    <span className="text-gray-300">Dataset</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#fb923c" }}></div>
                    <span className="text-gray-300">Concept</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    <div>Click nodes to view details</div>
                    <div className="mt-1">Drag to pan • Scroll to zoom</div>
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

