import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { HomePage } from "./pages/HomePage";
import { SitesPage } from "./pages/SitesPage";
import { SiteDetailPage } from "./pages/SiteDetailPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/sites/:siteId" element={<SiteDetailPage />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}
