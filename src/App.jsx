import { Routes, Route } from "react-router-dom";
import ChatPage from "./components/ChatPage.jsx";
import Summaries from "./pages/Summaries.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="/summaries" element={<Summaries />} />
    </Routes>
  );
}
