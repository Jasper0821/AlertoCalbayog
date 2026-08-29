import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

/* ──────────────────────────────────────────────
 Splash / Loading Screen
 Shows for ~3.2 s then fades out.
────────────────────────────────────────────── */
function SplashScreen({ onDone }) {
  const [statusIdx, setStatusIdx] = useState(0);

  const statusSteps = [
    "Initializing secure connection…",
    "Loading agency modules…",
    "Synchronizing dispatch network…",
    "System ready.",
  ];

  // Cycle through status messages
  useEffect(() => {
    const intervals = [0, 800, 1600, 2200];
    const timers = intervals.map((delay, i) =>
      setTimeout(() => setStatusIdx(i), delay)
    );
    // After animation completes, notify parent
    const doneTimer = setTimeout(onDone, 3300);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className="splash-screen fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#04112b] select-none"
      aria-label="Loading Alerto Calbayog"
      role="status"
    >
      {/* Ambient glow rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="splash-ring w-[520px] h-[520px] rounded-full border border-blue-900/30 absolute" />
        <div
          className="splash-ring w-[360px] h-[360px] rounded-full border border-blue-800/25 absolute"
          style={{ animationDelay: "0.3s" }}
        />
        <div
          className="splash-ring w-[220px] h-[220px] rounded-full border border-blue-700/20 absolute"
          style={{ animationDelay: "0.6s" }}
        />
      </div>

      {/* Center content */}
      <div className="splash-content relative z-10 flex flex-col items-center gap-6 px-8 text-center">

        {/* Logo mark */}
        <div className="relative">
          <img
            src="/logo.png"
            alt="Alerto Calbayog Logo"
            className="w-24 h-24 object-contain drop-shadow-[0_2px_16px_rgba(255,255,255,0.25)]"
          />
          {/* Spinning accent ring around logo */}
          <svg
            className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] animate-spin"
            style={{ animationDuration: "8s" }}
            viewBox="0 0 96 96"
            fill="none"
          >
            <circle
              cx="48" cy="48" r="44"
              stroke="url(#ringGrad)"
              strokeWidth="1"
              strokeDasharray="60 220"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title block */}
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
            Republic of the Philippines
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Alerto Calbayog
          </h1>
          <p className="text-[13px] font-semibold text-slate-400 tracking-wide">
            City Emergency Response &amp; Command System
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-blue-700 to-transparent" />

        {/* Status text */}
        <p className="text-[12px] font-semibold text-slate-400 tracking-widest uppercase h-4 transition-all duration-300">
          {statusSteps[statusIdx]}
        </p>

        {/* Progress bar */}
        <div className="w-64 sm:w-80 h-[3px] rounded-full bg-white/5 overflow-hidden">
          <div className="splash-progress h-full rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 w-0" />
        </div>

        {/* Official seal line */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-5 h-px bg-blue-900" />
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-900">
            Calbayog City Emergency Response System
          </p>
          <div className="w-5 h-px bg-blue-900" />
        </div>
      </div>

      {/* Bottom classification bar */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-blue-900 via-blue-600 to-blue-900" />
    </div>
  );
}

/* ──────────────────────────────────────────────
 Landing Page
────────────────────────────────────────────── */
function LandingPage() {
  const [splashDone, setSplashDone] = useState(() => {
    return sessionStorage.getItem("alerto_calbayog_splash_shown") === "true";
  });

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-[#04112b] font-sans text-white antialiased transition-colors duration-300">

      {/* Splash screen — unmounts after done */}
      {!splashDone && (
        <SplashScreen
          onDone={() => {
            sessionStorage.setItem("alerto_calbayog_splash_shown", "true");
            setSplashDone(true);
          }}
        />
      )}

      <Navbar />

      {/* Hero Section */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 pb-4 pt-20 sm:px-8">
        {/* Full-screen command-center background */}
        <img
          src="/command_center.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#04112b]/80 via-[#0a1e3f]/75 to-[#04112b]/90 pointer-events-none" />
        {/* Subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(4,17,43,0.5) 100%)",
          }}
        />

        <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center">

          {/* Glassmorphic content card */}
          <div className="w-full max-w-2xl text-center backdrop-blur-md bg-white/[0.06] border border-white/[0.1] rounded-2xl px-6 py-10 sm:px-12 sm:py-14 shadow-2xl shadow-black/30">
           

            {/* Heading */}
            <h1 className="mb-5 text-[28px] font-extrabold leading-[1.12] tracking-tight text-white sm:text-[36px] lg:text-[44px]">
              Calbayog&rsquo; City{" "}
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Emergency Response
              </span>{" "}
              <br className="hidden sm:block" />
              System
            </h1>

            {/* Sub-text */}
            <p className="mx-auto mb-8 max-w-lg text-[14px] leading-relaxed text-slate-300 sm:text-[15px] sm:leading-[1.7]">
              Providing the citizens of Calbayog City with a direct, high-speed
              connection to first responders. Real-time monitoring and
              coordinated dispatch for a safer community.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <a
                href="https://github.com/Jasper0821/AlertoCalbayog/releases/latest/download/Alertocalbayogv5.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 h-12 px-7 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[13px] font-bold text-white transition-all duration-200 active:scale-[0.97] transform w-full sm:w-auto shadow-lg shadow-emerald-500/25 group"
              >
                <svg
                  className="w-[18px] h-[18px] fill-current transition-transform group-hover:translate-y-0.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
                </svg>
                <span>Download App for Resident</span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded font-mono font-semibold">
                  APK
                </span>
              </a>             
            </div>

            {/* Info line */}
            <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Mobile App Available &bull; Direct GitHub Release APK Download
              </span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default LandingPage;
