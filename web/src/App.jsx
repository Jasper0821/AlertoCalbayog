import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CdrrmoDashboard from "./pages/AGENCY/CDRRMO/Dashboard.jsx";
import PnpDashboard from "./pages/AGENCY/PNP/Dashboard.jsx";
import AdminDashboard from "./pages/ADMIN/Dashboard.jsx";
import Reports from "./pages/Reports";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";
import IncidentMap from "./pages/IncidentMap";
import VerifyOTP from "./pages/VerifyOTP";

// Helper to determine the dashboard route based on user roles and agency
const getAgencyRoute = (user) => {
  if (user?.role === "admin") return "/admindashboard";
  if (user?.agency === "PNP") return "/crimedashboard";
  return "/dashboard";
};

// Route wrapper to allow only authenticated users
function PrivateRoute({ children, allowedRoles, allowedAgency }) {
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  let user = null;

  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Admins bypass normal routing limits
  if (user.role === "admin") {
    return children;
  }

  // Role authorization checks
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getAgencyRoute(user)} replace />;
  }

  // Agency authorization checks
  if (allowedAgency && user.agency !== allowedAgency) {
    return <Navigate to={getAgencyRoute(user)} replace />;
  }

  return children;
}

// Route wrapper for guests (unauthenticated users only)
function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  let user = null;

  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    user = null;
  }

  if (token && user) {
    return <Navigate to={getAgencyRoute(user)} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/map" element={<IncidentMap />} />

        {/* Guest-only auth pages */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/verify-otp" element={<PublicRoute><VerifyOTP /></PublicRoute>} />

        {/* Secured Agency Dashboards */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedAgency="CDRRMO">
              <CdrrmoDashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/crimedashboard"
          element={
            <PrivateRoute allowedAgency="PNP">
              <PnpDashboard />
            </PrivateRoute>
          }
        />

        {/* Super-Admin Dashboard */}
        <Route 
          path="/admindashboard" 
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          } 
        />

          <Route path="*" element={<LandingPage />} />
        </Routes>
    </Router>
  );
}

export default App;
