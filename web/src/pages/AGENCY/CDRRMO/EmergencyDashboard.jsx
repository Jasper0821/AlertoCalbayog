import { useEffect, useState } from "react";
import Shell from "./Shell.jsx";
import MapSection from "../BFP/MapSection.jsx";
import { OverviewSection } from "../BFP/OverviewSection.jsx";
import { ProfileSection } from "../BFP/ProfileSection.jsx";
import { QueueSection } from "../BFP/QueueSection.jsx";
import { ReportsSection } from "../BFP/ReportsSection.jsx";
import api from "../../../api/axios.js";
import socket from "../../../api/socket.js";

const navigation = [
  { id: "dashboard" },
  { id: "map-report" },
  { id: "reported-incidents" },
  { id: "queuing" },
  { id: "profile" },
];

function EmergencyDashboard() {
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
        const res = await api.get("/emergency/agency/CDRRMO");
        setReports(res.data);
        setIsOffline(false);
      } catch (error) {
        console.error("Failed to fetch CDRRMO reports:", error);
        setIsOffline(true);
      }
    };

    fetchReports();
    const interval = setInterval(fetchReports, 15000);

    // Real-time socket notifications
    socket.connect();
    socket.emit("joinRoom", "CDRRMO");

    socket.on("newEmergencyAlert", (newReport) => {
      console.log("🚨 CDRRMO (Emergency) received real-time alert:", newReport);
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
    <Shell activeSection={activeSection} onNavigate={handleNavClick}>
      {activeSection === "dashboard" && <OverviewSection reports={reports} isOffline={isOffline} />}
      {activeSection === "map-report" && <MapSection reports={reports} isOffline={isOffline} />}
      {activeSection === "reported-incidents" && <ReportsSection reports={reports} />}
      {activeSection === "queuing" && <QueueSection reports={reports} />}
      {activeSection === "profile" && <ProfileSection />}
    </Shell>
  );
}

export default EmergencyDashboard;
