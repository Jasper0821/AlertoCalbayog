import { useState, useEffect } from"react";
import { Link } from"react-router-dom";
import { Navbar } from"../components/Navbar";
import { Footer } from"../components/Footer";

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
 style={{ animationDelay:"0.3s" }}
 />
 <div
 className="splash-ring w-[220px] h-[220px] rounded-full border border-blue-700/20 absolute"
 style={{ animationDelay:"0.6s" }}
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
 style={{ animationDuration:"8s" }}
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
 return sessionStorage.getItem("alerto_calbayog_splash_shown") ==="true";
 });

 return (
 <main className="relative min-h-screen flex flex-col bg-white font-sans text-slate-900 antialiased transition-colors duration-300">

 {/* Splash screen — unmounts after done */}
 {!splashDone && (
 <SplashScreen
 onDone={() => {
 sessionStorage.setItem("alerto_calbayog_splash_shown","true");
 setSplashDone(true);
 }}
 />
 )}

 <Navbar />

 {/* Hero Section with dotted pattern */}
 <div className="relative flex-1 pt-32 pb-20 px-6 sm:px-10 flex flex-col items-center justify-center">
 {/* Dotted Background */}
 <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

 <div className="relative w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

 {/* Left Column */}
 <div className="flex-1 text-center lg:text-left pt-10">
 <h1 className="text-[40px] sm:text-[50px] lg:text-[56px] font-bold leading-[1.1] tracking-tight text-[#0a1e3f] mb-6">
 Calbayog's Unified <br className="hidden lg:block" />
 Emergency Response <br className="hidden lg:block" />
 System
 </h1>

 <p className="text-[17px] leading-relaxed text-[#5f6368] max-w-xl mx-auto lg:mx-0 mb-10">
 Providing the citizens of Calbayog City with a direct, high-speed connection to first responders. Real-time monitoring and coordinated dispatch for a safer community.
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
 <Link
 to="/register"
 className="flex items-center justify-center gap-2 h-12 px-8 rounded-md bg-[#0a1e3f] text-[15px] font-bold text-white hover:bg-[#07152c] transition-all duration-150 active:scale-95 transform w-full sm:w-auto shadow-lg shadow-[#0a1e3f]/20"
 >
 Register for Alerts
 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <line x1="5" y1="12" x2="19" y2="12"></line>
 <polyline points="12 5 19 12 12 19"></polyline>
 </svg>
 </Link>
 <Link
 to="/about"
 className="flex items-center justify-center h-12 px-8 rounded-md bg-white border border-[#e5e7eb] text-[15px] font-bold text-[#0a1e3f] hover:bg-slate-50 transition-all duration-150 active:scale-95 transform w-full sm:w-auto"
 >
 Learn More
 </Link>
 </div>
 </div>

 {/* Right Column (Image) */}
 <div className="flex-1 w-full max-w-2xl lg:max-w-none">
 <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-200">
 <img
 src="/command_center.png"
 alt="Emergency Command Center"
 className="w-full h-auto object-cover rounded-2xl block"
 onError={(e) => {
 e.target.onerror = null;
 e.target.src ="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200&h=800";
 }}
 />
 </div>
 </div>

 </div>
 </div>

 <Footer />
 </main>
 );
}

export default LandingPage;
