import { Link } from "react-router-dom";
import { cn } from "../lib/cn.js";

const stats = [
  { value: "24/7", label: "Dispatch-ready" },
  { value: "Live", label: "City alerts" },
  { value: "1 Tap", label: "Report flow" },
];

function LandingPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(239,68,68,0.22)_0%,_rgba(239,68,68,0.06)_40%,_transparent_72%)] blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_0%,_rgba(255,255,255,0.03)_40%,_transparent_72%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-zinc-950/90 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-stone-200/80">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_6px_rgba(239,68,68,0.12)]" />
            Emergency Response System
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-red-200">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]" />
            Ready 24/7
          </span>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="pr-0 lg:pr-6">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-red-400">
              Calbayog City
            </p>
            <h1 className="font-display text-5xl font-bold leading-[0.92] tracking-[-0.06em] text-stone-50 sm:text-6xl lg:text-[5.8rem]">
              Alerto Calbayog
            </h1>
            <p className="mt-4 text-xl font-semibold text-red-100 sm:text-[1.55rem]">
              Your Safety, One Tap Away
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-stone-300 sm:text-base">
              A clean entry point for fast alerts, clear reporting, and coordinated response when every second matters.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-b from-red-300 to-red-500 px-6 font-bold text-stone-900 shadow-[0_16px_30px_rgba(239,68,68,0.24)] transition hover:-translate-y-0.5"
                to="/login"
              >
                Login
              </Link>
              <Link
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-red-500/70 bg-gradient-to-b from-red-800 to-red-900 px-6 font-bold text-white shadow-[0_14px_26px_rgba(127,29,29,0.28)] transition hover:-translate-y-0.5 hover:border-red-400 hover:from-red-700 hover:to-red-600"
                to="/register"
              >
                Register
              </Link>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 shadow-[0_16px_24px_rgba(0,0,0,0.16)]"
                  key={item.label}
                >
                  <span className="block text-base font-extrabold tracking-[-0.03em] text-stone-50">
                    {item.value}
                  </span>
                  <span className="mt-1 block text-sm text-stone-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-h-[420px] items-center justify-center lg:min-h-[480px]">
            <div className="w-full max-w-[540px] rounded-[34px] border border-white/10 bg-zinc-950/95 p-4 shadow-[0_25px_70px_rgba(0,0,0,0.45)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-[0.04em] text-stone-100">
                  Live map
                </span>
                <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold tracking-[0.04em] text-red-100">
                  Alert route
                </span>
              </div>

              <div
                className="relative aspect-square overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_70%_35%,rgba(239,68,68,0.12),transparent_30%),radial-gradient(circle_at_20%_70%,rgba(255,255,255,0.05),transparent_35%),linear-gradient(180deg,rgba(16,16,16,0.92),rgba(7,7,7,0.98))]"
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:58px_58px] opacity-70"
                  aria-hidden="true"
                />
                <span className="absolute left-4 top-4 z-10 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold tracking-[0.04em] text-stone-100">
                  Calbayog City
                </span>
                <span className="absolute left-[71%] top-[30%] h-[110px] w-[110px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-500/50 shadow-[0_0_0_18px_rgba(239,68,68,0.06)] animate-pulse" />

                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 560 560"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="routeStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
                      <stop offset="45%" stopColor="#f6f4ef" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.95" />
                    </linearGradient>
                    <radialGradient id="glow" cx="50%" cy="48%" r="55%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                      <stop offset="70%" stopColor="#ef4444" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="560" height="560" fill="none" />
                  <circle cx="414" cy="170" r="150" fill="url(#glow)" />
                  <path
                    d="M56 392 C 118 322, 160 328, 212 288 S 330 214, 402 176 S 482 128, 524 102"
                    fill="none"
                    stroke="url(#routeStroke)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M56 392 C 118 322, 160 328, 212 288 S 330 214, 402 176 S 482 128, 524 102"
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.12"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="56" cy="392" r="9" fill="#ef4444" />
                  <circle cx="212" cy="288" r="9" fill="#ef4444" />
                  <circle cx="402" cy="176" r="9" fill="#ef4444" />
                  <g transform="translate(408 164)">
                    <path
                      d="M0 -36 C 17 -36 31 -22 31 -5 C 31 17 15 33 0 56 C -15 33 -31 17 -31 -5 C -31 -22 -17 -36 0 -36 Z"
                      fill="#ef4444"
                    />
                    <circle cx="0" cy="-6" r="12" fill="#0b0b0b" />
                    <circle cx="0" cy="-6" r="5" fill="#ffffff" />
                  </g>
                  <path
                    d="M0 446 H30 V408 H58 V486 H86 V364 H116 V438 H148 V398 H178 V500 H210 V402 H242 V458 H274 V336 H308 V500 H340 V426 H370 V384 H396 V500 H426 V418 H456 V452 H490 V404 H530 V440 H560 V560 H0 Z"
                    fill="#111111"
                  />
                  <path d="M0 446 H560" stroke="#ffffff" strokeOpacity="0.06" />
                </svg>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300/70">
                <span>Responder network online</span>
                <span>One-tap emergency flow</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LandingPage;
