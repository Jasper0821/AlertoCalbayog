import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { initTheme } from "./theme";
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FireDashboard from "./pages/AGENCY/FIRE/FireDashboard.jsx";
import FloodDashboard from "./pages/AGENCY/FLOOD/FloodDashboard.jsx";
import EmergencyDashboard from "./pages/AGENCY/EMERGENCY/EmergencyDashboard.jsx";
import Reports from "./pages/Reports";
import Services from "./pages/Services";
import ForgotPassword from "./pages/ForgotPassword";
import IncidentMap from "./pages/IncidentMap";

function App() {
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Agency Dashboards - each fetches only its own reports */}
        <Route path="/dashboard" element={<FireDashboard />} />
        <Route path="/firedashboard" element={<FireDashboard />} />
        <Route path="/flooddashboard" element={<FloodDashboard />} />
        <Route path="/emergencydashboard" element={<EmergencyDashboard />} />

        <Route path="/reports" element={<Reports />} />
        <Route path="/services" element={<Services />} />
        <Route path="/map" element={<IncidentMap />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
