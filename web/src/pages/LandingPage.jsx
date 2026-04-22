
import { useState } from "react";
import { Link } from "react-router-dom";
import { toggleDarkMode } from "../theme";
import { SunIcon, MoonIcon } from "./FireDashboard/icons";

const stats = [
  { value: "24/7", label: "Dispatch-ready" },
  { value: "Live", label: "City alerts" },
  { value: "1 Tap", label: "Report flow" },
];

function LandingPage() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const handleToggleTheme = () => {
    const newState = toggleDarkMode();
    setIsDark(newState);
  };

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300">
      {/* STICKY NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-24 items-center justify-between px-12 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-xl font-black tracking-tighter uppercase whitespace-nowrap"><span className="text-red-600 italic">Alerto</span> Calbayog</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleToggleTheme}
            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            aria-label="Toggle theme"
          >
            {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
          
          <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all px-4 py-3 hidden sm:block">Login</Link>
          <Link to="/register" className="h-12 px-8 rounded-xl bg-slate-900 dark:bg-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center">Register Now</Link>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-8 flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05),transparent_40%)]" />

        <div className="relative w-full max-w-7xl overflow-hidden rounded-[56px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-10 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.1)] sm:p-20 backdrop-blur-3xl transition-colors">
          <header className="mb-12 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              Emergency Response Ops
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 dark:border-emerald-900/30 bg-emerald-px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sector Grid Active
            </span>
          </header>

          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-red-500">
                Calbayog City Fire Dept
              </p>
              <h1 className="font-display text-6xl font-black leading-[0.85] tracking-[-0.08em] sm:text-7xl lg:text-[7.5rem] mb-8 dark:text-white transition-colors">
                <span className="text-red-600 italic">Alerto</span>
                <br />
                <span className="text-slate-900 dark:text-slate-100 transition-colors">Calbayog</span>
              </h1>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-200 leading-tight transition-colors">
                Mission Critical Oversight
              </p>
              <p className="mt-8 max-w-lg text-xl leading-relaxed text-slate-500 dark:text-slate-400 transition-colors">
                A high-precision terminal for rapid alerts, real-time sector tracking, and elite emergency coordination.
              </p>

              <div className="mt-12 flex flex-col gap-4 sm:flex-row">
                <Link
                  className="flex h-16 items-center justify-center rounded-2xl bg-slate-900 dark:bg-white px-12 text-[11px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 shadow-2xl shadow-slate-900/20 transition-all hover:bg-black dark:hover:bg-slate-100 hover:scale-[1.02] active:scale-95"
                  to="/services"
                >
                  View Services
                </Link>
                <Link
                  className="flex h-16 items-center justify-center rounded-2xl border-2 border-slate-900 dark:border-white bg-white dark:bg-transparent px-12 text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white transition-all hover:bg-slate-50 dark:hover:bg-white/5 hover:scale-[1.02] active:scale-95"
                  to="/map"
                >
                  City Grid Map
                </Link>
              </div>

              <div className="mt-16 grid gap-6 sm:grid-cols-3 text-center sm:text-left">
                {stats.map((item) => (
                  <div
                    className="group rounded-3xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-100 dark:hover:shadow-none"
                    key={item.label}
                  >
                    <span className="block text-3xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">
                      {item.value}
                    </span>
                    <span className="mt-2 block text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[580px] rounded-[56px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.1)] transition-colors">
                <div className="mb-8 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full border border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 transition-colors">
                    Live Status
                  </span>
                  <div className="h-3 w-3 animate-pulse rounded-full bg-red-600 shadow-[0_0_0_8px_rgba(239,68,68,0.1)]" />
                </div>

                <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] bg-slate-950">
                  <div
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:60px_60px] opacity-70"
                    aria-hidden="true"
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="h-[200px] w-[200px] rounded-full border border-red-500/20 animate-ping duration-1000" />
                      <div className="absolute inset-0 m-auto h-4 w-4 rounded-full bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.8)]" />
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8 space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-white/10 p-5 backdrop-blur-xl border border-white/5">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current Hazard</p>
                        <p className="text-sm font-bold text-white mt-1">Structure Fire - Sector 01</p>
                      </div>
                      <span className="h-2 w-10 bg-red-600 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LandingPage;
