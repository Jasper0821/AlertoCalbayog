import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

function LandingPage() {
  return (
    <main className="relative min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300">
      <Navbar />

      {/* Hero Section with dotted pattern */}
      <div className="relative flex-1 pt-32 pb-20 px-6 sm:px-10 flex flex-col items-center justify-center">
        {/* Dotted Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

        <div className="relative w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

          {/* Left Column */}
          <div className="flex-1 text-center lg:text-left pt-10">
            <span className="inline-flex items-center gap-2 rounded-md bg-[#ffe8e8] dark:bg-red-900/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#d93025] dark:text-red-400 mb-6">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M9 12l2 2 4-4"></path>
              </svg>
              OFFICIAL GOVERNMENT PORTAL
            </span>

            <h1 className="text-[40px] sm:text-[50px] lg:text-[56px] font-bold leading-[1.1] tracking-tight text-[#0a1e3f] dark:text-white mb-6">
              Calbayog's Unified <br className="hidden lg:block" />
              Emergency Response <br className="hidden lg:block" />
              System
            </h1>

            <p className="text-[17px] leading-relaxed text-[#5f6368] dark:text-slate-400 max-w-xl mx-auto lg:mx-0 mb-10">
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
                className="flex items-center justify-center h-12 px-8 rounded-md bg-white dark:bg-slate-900 border border-[#e5e7eb] dark:border-slate-700 text-[15px] font-bold text-[#0a1e3f] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95 transform w-full sm:w-auto"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Right Column (Image) */}
          <div className="flex-1 w-full max-w-2xl lg:max-w-none">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-200 dark:border-slate-800">
              <img
                src="/command_center.png"
                alt="Emergency Command Center"
                className="w-full h-auto object-cover rounded-2xl block"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200&h=800";
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
