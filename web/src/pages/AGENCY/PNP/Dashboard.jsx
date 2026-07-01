import { useEffect, useState, useRef } from "react";
import api from "../../../api/axios.js";
import socket from "../../../api/socket.js";
import Swal from "sweetalert2";
import { clearDashboardNavigationState } from "../../../utils/dashboardSession.js";

// Components
import DashboardOverview from "./DashboardOverview.jsx";
import QueuingSystem from "./QueuingSystem.jsx";
import ActiveIncidents from "./ActiveIncidents.jsx";
import LiveMap from "./LiveMap.jsx";
import IncidentHistory from "./IncidentHistory.jsx";
import Analytics from "./Analytics.jsx";
import Settings from "./Settings.jsx";


const NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "incident-reports",
    label: "Incident Reports",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "queuing",
    label: "Queuing System",
    badge: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: "live-map",
    label: "Live Map",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "incident-history",
    label: "Incident History",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

function AdminDashboard() {
  const [reports, setReports] = useState(() => {
    try {
      const stored = localStorage.getItem("pnpReports");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [statusOverrides, setStatusOverrides] = useState(() => {
    try {
      const stored = localStorage.getItem("pnpStatusOverrides");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    if (reports.length > 0) {
      localStorage.setItem("pnpReports", JSON.stringify(reports));
    }
  }, [reports]);

  useEffect(() => {
    if (Object.keys(statusOverrides).length > 0) {
      localStorage.setItem("pnpStatusOverrides", JSON.stringify(statusOverrides));
    }
  }, [statusOverrides]);
  const [isOffline, setIsOffline] = useState(false);
  const [activeNav, setActiveNav] = useState(() => {
    return localStorage.getItem("pnpActiveNav") || "dashboard";
  });

  useEffect(() => {
    localStorage.setItem("pnpActiveNav", activeNav);
  }, [activeNav]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Real-time dispatch modal states
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertQueue, setAlertQueue] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("Mobile Patrol 1");
  const [dispatchNote, setDispatchNote] = useState("");
  
  // Real-time dynamic clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  const alarmSirenRef = useRef(null);
  const sharedAudioCtxRef = useRef(null);

  // Unlock AudioContext on first user gesture to defeat browser autoplay policy
  useEffect(() => {
    const unlockAudio = () => {
      if (!sharedAudioCtxRef.current) {
        sharedAudioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (sharedAudioCtxRef.current.state === "suspended") {
        sharedAudioCtxRef.current.resume();
      }
    };
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // Request desktop notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Helper: send a native OS desktop notification
  const sendDesktopNotification = (report) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const title = `🚨 PNP ALERT: ${report.emergencyType || "Crime / Incident"}`;
    const body = [
      report.userId?.fullName || "Anonymous Reporter",
      report.location?.name || report.location?.barangay || "Unknown Location",
      report.description ? report.description.slice(0, 80) + (report.description.length > 80 ? "..." : "") : "",
    ].filter(Boolean).join(" · ");
    const notif = new Notification(title, {
      body,
      icon: "/logo.png",
      tag: `pnp-alert-${report._id || Date.now()}`,
      requireInteraction: true,
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  };

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  });
  const userName = user.fullName || "Officer J. Dela Cruz";
  const agency = user.agency || "PNP";

  // Dynamic ticking clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setStatusOverrides(prev => ({ ...prev, [id]: newStatus }));
    try {
      const res = await api.put(`/emergency/${id}`, { status: newStatus });
      const updatedReport = res.data?.report;
      if (updatedReport?._id) {
        setReports(prev => prev.map(r => r._id === updatedReport._id ? updatedReport : r));
      }
      setStatusOverrides(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setStatusOverrides(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: err.response?.data?.message || "Unable to update incident status",
        showConfirmButton: false,
        timer: 2600,
      });
      console.warn("Backend update failed:", err);
    }
  };

  const safeReports = (Array.isArray(reports) ? reports : []).map(r => ({
    ...r,
    status: statusOverrides[r._id] || r.status
  })).filter(r => 
    (r.emergencyType || "").toLowerCase() === "crime"
  );
  const pendingCount = safeReports.filter(r => r.status === "pending").length;
  const activeCount = safeReports.filter(r => ["responding", "ongoing", "dispatching", "en_route", "active"].includes(r.status)).length;

  // Poll for safety + initial load
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("/emergency");
        setReports(Array.isArray(res.data) ? res.data : (res.data?.reports || []));
        setIsOffline(false);
      } catch (error) {
        setIsOffline(true);
        // We don't overwrite with mock data on failure to keep localStorage data
      }
    };
    fetchReports();
    const iv = setInterval(fetchReports, 15000);
    return () => clearInterval(iv);
  }, []);

  // Web Audio siren generator
  const playSiren = () => {
    try {
      stopSiren(); // ensure no overlapping sound

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      
      lfo.frequency.value = 0.5; // wails slowly (once every 2 seconds) for realism
      lfoGain.gain.value = 250; // modulates pitch by +/- 250Hz
      
      osc.type = "triangle"; // smooth triangle wave (realistic siren, not buzzy like sawtooth)
      osc.frequency.value = 750; // sweeps between 500Hz and 1000Hz
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      gain.gain.setValueAtTime(1.0, audioCtx.currentTime);
      
      osc.start();
      lfo.start();

      alarmSirenRef.current = {
        audioCtx,
        osc,
        lfo,
        gain
      };
    } catch (err) {
      console.warn("Failed to play siren:", err);
    }
  };

  const stopSiren = () => {
    if (alarmSirenRef.current) {
      try {
        alarmSirenRef.current.osc.stop();
        alarmSirenRef.current.lfo.stop();
        alarmSirenRef.current.audioCtx.close();
      } catch (e) {
        // ignore
      }
      alarmSirenRef.current = null;
    }
  };

  const closeAlert = () => {
    setActiveAlert(null);
    stopSiren();
  };

  useEffect(() => {
    return () => {
      stopSiren();
    };
  }, []);

  // Web Audio chime generator
  const playSystemChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Chime 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain1.gain.setValueAtTime(1.0, audioCtx.currentTime);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.15);

      // Chime 2
      setTimeout(() => {
        const audioCtx2 = new (window.AudioContext || window.webkitAudioContext)();
        const osc2 = audioCtx2.createOscillator();
        const gain2 = audioCtx2.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx2.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1100, audioCtx2.currentTime); // C6
        gain2.gain.setValueAtTime(1.0, audioCtx2.currentTime);
        osc2.start(audioCtx2.currentTime);
        osc2.stop(audioCtx2.currentTime + 0.25);
      }, 150);
    } catch (err) {
      console.warn("Chime play error:", err);
    }
  };

  const playAlertSound = () => {
    const soundEnabled = user.soundAlerts !== false;
    const loopEnabled = user.loopAlarm !== false;
    if (!soundEnabled) return;

    if (loopEnabled) {
      playSiren();
    } else {
      playSystemChime();
    }
  };

  const enqueueIncomingAlert = (report) => {
    const reportKey = report._id || report.incidentId || report.createdAt || `${Date.now()}-${Math.random()}`;

    setAlertQueue(prev => {
      if (prev.some(item => (item._id || item.incidentId || item.createdAt || item.__queueKey) === reportKey)) return prev;
      return [...prev, { ...report, __queueKey: reportKey }];
    });

    sendDesktopNotification(report);
  };

  useEffect(() => {
    if (activeAlert || alertQueue.length === 0) return;

    const [nextAlert, ...remainingAlerts] = alertQueue;
    setActiveAlert(nextAlert);
    setAlertQueue(remainingAlerts);
    playAlertSound();
  }, [activeAlert, alertQueue, user.soundAlerts, user.loopAlarm]);

  // Socket Connection for Real-time Crime Alerts
  useEffect(() => {
    socket.connect();
    const room = user.agency || "PNP";
    socket.emit("joinRoom", room);
    socket.emit("joinRoom", "admin");

    socket.on("newEmergencyAlert", (newReport) => {
      console.log("📡 PNP Command Center received live alert:", newReport);

      // Ensure it is a crime type
      if ((newReport.emergencyType || "").toLowerCase() === "crime") {
        setReports(prev => {
          if (prev.some(r => r._id === newReport._id)) return prev;
          return [newReport, ...prev];
        });

        enqueueIncomingAlert(newReport);
      }
    });

    socket.on("reportStatusChanged", (updatedReport) => {
      console.log("📡 PNP Command Center received status change:", updatedReport);
      if ((updatedReport.emergencyType || "").toLowerCase() === "crime") {
        setReports(prev => prev.some(r => r._id === updatedReport._id)
          ? prev.map(r => r._id === updatedReport._id ? updatedReport : r)
          : [updatedReport, ...prev]
        );
        setStatusOverrides(prev => {
          const next = { ...prev };
          delete next[updatedReport._id];
          return next;
        });
      }
    });

    return () => {
      socket.emit("leaveRoom", room);
      socket.emit("leaveRoom", "admin");
      socket.off("newEmergencyAlert");
      socket.off("reportStatusChanged");
      socket.disconnect();
    };
  }, [user.agency, user.soundAlerts, user.loopAlarm]);

  // Listen for simulated test alerts from Settings
  useEffect(() => {
    const handleSimulatedAlert = (e) => {
      console.log("📡 Simulated alert triggered:", e.detail);
      enqueueIncomingAlert(e.detail);
    };
    window.addEventListener("simulate-crime-alert", handleSimulatedAlert);
    return () => {
      window.removeEventListener("simulate-crime-alert", handleSimulatedAlert);
    };
  }, [user.soundAlerts, user.loopAlarm]);

  // Handle active dispatch submission
  const handleDispatchSubmit = () => {
    if (!activeAlert) return;

    // Update local and backend status
    handleStatusChange(activeAlert._id, "responding");

    // Close modal silently — no secondary popup
    setActiveAlert(null);
    stopSiren();
    setSelectedUnit("Mobile Patrol 1");
    setDispatchNote("");
    setActiveNav("queuing");
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    clearDashboardNavigationState();
    window.location.href = "/";
  };

  const filteredReports = safeReports.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const type = (r.type || r.crimeType || r.incidentType || "").toLowerCase();
    const location = (r.location?.barangay || (typeof r.location === "string" ? r.location : "")).toLowerCase();
    const reporter = (r.reporterName || "").toLowerCase();
    const details = (r.details || "").toLowerCase();
    return type.includes(q) || location.includes(q) || reporter.includes(q) || details.includes(q);
  });

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":        return <DashboardOverview reports={filteredReports} setActiveNav={setActiveNav} />;
      case "incident-reports": return <ActiveIncidents reports={filteredReports} onStatusChange={handleStatusChange} />;
      case "queuing":          return <QueuingSystem reports={filteredReports} onStatusChange={handleStatusChange} />;
      case "live-map":         return <LiveMap reports={filteredReports} />;
      case "incident-history": return <IncidentHistory reports={filteredReports} />;
      case "analytics":        return <Analytics reports={filteredReports} />;
      case "settings":         return <Settings user={user} onUserUpdate={setUser} />;
      default:                 return <DashboardOverview reports={filteredReports} setActiveNav={setActiveNav} />;
    }
  };

  const currentNav = NAV.find(n => n.id === activeNav);
  const pageTitle = currentNav?.label || "Dashboard";
  const incomingAlertCount = (activeAlert ? 1 : 0) + alertQueue.length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased overflow-hidden">

      {/* Mobile overlay — for non-live-map pages */}
      {isSidebarOpen && activeNav !== "live-map" && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Overlay backdrop — for live-map sidebar */}
      {isSidebarOpen && activeNav === "live-map" && (
        <div
          className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Floating burger button — only visible on live map */}
      {activeNav === "live-map" && (
        <button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          title="Toggle Sidebar"
          className="fixed top-4 left-4 z-[60] flex items-center justify-center w-10 h-10 rounded-xl bg-[#0a1e3f] text-white shadow-lg hover:bg-[#1a3a6b] active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* ══════════════ CUSTOM LOGOUT MODAL ══════════════ */}
      {incomingAlertCount > 0 && (
        <div className="fixed top-4 left-1/2 z-[120] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2">
          <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-2xl shadow-red-950/10">
            <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400" />
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0a1e3f] text-white shadow-lg shadow-[#0a1e3f]/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
                  </svg>
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white ring-2 ring-white">
                    {incomingAlertCount}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">
                    {incomingAlertCount > 1 ? `${incomingAlertCount} incoming reports` : "Incoming report"}
                  </p>
                  <p className="truncate text-[11px] font-semibold text-slate-500">
                    {incomingAlertCount > 1
                      ? "Reports arrived at the same time."
                      : activeAlert?.emergencyType || "New crime report received."}
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 alert-live-dot" />
                Incoming
              </span>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#030d1e]/75 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className="relative z-10 w-full max-w-[420px] rounded-2xl overflow-hidden shadow-[0_32px_80px_-8px_rgba(0,0,0,0.7)] border border-[#1a3a6b]/60 flex flex-col bg-white animate-zoom-in">
            <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400" />
            
            <div className="bg-[#0a1e3f] px-6 py-4 flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-black text-sm tracking-wide uppercase">Logout Command Center?</h3>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">End Active Shift</p>
              </div>
            </div>

            <div className="p-6 bg-[#f8fafc]">
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Are you sure you want to end your active shift session and logout from the command center?
              </p>
            </div>

            <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-[13px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Keep Active
              </button>
              <button
                onClick={confirmLogout}
                className="px-5 py-2 rounded-lg text-[13px] font-black text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all uppercase tracking-wide shadow-lg shadow-red-600/20"
              >
                Logout Shift
              </button>
            </div>
            
            <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400" />
          </div>
        </div>
      )}

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex flex-col w-64 transition-transform duration-300 ease-in-out ${
          activeNav === "live-map"
            ? isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            : `${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0 lg:shadow-none`
        }`}
        style={{ background: "#0a1e3f" }}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-5 h-16 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <img src="/logo.png" alt="Alerto Calbayog Logo" className="w-9 h-9 object-contain transition-transform duration-300 hover:scale-105 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-none truncate">Alerto Calbayog</p>
            <p className="text-[10px] text-emerald-300 font-semibold mt-0.5 tracking-wide">Dispatch Command</p>
          </div>
        </div>

        {/* Agency badge */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30 shrink-0"></div>
            <div>
              <p className="text-[11px] font-bold text-white">{agency} — Shift Active</p>
              <p className="text-[10px] text-emerald-300 font-semibold">{activeCount} units responding</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(item => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); setIsSidebarOpen(false); }}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left relative ${
                  isActive
                    ? "bg-white/15 text-white shadow-md"
                    : "text-emerald-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                {/* Active bar indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                )}

                {/* Icon */}
                <span className={`shrink-0 transition-transform duration-200 ${isActive ? "text-white" : "text-emerald-300 group-hover:text-white group-hover:scale-110"}`}>
                  {item.icon}
                </span>

                {/* Label */}
                <span className="truncate">{item.label}</span>

                {/* Badge for pending incidents */}
                {item.badge && pendingCount > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isActive ? "bg-white/20 text-white" : "bg-amber-400/90 text-amber-900"
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom logout */}
        <div className="p-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => handleLogout()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-emerald-200 hover:bg-red-500/20 hover:text-red-300 transition-all text-left"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout Terminal</span>
          </button>
        </div>

      </aside>

      {/* ══════════════ MAIN AREA ══════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">

        {/* ── TOP NAVIGATION BAR ── */}
        <header className={`${activeNav === "live-map" ? "hidden" : "flex"} h-16 items-center justify-between bg-white border-b border-slate-200 px-4 lg:px-6 shrink-0 gap-4`}>

          {/* Left: hamburger + page title + search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
              <span className="font-semibold text-[#0a1e3f]">{pageTitle}</span>
            </div>

            {/* Separator */}
            <div className="h-5 w-px bg-slate-200 hidden lg:block"></div>

            {/* Real-time Dynamic Clock */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{currentTime.toLocaleDateString()} — {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            {/* Separator */}
            <div className="h-5 w-px bg-slate-200 hidden lg:block"></div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm hidden sm:block">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search incidents, units, or locations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          {/* Right: action icons + user profile */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifDropdown(p => !p); stopSiren(); }}
                className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all relative"
                title="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {pendingCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">Notifications</p>
                    {pendingCount > 0 && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        {pendingCount} pending
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                    {safeReports.filter(r => r.status === "pending").slice(0, 4).map((r, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setActiveAlert(r); setShowNotifDropdown(false); stopSiren(); }}>
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{r.userId?.fullName || "Anonymous"}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{typeof r.location === "string" ? r.location : (r.location?.name || "Unknown")}</p>
                        </div>
                      </div>
                    ))}
                    {pendingCount === 0 && (
                      <div className="py-8 text-center text-sm text-slate-400">All caught up!</div>
                    )}
                  </div>
                  <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700" onClick={() => { setActiveNav("queuing"); setShowNotifDropdown(false); stopSiren(); }}>
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => { setActiveNav("settings"); setShowNotifDropdown(false); }}
              className={`p-2.5 rounded-xl transition-all ${
                activeNav === "settings"
                  ? "bg-[#0a1e3f] text-white"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              }`}
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.831a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.83c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.831a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            {/* User Profile Info */}
            <div className="flex items-center gap-3 pl-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0a1e3f] flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-100 shrink-0">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0a1e3f&color=fff&bold=true&size=64`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden md:block text-left leading-none">
                <p className="text-xs font-semibold text-slate-800">{userName}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{user.rank || "Shift Commander"}</p>
              </div>
            </div>

          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <section className={`flex-1 min-h-0 ${
          activeNav === "live-map"
            ? "overflow-hidden p-0 m-0 w-full h-full"
            : "overflow-y-auto p-5 lg:p-7"
        }`}>
          <div className={
            activeNav === "live-map"
              ? "h-full w-full"
              : "max-w-screen-2xl mx-auto"
          }>
            {renderContent()}
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════
           🚨  PROFESSIONAL EMERGENCY ALERT DISPATCH MODAL 🚨
          ═══════════════════════════════════════════════════════ */}
      {activeAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

          {/* ── Deep navy-smoke backdrop ── */}
          <div
            className="absolute inset-0 bg-[#030d1e]/75 backdrop-blur-sm"
            onClick={closeAlert}
          />

          {/* ── Pulsing deep-red ambient vignette ── */}
          <div
            className="absolute inset-0 pointer-events-none alert-vignette"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 35%, rgba(185,28,28,0.55) 100%)",
            }}
          />

          {/* ── Animated scan-line sweep ── */}
          <div
            className="absolute left-0 right-0 h-[2px] pointer-events-none alert-scan-line"
            style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)" }}
          />

          {/* ════════════ MODAL CARD ════════════ */}
          <div className="alert-modal-card relative z-10 w-full max-w-[520px] rounded-2xl overflow-hidden shadow-[0_32px_80px_-8px_rgba(0,0,0,0.7)] border border-[#1a3a6b]/60 flex flex-col">

            {/* ── TOP COLOR STRIP (incident severity indicator) ── */}
            <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400" />

            {/* ── HEADER ── */}
            <div className="bg-[#0a1e3f] px-6 pt-5 pb-4 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-4">
                {/* Agency emblem placeholder */}
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {/* LIVE badge */}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-black uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-white alert-live-dot inline-block" />
                      LIVE
                    </span>
                    <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">
                      Incoming Report
                    </span>
                  </div>
                  <h3 className="text-white font-black text-base tracking-wide uppercase leading-tight">
                    Emergency Incident Alert
                  </h3>
                  <p className="text-white/50 text-[11px] mt-0.5 font-medium">
                    Philippine National Police — Calbayog City Station
                  </p>
                </div>
              </div>
              {/* Close */}
              <button
                onClick={closeAlert}
                className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all shrink-0"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── INCIDENT TYPE BANNER ── */}
            <div className="bg-[#0d2550] px-6 py-2.5 flex items-center justify-between border-t border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 alert-live-dot" />
                <span className="text-red-400 font-black text-xs uppercase tracking-widest">
                  {activeAlert.emergencyType || "Crime / Incident"}
                </span>
              </div>
              <span className="text-white/40 text-[11px] font-semibold tabular-nums">
                {new Date(activeAlert.createdAt || Date.now()).toLocaleString("en-PH", {
                  month: "short", day: "numeric", year: "numeric",
                  hour: "2-digit", minute: "2-digit", second: "2-digit"
                })}
              </span>
            </div>

            {/* ── BODY ── */}
            <div className="bg-[#f8fafc] overflow-y-auto max-h-[52vh]">

              {/* Incident datasheet */}
              <div className="px-6 py-5 space-y-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                  Incident Information
                </p>

                {[
                  {
                    label: "Complainant",
                    value: activeAlert.userId?.fullName || activeAlert.name || "Anonymous",
                    bold: true,
                  },
                  {
                    label: "Contact No.",
                    value: activeAlert.userId?.phoneNumber || activeAlert.phoneNumber || "N/A",
                    mono: true,
                  },
                  {
                    label: "Location",
                    value: activeAlert.location?.name || `${activeAlert.location?.barangay || activeAlert.barangay || "Unknown Barangay"}, ${activeAlert.location?.street || activeAlert.street || "N/A"}`.replace(/^,\s*/, ""),
                  },
                ].map(({ label, value, bold, mono }) => (
                  <div
                    key={label}
                    className="flex items-baseline gap-3 py-2.5 border-b border-slate-100 last:border-0"
                  >
                    <span className="w-28 shrink-0 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      {label}
                    </span>
                    <span
                      className={`flex-1 text-sm text-slate-800 ${bold ? "font-bold" : "font-medium"} ${mono ? "font-mono text-[#0a1e3f]" : ""}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}

                {/* Description block */}
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">
                    Incident Narrative
                  </p>
                  <p className="text-slate-700 text-[13px] leading-relaxed italic">
                    "{activeAlert.description || "No description provided by the complainant."}"
                  </p>
                </div>
              </div>

              {/* Dispatch panel */}
              <div className="mx-5 mb-5 rounded-xl border border-[#0a1e3f]/15 overflow-hidden">
                <div className="bg-[#0a1e3f] px-4 py-2.5 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/80">
                    Dispatch Assignment
                  </p>
                </div>
                <div className="bg-white px-4 py-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Responding Unit
                    </label>
                    <select
                      value={selectedUnit}
                      onChange={e => setSelectedUnit(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-lg bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-[#0a1e3f]/10 outline-none transition-all cursor-pointer font-semibold"
                    >
                      <option value="Mobile Patrol 1">Mobile Patrol 1 — PNP Alpha</option>
                      <option value="Mobile Patrol 2">Mobile Patrol 2 — PNP Bravo</option>
                      <option value="K9 Search Unit">K9 Search Unit — PNP Delta</option>
                      <option value="Special Operations Team">Special Operations Team — PNP SOT</option>
                      <option value="Traffic Investigation Division">Traffic Investigation Div. — PNP TID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Field Orders / Notes
                    </label>
                    <textarea
                      rows={2}
                      value={dispatchNote}
                      onChange={e => setDispatchNote(e.target.value)}
                      placeholder="Enter special instructions for the assigned unit (optional)..."
                      className="w-full px-3 py-2 text-[13px] text-slate-800 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-[#0a1e3f]/10 outline-none transition-all resize-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
              <button
                onClick={closeAlert}
                className="text-[13px] font-semibold text-slate-400 hover:text-slate-600 transition-colors tracking-wide"
              >
                Dismiss
              </button>
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-[10px] text-slate-400 italic">
                  Action will be logged
                </span>
                <button
                  onClick={handleDispatchSubmit}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-black text-white bg-[#0a1e3f] hover:bg-[#0d2650] active:scale-95 shadow-lg shadow-[#0a1e3f]/30 transition-all tracking-wide uppercase"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Dispatch Now
                </button>
              </div>
            </div>

            {/* ── BOTTOM SEVERITY STRIP ── */}
            <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400" />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
