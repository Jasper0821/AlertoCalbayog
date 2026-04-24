import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const stats = [
  { value: "24/7", label: "Dispatch-ready" },
  { value: "Live", label: "City alerts" },
  { value: "1 Tap", label: "Report flow" },
];

function LandingPage() {
  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-8 flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05),transparent_40%)]" />

        <div className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 sm:p-10 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.1)] backdrop-blur-3xl transition-colors">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-2 sm:px-5 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              Emergency Response Ops
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2 sm:px-5 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sector Grid Active
            </span>
          </header>

          <div className="grid items-center gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-red-500">
                Calbayog City Emergency Response
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.05em] mb-4 dark:text-white transition-colors leading-[1.1]">
                <span className="text-red-600 italic">Alerto</span>
                <span className="text-slate-900 dark:text-slate-100 ml-3 transition-colors uppercase">Calbayog</span>
              </h1>
              <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight transition-colors">
                Mission Critical Oversight Terminal
              </p>
              <p className="mt-6 max-w-md text-xs sm:text-sm font-bold leading-relaxed text-slate-500 dark:text-slate-400 transition-colors">
                A high-precision interface for rapid alerts, real-time sector tracking, and elite emergency coordination across the city grid.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  className="flex h-12 w-full sm:w-auto items-center justify-center rounded-xl bg-slate-900 dark:bg-white px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 shadow-2xl shadow-slate-900/20 transition-all hover:bg-black dark:hover:bg-slate-100 hover:scale-[1.02] active:scale-95"
                  to="/services"
                >
                  View Services
                </Link>
                <Link
                  className="flex h-12 w-full sm:w-auto items-center justify-center rounded-xl border-2 border-slate-600 dark:border-white bg-white dark:bg-transparent px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white transition-all hover:bg-slate-50 dark:hover:bg-white/5 hover:scale-[1.02] active:scale-95"
                  to="/map"
                >
                  City Grid Map
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((item) => (
                  <div
                    className="group rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-100 dark:hover:shadow-none"
                    key={item.label}
                  >
                    <span className="block text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">
                      {item.value}
                    </span>
                    <span className="mt-1 block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center lg:mt-0 mt-8">
              <div className="relative w-full max-w-[500px] rounded-[40px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.1)] transition-colors">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Live Operations</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Status: Operational</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-3 w-1 rounded-full ${i <= 4 ? 'bg-red-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    ))}
                  </div>
                </div>

                <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-slate-950">
                  <div
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:40px_40px] sm:bg-[length:60px_60px] opacity-70"
                    aria-hidden="true"
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Scanning Radar Lines */}
                      <div className="absolute inset-0 h-[200px] w-[200px] sm:h-[280px] sm:w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-500/10 animate-[spin_4s_linear_infinite]" />
                      <div className="absolute inset-0 h-[200px] w-[200px] sm:h-[280px] sm:w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border-t border-red-500/40 animate-[spin_3s_linear_infinite]" />

                      {/* Circular Grids */}
                      <div className="h-[180px] w-[180px] sm:h-[240px] sm:w-[240px] rounded-full border border-white/5" />
                      <div className="absolute inset-0 m-auto h-[120px] w-[120px] sm:h-[160px] sm:w-[160px] rounded-full border border-white/5" />
                      <div className="absolute inset-0 m-auto h-[60px] w-[60px] sm:h-[80px] sm:w-[80px] rounded-full border border-white/5" />

                      {/* Center Point */}
                      <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-red-600 shadow-[0_0_20px_rgba(239,68,68,1)]" />

                      {/* Blips */}
                      <div className="absolute top-1/4 left-1/3 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      <div className="absolute bottom-1/3 right-1/4 h-1 w-1 rounded-full bg-emerald-500 animate-pulse delay-700" />
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-4 backdrop-blur-md border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Sector Delta Sync</span>
                      </div>
                      <span className="text-[9px] font-black text-white font-mono">0.42ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default LandingPage;
