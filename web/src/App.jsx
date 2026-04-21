import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FireDashboard from "./pages/FireDashboard/FireDashboard.jsx";
import Reports from "./pages/Reports";
import Services from "./pages/Services";
import CityGridMap from "./pages/CityGridMap";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<FireDashboard />} />

        <Route path="/firedashboard" element={<FireDashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/services" element={<Services />} />
        <Route path="/map" element={<CityGridMap />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;

