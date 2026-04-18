import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FireDashboard from "./pages/FireDashboard/FireDashboard.jsx";
import Reports from "./pages/Reports";
import IncidentMap from "./pages/IncidentMap";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<FireDashboard />} />
        <Route path="/firedashboard" element={<FireDashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/map" element={<IncidentMap />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
