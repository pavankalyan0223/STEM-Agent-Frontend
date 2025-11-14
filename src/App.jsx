import { Routes, Route } from "react-router-dom";
import ChatPage from "./components/ChatPage.jsx";
import Summaries from "./pages/Summaries.jsx";
import Research from "./pages/Research.jsx";
import ResearchGraph from "./pages/ResearchGraph.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="/summaries" element={<Summaries />} />
      <Route path="/research" element={<Research />} />
      <Route path="/research-graph" element={<ResearchGraph />} />
    </Routes>
  );
}
