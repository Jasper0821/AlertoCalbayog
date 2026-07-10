import { useState } from "react";
import { Link } from "react-router-dom";
import { BellIcon, BoltIcon, LogoutIcon, DashboardIcon, MapIcon, ReportIcon, QueueIcon, ProfileIcon, MenuIcon } from "./CDRRMO/icons.jsx";

const navigation = [
  { id: "dashboard", label: "Dashboard", meta: "Overview and live status", icon: DashboardIcon },
  { id: "map-report", label: "Map Report", meta: "Pins and incident heat", icon: MapIcon },
  { id: "reported-incidents", label: "Reported Incidents", meta: "Incident log and filters", icon: ReportIcon },
  { id: "queuing", label: "Queuing", meta: "Ongoing and completed", icon: QueueIcon },
  { id: "profile", label: "Profile", meta: "Account and shift details", icon: ProfileIcon },
];

/* ── Agency Theme Configs ─────────────────────────────────── */
const AGENCY_THEMES = {
  BFP: {
    accent: "red-600",
    label: "BFP Command Center",
    initials: "BF",
    roleLabel: "BFP Lead",
    shadow: "red-600",
  },
  CDRRMO: {
    accent: "emerald-600",
    label: "CDRRMO Center",
    initials: "CD",
    roleLabel: "CDRRMO Lead",
    shadow: "emerald-600",
  },
  PNP: {
    accent: "violet-600",
    label: "PNP Center",
    initials: "PN",
    roleLabel: "PNP Lead",
    shadow: "violet-600",
  },
};

/* Fallback for unknown agencies */
const DEFAULT_THEME = {
  accent: "sky-600",
  label: "Command Center",
  initials: "AC",
  roleLabel: "Ops Lead",
  shadow: "sky-600",
};

function AgencyShell({ activeSection, onNavigate, children, agency = "CDRRMO" }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const theme = AGENCY_THEMES[agency] || DEFAULT_THEME;

  const handleNavigation = (e, id) => {
    onNavigate(e, id);
    setIsSidebarOpen(false);
  };

  /* ── Dynamic accent color CSS classes ─────────────────── */
  const accentBg = `bg-${theme.accent}`;
  const accentText = `text-${theme.accent}`;
  const accentShadow = `shadow-${theme.shadow}/20`;
  const accentHoverBg = `hover:bg-${theme.accent}`;
  const accentHoverText = `hover:text-white`;
  const accentHoverBorder = `hover:border-${theme.accent}`;
  const accentHoverShadow = `hover:shadow-xl hover:shadow-${theme.shadow}/20`;

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const fullName = user.fullName || "Marcus Robb";
  const roleLabel = user.role === "admin" ? "Admin Manager" : theme.roleLabel;

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900 antialiased overflow-hidden relative transition-colors duration-300">
      {/* SIDEBAR OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[40] bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-[50] flex w-[300px] flex-col bg-slate-50 border-r border-slate-100 transition-all duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-4 px-8 py-10">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl ${accentBg} shadow-lg ${accentShadow}`}>
            <BoltIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-display text-xl font-black tracking-[-0.03em] uppercase">
              <span className={`${accentText} italic`}>Alerto</span> Calbayog
            </p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500 font-sans">{theme.label}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 overflow-y-auto scrollbar-hide">
          {navigation.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={(e) => handleNavigation(e, item.id)}
                className={`group flex w-full flex-col rounded-[24px] px-6 py-5 transition-all ${
                  isActive
                    ? "bg-white text-slate-900 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100"
                    : "text-slate-500 hover:bg-white hover:text-slate-900 focus:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${isActive ? accentText : `text-slate-400 group-hover:${accentText} transition-colors`}`} />
                  <span className="text-[11px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                </div>
                <span className={`mt-1.5 text-[9px] font-bold leading-relaxed ml-8 text-left uppercase tracking-widest ${isActive ? "text-slate-500" : "text-slate-300"}`}>
                  {item.meta}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="px-6 py-8">
          <Link
            to="/"
            className={`flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white border border-slate-100 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all ${accentHoverBg} ${accentHoverText} ${accentHoverBorder} ${accentHoverShadow}`}
          >
            <LogoutIcon className="h-4 w-4" />
            Terminal Exit
          </Link>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-white transition-colors duration-300">
        <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white/85 backdrop-blur-md px-6 lg:px-12 z-20 shrink-0">
          <div className="flex items-center gap-4 lg:gap-8">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 border border-slate-100 text-slate-900 lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            
            {/* Search Box template */}
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search Products"
                className="h-10 w-44 sm:w-60 rounded-xl bg-slate-50 border border-transparent pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-200 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell template */}
            <button className="relative grid h-10 w-10 place-items-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 transition-all">
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-3.5 top-3.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>

            {/* Profile template */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden border border-slate-100 flex items-center justify-center text-xs font-black text-slate-500 shadow-sm shrink-0">
                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-left hidden sm:block leading-none">
                <p className="text-xs font-bold text-slate-800">{fullName}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-1">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <section className={`flex-1 p-6 lg:p-12 ${activeSection === "map-report" ? "overflow-hidden" : "overflow-y-auto"} bg-slate-50/30 transition-colors`}>
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AgencyShell;
