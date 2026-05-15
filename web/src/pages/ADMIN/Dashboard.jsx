import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toggleDarkMode } from "../../theme.js";
import api from "../../api/axios.js";

/* ── Inline SVG Icons ─────────────────────────────────────── */
function BoltIcon({ className }) {
  return (<svg className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>);
}
function MenuIcon({ className }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
}
function SunIcon({ className }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>);
}
function MoonIcon({ className }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>);
}
function BellIcon({ className }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>);
}

/* ── Status & type helpers ────────────────────────────────── */
const STATUS_STYLES = {
  pending:    { bg: "bg-amber-500/10 dark:bg-amber-400/10", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  responding: { bg: "bg-blue-500/10 dark:bg-blue-400/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  resolved:   { bg: "bg-emerald-500/10 dark:bg-emerald-400/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  closed:     { bg: "bg-slate-500/10 dark:bg-slate-400/10", text: "text-slate-500 dark:text-slate-400", dot: "bg-slate-400" },
};

const TYPE_STYLES = {
  fire:      { bg: "bg-red-500/10", text: "text-red-500", label: "🔥 Fire" },
  medical:   { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "🏥 Medical" },
  others:    { bg: "bg-amber-500/10", text: "text-amber-500", label: "⚠️ Others" },
  flood:     { bg: "bg-sky-500/10", text: "text-sky-500", label: "🌊 Flood" },
  emergency: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "🚨 Emergency" },
  crime:     { bg: "bg-violet-500/10", text: "text-violet-500", label: "🚔 Crime" },
};

function Dashboard() {
  const [reports, setReports] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const handleToggleTheme = () => {
    const newState = toggleDarkMode();
    setIsDark(newState);
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("/emergency");
        setReports(res.data);
        setIsOffline(false);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        setIsOffline(true);
      }
    };

    fetchReports();
    const interval = setInterval(fetchReports, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = reports.filter((r) => {
    if (filterType !== "all" && r.emergencyType !== filterType) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  // Stats
  const totalReports = reports.length;
  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const respondingCount = reports.filter((r) => r.status === "responding").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased overflow-hidden transition-colors duration-300">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[40] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[50] flex w-[280px] flex-col bg-slate-50 dark:bg-slate-900/50 dark:backdrop-blur-xl border-r border-slate-100 dark:border-slate-800 transition-all duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-4 px-8 py-10">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
            <BoltIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xl font-black tracking-[-0.03em] uppercase">
              <span className="text-orange-500 italic">Alerto</span> Calbayog
            </p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Admin Panel
            </p>
          </div>
        </div>

        {/* Stat cards in sidebar */}
        <div className="px-6 space-y-3 mb-6">
          {[
            { label: "Total", value: totalReports, color: "bg-slate-900 dark:bg-slate-800" },
            { label: "Pending", value: pendingCount, color: "bg-amber-500" },
            { label: "Responding", value: respondingCount, color: "bg-blue-500" },
            { label: "Resolved", value: resolvedCount, color: "bg-emerald-500" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${stat.color}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{stat.label}</span>
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white">{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div className="px-6 py-8">
          <Link
            to="/"
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-all hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/20"
          >
            Terminal Exit
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-20 lg:h-24 items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-6 lg:px-12 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 lg:hidden"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl lg:text-3xl font-black tracking-tighter uppercase">
                All Reports
              </h1>
              {isOffline && (
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-0.5">⚠ Offline — showing cached data</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleTheme}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <button className="relative hidden sm:grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <BellIcon className="h-5 w-5" />
              {pendingCount > 0 && (
                <span className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full bg-orange-500 ring-4 ring-white dark:ring-slate-950" />
              )}
            </button>
            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
              AD
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="flex items-center gap-4 px-6 lg:px-12 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">Type:</span>
          {["all", "fire", "medical", "others", "flood", "emergency", "crime"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                filterType === t
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                  : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {t === "all" ? "All" : TYPE_STYLES[t]?.label || t}
            </button>
          ))}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">Status:</span>
          {["all", "pending", "responding", "resolved", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                filterStatus === s
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                  : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Reports table */}
        <section className="flex-1 overflow-y-auto p-6 lg:p-12 bg-slate-50/30 dark:bg-slate-950/20">
          <div className="mx-auto max-w-7xl space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-2xl font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">No Reports Found</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Adjust your filters or wait for incoming reports</p>
              </div>
            ) : (
              filtered.map((report) => {
                const typeStyle = TYPE_STYLES[report.emergencyType] || TYPE_STYLES.emergency;
                const statusStyle = STATUS_STYLES[report.status] || STATUS_STYLES.pending;
                const user = report.userId || {};
                const date = new Date(report.createdAt).toLocaleString();

                return (
                  <div
                    key={report._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 transition-all hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none"
                  >
                    <div className="flex items-center gap-5 min-w-0">
                      <div className={`shrink-0 grid h-12 w-12 place-items-center rounded-2xl text-lg ${typeStyle.bg}`}>
                        {typeStyle.label.split(" ")[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                          {report.emergencyType} — {user.fullName || "Unknown User"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 truncate">
                          {date} · Agencies: {(report.notifiedAgencies || [report.assignedAgency]).join(", ")}
                        </p>
                        {report.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 truncate max-w-md">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${statusStyle.bg}`}>
                        <div className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${statusStyle.text}`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;