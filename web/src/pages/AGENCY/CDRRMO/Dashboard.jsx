import { useEffect, useState } from "react";
import AgencyShell from "../AgencyShell.jsx";
import MapSection from "./MapSection.jsx";
import { OverviewSection } from "./OverviewSection.jsx";
import { ProfileSection } from "./ProfileSection.jsx";
import { QueueSection } from "./QueueSection.jsx";
import { ReportsSection } from "./ReportsSection.jsx";
import api from "../../../api/axios.js";
import socket from "../../../api/socket.js";

const navigation = [
  { id: "dashboard" },
  { id: "map-report" },
  { id: "reported-incidents" },
  { id: "queuing" },
  { id: "profile" },
];

function CdrrmoDashboard() {
  const agency = "CDRRMO";

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
        console.error("Failed to fetch CDRRMO reports:", error);
        setIsOffline(true);
      }
    };

    fetchReports();
    const interval = setInterval(fetchReports, 15000);

    // Real-time socket — CDRRMO is the main hub, also listen to BFP room
    socket.connect();
    socket.emit("joinRoom", "CDRRMO");

    socket.on("newEmergencyAlert", (newReport) => {
      console.log("📡 CDRRMO received real-time alert:", newReport);
      setReports((prev) => [newReport, ...prev]);
    });

    return () => {
      clearInterval(interval);
      socket.emit("leaveRoom", "CDRRMO");
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

export default CdrrmoDashboard;
