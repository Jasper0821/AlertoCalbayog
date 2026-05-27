import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { initTheme } from "./theme";
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CdrrmoBfpDashboard from "./pages/AGENCY/CDRRMO/Dashboard.jsx";
import PnpDashboard from "./pages/AGENCY/PNP/Dashboard.jsx";
import AdminDashboard from "./pages/ADMIN/Dashboard.jsx";
import Reports from "./pages/Reports";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";
import IncidentMap from "./pages/IncidentMap";
import VerifyOTP from "./pages/VerifyOTP";

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

        {/* Agency Dashboards */}
        <Route path="/dashboard" element={<CdrrmoBfpDashboard />} />
        <Route path="/crimedashboard" element={<PnpDashboard />} />

        {/* Legacy routes */}
        <Route path="/firedashboard" element={<CdrrmoBfpDashboard />} />
        <Route path="/flooddashboard" element={<CdrrmoBfpDashboard />} />
        <Route path="/emergencydashboard" element={<CdrrmoBfpDashboard />} />

        {/* Admin Dashboard - sees ALL reports */}
        <Route path="/admindashboard" element={<AdminDashboard />} />

        <Route path="/reports" element={<Reports />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/map" element={<IncidentMap />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
