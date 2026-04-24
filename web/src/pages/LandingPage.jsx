
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
    <main className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300">
      <Navbar />

      <div className="flex-1 pt-32 pb-20 px-8 flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05),transparent_40%)]" />

        <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 sm:p-10 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.1)] backdrop-blur-3xl transition-colors">
          <header className="mb-12 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-5 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              Emergency Response Ops
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 dark:border-emerald-900/30 bg-emerald-px-5 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sector Grid Active
            </span>
          </header>

          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-red-500">
                Calbayog City Fire Dept
              </p>
              <h1 className="font-display text-5xl font-black leading-[0.85] tracking-[-0.08em] sm:text-6xl lg:text-7xl mb-8 dark:text-white transition-colors">
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
                  className="flex h-12 items-center justify-center rounded-xl bg-slate-900 dark:bg-white px-8 text-xs font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 transition-all hover:bg-black dark:hover:bg-slate-100 hover:scale-[1.02] active:scale-95"
                  to="/services"
                >
                  View Services
                </Link>
                <Link
                  className="flex h-12 items-center justify-center rounded-xl border-2 border-slate-900 dark:border-white bg-white dark:bg-transparent px-8 text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white transition-all hover:bg-slate-50 dark:hover:bg-white/5 hover:scale-[1.02] active:scale-95"
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
                    <span className="mt-2 block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[480px] rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.1)] transition-colors">
                <div className="mb-8 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full border border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 transition-colors">
                    Live Status
                  </span>
                  <div className="h-3 w-3 animate-pulse rounded-full bg-red-600 shadow-[0_0_0_8px_rgba(239,68,68,0.1)]" />
                </div>

                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-950">
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
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Current Hazard</p>
                        <p className="text-sm font-bold text-white mt-1">Emergency Response</p>
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
      <Footer />
    </main>
  );
}

export default LandingPage;
