import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchResearchPapers } from "../lib/api.js";

export default function Research() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [maxResults, setMaxResults] = useState(20);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await fetchResearchPapers({
        query: query.trim(),
        maxResults,
        category: category || null,
      });

      if (data.error) {
        setError(data.error);
        setPapers([]);
      } else {
        setPapers(data.papers || []);
        setError(null);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch research papers");
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                Research Papers
              </h1>
              <p className="text-gray-400">
                Discover latest trends and research papers from arXiv
              </p>
            </div>
            <Link
              to="/"
              className="px-4 py-2 rounded-xl border border-gray-700 bg-black hover:bg-gray-900 transition-all hover:shadow-lg hover:border-gray-600 font-medium text-sm text-white flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Chat
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative group">
              <input
                className="w-full bg-black border border-gray-700 text-white placeholder-gray-500 rounded-2xl px-6 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:border-gray-600 backdrop-blur-sm"
                placeholder="Search research papers (e.g., quantum computing, machine learning, differential equations)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <select
              className="px-4 py-4 rounded-2xl bg-black border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-300"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              <option value="">All Categories</option>
              <option value="math">Mathematics</option>
              <option value="physics">Physics</option>
              <option value="quantum">Quantum Physics</option>
              <option value="cs">Computer Science</option>
              <option value="ai">Artificial Intelligence</option>
              <option value="ml">Machine Learning</option>
            </select>
            <select
              className="px-4 py-4 rounded-2xl bg-black border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-300"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              disabled={loading}
            >
              <option value="10">10 results</option>
              <option value="20">20 results</option>
              <option value="30">30 results</option>
              <option value="50">50 results</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-4 rounded-2xl bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-medium flex items-center gap-2 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              <span className="relative flex items-center gap-2">
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 p-6 bg-gray-900 rounded-2xl border border-gray-700 animate-slide-up">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400 font-medium">Fetching research papers...</p>
            </div>
          )}

          {!loading && hasSearched && papers.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-6 bg-gray-900 rounded-3xl mb-4 border border-gray-700">
                <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No papers found</h3>
              <p className="text-gray-400 max-w-md">Try adjusting your search query or category</p>
            </div>
          )}

          {!loading && papers.length > 0 && (
            <div className="space-y-4 animate-slide-up">
              <div className="mb-6">
                <p className="text-gray-400">
                  Found <span className="text-white font-semibold">{papers.length}</span> research papers
                  {query && (
                    <>
                      {" "}for <span className="text-white font-semibold">"{query}"</span>
                    </>
                  )}
                </p>
              </div>

              {papers.map((paper, index) => (
                <div
                  key={paper.id || index}
                  className="bg-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-gray-600 hover:shadow-xl transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-bold text-white flex-1 leading-tight">
                      {paper.title}
                    </h3>
                    <div className="flex gap-2 shrink-0">
                      <a
                        href={paper.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-white text-black hover:bg-gray-100 transition-all duration-300 font-medium text-sm flex items-center gap-2 hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                      </a>
                      {paper.pdf_link && (
                        <a
                          href={paper.pdf_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl border border-gray-700 bg-black text-white hover:bg-gray-800 transition-all duration-300 font-medium text-sm flex items-center gap-2 hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          PDF
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                      {paper.authors && paper.authors.length > 0 && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="max-w-md truncate">
                            {paper.authors.slice(0, 3).join(", ")}
                            {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                          </span>
                        </div>
                      )}
                      {paper.published && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(paper.published)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 leading-relaxed line-clamp-3">
                    {paper.summary}
                  </p>

                  {paper.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <span className="text-xs text-gray-500 font-mono">
                        arXiv: {paper.id.split('/').pop()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-10 bg-gray-900 rounded-3xl mb-6 border border-gray-700 shadow-2xl">
                <div className="text-7xl mb-2 animate-float">📚</div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Discover Research Papers
              </h3>
              <p className="text-gray-400 text-lg mb-2 max-w-md">
                Search for the latest research papers from arXiv
              </p>
              <p className="text-gray-500 text-sm">
                Enter a topic above to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
