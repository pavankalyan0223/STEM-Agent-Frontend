import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source - use local worker file from public directory
// Fallback to CDN if local file doesn't work
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function PDFViewerWithHighlights({ pdfUrl, topics, topicsMap, paperColor, initialScale = 1.5 }) {
  const containerRef = useRef(null);
  const pagesContainerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(initialScale);
  const [loading, setLoading] = useState(true);
  const [renderedPages, setRenderedPages] = useState([]);
  const renderTasksRef = useRef([]); // Store render tasks for cleanup
  const pinchStartRef = useRef(null); // For pinch-to-zoom
  const lastPinchDistanceRef = useRef(null);

  // Update scale when initialScale prop changes
  useEffect(() => {
    setScale(initialScale);
  }, [initialScale]);

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setRenderedPages([]);
        // Cancel any existing render tasks
        renderTasksRef.current.forEach(task => {
          if (task && task.cancel) task.cancel();
        });
        renderTasksRef.current = [];
        
        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
      } catch (error) {
        console.error("Error loading PDF:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPdf();
    
    // Cleanup on unmount
    return () => {
      renderTasksRef.current.forEach(task => {
        if (task && task.cancel) task.cancel();
      });
      renderTasksRef.current = [];
    };
  }, [pdfUrl]);

  // Render all pages with highlights
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    const renderAllPages = async () => {
      try {
        const pages = [];
        const topicNames = topics?.map(t => {
          const name = (t.name || t.label || "").trim();
          return {
            original: name,
            lower: name.toLowerCase(),
            words: name.toLowerCase().split(/\s+/).filter(w => w.length > 2)
          };
        }).filter(t => t.lower.length > 2) || [];

        // Render all pages
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          // Create canvas for this page
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.className = "mb-4 shadow-2xl mx-auto";

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };

          // Render PDF page
          const renderTask = page.render(renderContext);
          renderTasksRef.current.push(renderTask);
          await renderTask.promise;

          // Extract text and find highlights
          if (topicNames.length > 0) {
            const textContentData = await page.getTextContent();
            const rects = [];
            const textItems = textContentData.items.map((item) => ({
              ...item,
              text: (item.str || "").toLowerCase(),
              transform: item.transform || [1, 0, 0, 1, 0, 0]
            }));

            topicNames.forEach((topic) => {
              const escapedTopic = topic.lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\b${escapedTopic}\\b`, 'i');
              
              textItems.forEach((item) => {
                if (regex.test(item.text)) {
                  const transform = item.transform;
                  const x = transform[4];
                  const y = transform[5];
                  const width = item.width || Math.abs(transform[0]) || 50;
                  const height = item.height || Math.abs(transform[3]) || 12;

                  const isDuplicate = rects.some(r => 
                    Math.abs(r.x - x) < width && Math.abs(r.y - y) < height
                  );

                  if (!isDuplicate && width > 0 && height > 0) {
                    rects.push({
                      x: x,
                      y: y,
                      width: width,
                      height: height,
                      topic: topic.original,
                      color: topicsMap[topic.original] || paperColor
                    });
                  }
                }
              });
            });

            // Draw highlights
            if (rects.length > 0) {
              const originalViewport = page.getViewport({ scale: 1.0 });
              const pdfPageWidth = originalViewport.width;
              const pdfPageHeight = originalViewport.height;
              
              rects.forEach(rect => {
                const canvasX = (rect.x / pdfPageWidth) * canvas.width;
                const pdfYFromTop = pdfPageHeight - rect.y;
                const canvasY = (pdfYFromTop / pdfPageHeight) * canvas.height;
                const canvasWidth = (rect.width / pdfPageWidth) * canvas.width;
                const canvasHeight = (rect.height / pdfPageHeight) * canvas.height;

                context.globalAlpha = 0.4;
                context.fillStyle = rect.color;
                context.fillRect(canvasX, canvasY - canvasHeight, canvasWidth, canvasHeight);
                
                context.globalAlpha = 0.8;
                context.strokeStyle = rect.color;
                context.lineWidth = 1.5;
                context.strokeRect(canvasX, canvasY - canvasHeight, canvasWidth, canvasHeight);
                context.globalAlpha = 1.0;
              });
            }
          }

          pages.push({ canvas, pageNum });
        }

        setRenderedPages(pages);
      } catch (error) {
        console.error("Error rendering pages:", error);
        // If error occurs, still set empty array to show loading state
        setRenderedPages([]);
      }
    };

    renderAllPages();

    // Cleanup
    return () => {
      renderTasksRef.current.forEach(task => {
        if (task && task.cancel) task.cancel();
      });
      renderTasksRef.current = [];
      setRenderedPages([]);
    };
  }, [pdfDoc, numPages, scale, topics, topicsMap, paperColor]);

  // Append canvas elements to DOM
  useEffect(() => {
    if (!pagesContainerRef.current || renderedPages.length === 0) return;

    // Clear existing content
    pagesContainerRef.current.innerHTML = '';

    // Append each canvas to the container
    renderedPages.forEach(({ canvas, pageNum }) => {
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'relative mb-4';
      pageWrapper.setAttribute('data-page', pageNum);

      const pageLabel = document.createElement('div');
      pageLabel.className = 'absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10';
      pageLabel.textContent = `Page ${pageNum}`;

      pageWrapper.appendChild(pageLabel);
      pageWrapper.appendChild(canvas);
      pagesContainerRef.current.appendChild(pageWrapper);
    });

    // Cleanup
    return () => {
      if (pagesContainerRef.current) {
        pagesContainerRef.current.innerHTML = '';
      }
    };
  }, [renderedPages]);

  // Pinch-to-zoom functionality
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        pinchStartRef.current = { distance, scale };
        lastPinchDistanceRef.current = distance;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && pinchStartRef.current) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (lastPinchDistanceRef.current) {
          const scaleChange = distance / lastPinchDistanceRef.current;
          const newScale = Math.max(0.5, Math.min(3, scale * scaleChange));
          setScale(newScale);
        }
        lastPinchDistanceRef.current = distance;
      }
    };

    const handleTouchEnd = () => {
      pinchStartRef.current = null;
      lastPinchDistanceRef.current = null;
    };

    // Mouse wheel zoom (for trackpad pinch simulation)
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [scale]);

  const zoomIn = () => {
    setScale(prev => {
      const newScale = Math.min(prev + 0.25, 3);
      // Re-render pages with new scale
      return newScale;
    });
  };
  
  const zoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.25, 0.5);
      // Re-render pages with new scale
      return newScale;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Controls */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm px-3">
            {numPages} page{numPages !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
          >
            −
          </button>
          <span className="text-white text-sm px-2">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF Canvas - Scrollable */}
      <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-800 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading PDF...</p>
            </div>
          </div>
        ) : (
          <div ref={pagesContainerRef} className="flex flex-col items-center gap-4"></div>
        )}
      </div>
    </div>
  );
}

