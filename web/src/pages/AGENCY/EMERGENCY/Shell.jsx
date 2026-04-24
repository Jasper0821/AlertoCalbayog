import { useState } from "react";
import { Link } from "react-router-dom";
import { BellIcon, BoltIcon, LogoutIcon, DashboardIcon, MapIcon, ReportIcon, QueueIcon, ProfileIcon, MenuIcon, SunIcon, MoonIcon } from "../FIRE/icons.jsx";
import { toggleDarkMode } from "../../../theme.js";

const navigation = [
  { id: "dashboard", label: "Dashboard", meta: "Overview and live status", icon: DashboardIcon },
  { id: "map-report", label: "Map Report", meta: "Pins and incident heat", icon: MapIcon },
  { id: "reported-incidents", label: "Reported Incidents", meta: "Incident log and filters", icon: ReportIcon },
  { id: "queuing", label: "Queuing", meta: "Ongoing and completed", icon: QueueIcon },
  { id: "profile", label: "Profile", meta: "Account and shift details", icon: ProfileIcon },
];

function Shell({ activeSection, onNavigate, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const handleToggleTheme = () => {
    const newState = toggleDarkMode();
    setIsDark(newState);
  };

  const handleNavigation = (e, id) => {
    onNavigate(e, id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased overflow-hidden relative transition-colors duration-300">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-[40] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[50] flex w-[300px] flex-col bg-slate-50 dark:bg-slate-900/50 dark:backdrop-blur-xl border-r border-slate-100 dark:border-slate-800 transition-all duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-4 px-8 py-10">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20">
            <BoltIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-display text-xl font-black tracking-[-0.03em] uppercase"><span className="text-emerald-600 italic">Alerto</span> Calbayog</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 font-sans">EMS Center</p>
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
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-none border border-slate-100 dark:border-slate-700"
                    : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 transition-colors"}`} />
                  <span className="text-[11px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                </div>
                <span className={`mt-1.5 text-[9px] font-bold leading-relaxed ml-8 text-left uppercase tracking-widest ${isActive ? "text-slate-500 dark:text-slate-400" : "text-slate-300 dark:text-slate-600"}`}>
                  {item.meta}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="px-6 py-8">
          <Link
            to="/"
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-600/20"
          >
            <LogoutIcon className="h-4 w-4" />
            Terminal Exit
          </Link>
        </div>
      </aside>

      <main className="flex-1 relative flex flex-col overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
        <header className="flex h-20 lg:h-24 items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-6 lg:px-12 z-20 shrink-0">
          <div className="flex items-center gap-4 lg:gap-8">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white lg:hidden"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <div className="min-w-0">
               <h1 className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase whitespace-nowrap">
                {navigation.find(n => n.id === activeSection)?.label || "Operations"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button 
              onClick={handleToggleTheme}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            <button className="relative hidden sm:grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-slate-950" />
            </button>
            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden xl:block">
                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">EMS Lead</p>
                <p className="mt-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Active Shift</p>
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-[10px] font-black text-white shadow-xl shadow-emerald-600/10">
                EM
              </div>
            </div>
          </div>
        </header>

        <section className={`flex-1 p-6 lg:p-12 ${activeSection === "map-report" ? "overflow-hidden" : "overflow-y-auto"} bg-slate-50/30 dark:bg-slate-950/20 transition-colors`}>
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Shell;
