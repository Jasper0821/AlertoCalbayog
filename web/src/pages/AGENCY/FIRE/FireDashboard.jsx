import { useEffect, useState } from "react";
import Shell from "./Shell.jsx";
import MapSection from "./MapSection.jsx";
import { OverviewSection } from "./OverviewSection.jsx";
import { ProfileSection } from "./ProfileSection.jsx";
import { QueueSection } from "./QueueSection.jsx";
import { ReportsSection } from "./ReportsSection.jsx";
import api from "../../../api/axios.js";

const navigation = [
  { id: "dashboard" },
  { id: "map-report" },
  { id: "reported-incidents" },
  { id: "queuing" },
  { id: "profile" },
];

function FireDashboard() {
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === "undefined") {
      return "dashboard";
    }

    const hash = window.location.hash.replace("#", "");
    return navigation.some((item) => item.id === hash) ? hash : "dashboard";
  });

  const [reports, setReports] = useState([]);
  const [isOffline, setIsOffline] = useState(false);

  // Fetch real reports from backend filtered by BFP agency
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("/emergency/agency/BFP");
        setReports(res.data);
        setIsOffline(false);
      } catch (error) {
        console.error("Failed to fetch BFP reports:", error);
        setIsOffline(true);
      }
    };

    fetchReports();

    // Refresh every 15 seconds
    const interval = setInterval(fetchReports, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNavClick = (event, id) => {
    event.preventDefault();
    setActiveSection(id);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <Shell activeSection={activeSection} onNavigate={handleNavClick}>
      {activeSection === "dashboard" && <OverviewSection reports={reports} isOffline={isOffline} />}
      {activeSection === "map-report" && <MapSection reports={reports} isOffline={isOffline} />}
      {activeSection === "reported-incidents" && <ReportsSection reports={reports} />}
      {activeSection === "queuing" && <QueueSection reports={reports} />}
      {activeSection === "profile" && <ProfileSection />}
    </Shell>
  );
}

export default FireDashboard;
