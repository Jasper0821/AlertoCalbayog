import { useEffect, useState } from "react";
import Shell from "./Shell.jsx";
import MapSection from "../FIRE/MapSection.jsx";
import { OverviewSection } from "../FIRE/OverviewSection.jsx";
import { ProfileSection } from "../FIRE/ProfileSection.jsx";
import { QueueSection } from "../FIRE/QueueSection.jsx";
import { ReportsSection } from "../FIRE/ReportsSection.jsx";
import api from "../../../api/axios.js";

const navigation = [
  { id: "dashboard" },
  { id: "map-report" },
  { id: "reported-incidents" },
  { id: "queuing" },
  { id: "profile" },
];

function FloodDashboard() {
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === "undefined") return "dashboard";
    const hash = window.location.hash.replace("#", "");
    return navigation.some((item) => item.id === hash) ? hash : "dashboard";
  });

  const [reports, setReports] = useState([]);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("/emergency/agency/DRRMO");
        setReports(res.data);
        setIsOffline(false);
      } catch (error) {
        console.error("Failed to fetch DRRMO reports:", error);
        setIsOffline(true);
      }
    };

    fetchReports();
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

export default FloodDashboard;
