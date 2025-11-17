import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { HomePage } from "./pages/HomePage";
import { SitesPage } from "./pages/SitesPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sites" element={<SitesPage />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}
