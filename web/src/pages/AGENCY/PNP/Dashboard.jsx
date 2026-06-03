import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/axios.js";

// Components
import DashboardOverview from "./DashboardOverview.jsx";
import ActiveIncidents from "./ActiveIncidents.jsx";
import DispatchCenter from "./DispatchCenter.jsx";
import LiveMap from "./LiveMap.jsx";
import IncidentHistory from "./IncidentHistory.jsx";
import Analytics from "./Analytics.jsx";
import Settings from "./Settings.jsx";
import { MOCK_REPORTS } from "./utils.js";

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
    id: "active-incidents",
    label: "Active Incidents",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    badge: true,
  },
  {
    id: "dispatch",
    label: "Dispatch Center",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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
  const [reports, setReports] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();
  const userName = storedUser.fullName || storedUser.name || "Officer J. Dela Cruz";
  const agency = storedUser.agency || "PNP";

  const safeReports = Array.isArray(reports) ? reports : [];
  const pendingCount = safeReports.filter(r => r.status === "pending").length;
  const activeCount = safeReports.filter(r => ["responding", "ongoing", "dispatching", "en_route", "active"].includes(r.status)).length;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("/emergency");
        setReports(Array.isArray(res.data) ? res.data : (res.data?.reports || []));
        setIsOffline(false);
      } catch {
        setIsOffline(true);
        setReports(MOCK_REPORTS);
      }
    };
    fetchReports();
    const iv = setInterval(fetchReports, 10000);
    return () => clearInterval(iv);
  }, []);

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":        return <DashboardOverview reports={safeReports} setActiveNav={setActiveNav} />;
      case "active-incidents": return <ActiveIncidents reports={safeReports} />;
      case "dispatch":         return <DispatchCenter reports={safeReports} />;
      case "live-map":         return <LiveMap reports={safeReports} />;
      case "incident-history": return <IncidentHistory reports={safeReports} />;
      case "analytics":        return <Analytics reports={safeReports} />;
      case "settings":         return <Settings user={storedUser} agency={agency} />;
      default:                 return <DashboardOverview reports={safeReports} setActiveNav={setActiveNav} />;
    }
  };

  const currentNav = NAV.find(n => n.id === activeNav);
  const pageTitle = currentNav?.label || "Dashboard";

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased overflow-hidden">

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 shadow-lg shadow-slate-200/60 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 shrink-0">
          <img src="/logo.png" alt="Alerto Calbayog Logo" className="w-9 h-9 object-contain transition-transform duration-300 hover:scale-105 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#0a1e3f] leading-none truncate">Alerto Calbayog</p>
            <p className="text-[10px] text-blue-500 font-semibold mt-0.5 tracking-wide">Dispatch Command</p>
          </div>
        </div>

        {/* Agency badge */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-blue-50/70 rounded-lg px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-100 shrink-0"></div>
            <div>
              <p className="text-[11px] font-bold text-[#0a1e3f]">{agency} — Shift Active</p>
              <p className="text-[10px] text-blue-500 font-semibold">{activeCount} units responding</p>
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
                    ? "bg-[#0a1e3f] text-white shadow-md shadow-[#0a1e3f]/25"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {/* Active bar indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/50 rounded-r-full" />
                )}

                {/* Icon */}
                <span className={`shrink-0 transition-transform duration-200 ${isActive ? "text-white" : "text-slate-400 group-hover:text-[#0a1e3f] group-hover:scale-110"}`}>
                  {item.icon}
                </span>

                {/* Label */}
                <span className="truncate">{item.label}</span>

                {/* Badge for active incidents */}
                {item.badge && activeCount > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isActive ? "bg-white/20 text-white" : "bg-orange-100 text-orange-600"
                  }`}>
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="px-3 pb-4 space-y-0.5 border-t border-slate-100 pt-3">
          <button
            onClick={() => { setActiveNav("settings"); setIsSidebarOpen(false); }}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
              activeNav === "settings"
                ? "bg-[#0a1e3f] text-white shadow-md shadow-[#0a1e3f]/25"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <span className={`shrink-0 transition-transform duration-200 ${activeNav === "settings" ? "text-white" : "text-slate-400 group-hover:text-[#0a1e3f] group-hover:scale-110"}`}>
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span>Settings</span>
          </button>

          <Link
            to="/"
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <span className="shrink-0 text-slate-400 group-hover:text-red-500 transition-colors">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            <span>Log Out</span>
          </Link>
        </div>
      </aside>

      {/* ══════════════ MAIN AREA ══════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">

        {/* ── TOP NAVIGATION BAR ── */}
        <header className="flex h-16 items-center justify-between bg-white border-b border-slate-200 px-4 lg:px-6 shrink-0 gap-4">

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

            {/* Settings button */}
            <button
              onClick={() => setActiveNav("settings")}
              className={`p-2.5 rounded-xl transition-all ${
                activeNav === "settings" ? "bg-slate-100 text-[#0a1e3f]" : "text-slate-400 hover:bg-slate-100 hover:text-[#0a1e3f]"
              }`}
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Profile icon */}
            <button
              onClick={() => setActiveNav("settings")}
              className={`p-2.5 rounded-xl transition-all ${
                activeNav === "settings" ? "bg-slate-100 text-[#0a1e3f]" : "text-slate-400 hover:bg-slate-100 hover:text-[#0a1e3f]"
              }`}
              title="Profile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(p => !p)}
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
                      <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
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
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-1 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-none">{userName}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Shift Commander</p>
              </div>
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-slate-200 group-hover:ring-blue-300 transition-all">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3B82F6&color=fff&bold=true&size=64`}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <section className="flex-1 overflow-y-auto p-5 lg:p-7">
          {isOffline && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
              <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-xs font-semibold text-amber-700">API offline — showing demo data</p>
            </div>
          )}
          {renderContent()}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;