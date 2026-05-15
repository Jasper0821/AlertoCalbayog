import { useEffect, useState } from "react";
import AgencyShell from "../AgencyShell.jsx";
import MapSection from "../CDRRMO/MapSection.jsx";
import { OverviewSection } from "../CDRRMO/OverviewSection.jsx";
import { ProfileSection } from "../CDRRMO/ProfileSection.jsx";
import { QueueSection } from "../CDRRMO/QueueSection.jsx";
import { ReportsSection } from "../CDRRMO/ReportsSection.jsx";
import api from "../../../api/axios.js";
import socket from "../../../api/socket.js";

const navigation = [
  { id: "dashboard" },
  { id: "map-report" },
  { id: "reported-incidents" },
  { id: "queuing" },
  { id: "profile" },
];

function PnpDashboard() {
  const agency = "PNP";

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
        const res = await api.get(`/emergency/agency/${agency}`);
        setReports(res.data);
        setIsOffline(false);
      } catch (error) {
        console.error("Failed to fetch PNP reports:", error);
        setIsOffline(true);
      }
    };

    fetchReports();
    const interval = setInterval(fetchReports, 15000);

    // PNP gets auto-notified for crime reports
    socket.connect();
    socket.emit("joinRoom", "PNP");

    socket.on("newEmergencyAlert", (newReport) => {
      console.log("📡 PNP received real-time alert:", newReport);
      setReports((prev) => [newReport, ...prev]);
    });

    return () => {
      clearInterval(interval);
      socket.emit("leaveRoom", "PNP");
      socket.off("newEmergencyAlert");
      socket.disconnect();
    };
  }, []);

  const handleNavClick = (event, id) => {
    event.preventDefault();
    setActiveSection(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <AgencyShell activeSection={activeSection} onNavigate={handleNavClick} agency={agency}>
      {activeSection === "dashboard" && <OverviewSection reports={reports} isOffline={isOffline} />}
      {activeSection === "map-report" && <MapSection reports={reports} isOffline={isOffline} />}
      {activeSection === "reported-incidents" && <ReportsSection reports={reports} />}
      {activeSection === "queuing" && <QueueSection reports={reports} />}
      {activeSection === "profile" && <ProfileSection />}
    </AgencyShell>
  );
}

export default PnpDashboard;
