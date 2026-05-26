import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Link } from "react-router-dom";

const team = [
  { name: "City Mayor's Office", role: "Executive Oversight", initial: "CM" },
  { name: "CDRRMO Division", role: "Disaster Risk Reduction", initial: "CD" },
  { name: "Bureau of Fire Protection", role: "Fire & Rescue", initial: "BF" },
  { name: "Philippine National Police", role: "Law Enforcement", initial: "PN" },
];

const values = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "Speed",
    desc: "Every second counts. Our platform is built for near-instant communication between citizens and first responders.",
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: "Transparency",
    desc: "Real-time incident status keeps both responders and the public fully informed throughout every emergency.",
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Unity",
    desc: "All city emergency agencies — CDRRMO, BFP, PNP — unified under one coordinated command network.",
  },
];

function About() {
  return (
    <main className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-32 pb-20 px-6 sm:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-md bg-[#ffe8e8] dark:bg-red-900/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#d93025] dark:text-red-400 mb-6">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              About Us
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#0a1e3f] dark:text-white tracking-tight mb-6 leading-tight">
              Built to Protect <br />Calbayog City
            </h1>
            <p className="text-[17px] leading-relaxed text-[#5f6368] dark:text-slate-400 max-w-2xl mx-auto">
              Alerto Calbayog is the official unified emergency response platform of Calbayog City. It was developed to give citizens a direct, high-speed connection to first responders — eliminating communication gaps that cost lives.
            </p>
        </div>
      </div>

      {/* Mission */}
      <div className="bg-[#f8fafc] dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#0a1e3f] dark:text-white mb-5">Our Mission</h2>
            <p className="text-[16px] leading-relaxed text-[#5f6368] dark:text-slate-400 mb-4">
              Our mission is to make Calbayog City one of the safest cities in the Philippines through technology-driven emergency coordination. We believe that every citizen deserves a fast, reliable way to call for help.
            </p>
            <p className="text-[16px] leading-relaxed text-[#5f6368] dark:text-slate-400">
              By unifying CDRRMO, BFP, and PNP under one digital platform, we reduce response times, improve dispatch accuracy, and provide real-time visibility into every active incident.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Average Response Time", value: "10 Min" },
              { label: "Active Monitoring", value: "24/7" },
              { label: "City Coverage", value: "100%" },
              { label: "Partner Agencies", value: "3+" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center">
                <div className="text-3xl font-black text-[#0a1e3f] dark:text-white mb-2">{stat.value}</div>
                <div className="text-[11px] font-black uppercase tracking-widest text-[#5f6368] dark:text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0a1e3f] dark:text-white mb-12 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#0a1e3f] text-white flex items-center justify-center mb-5">
                  {v.icon}
                </div>
                <h3 className="text-lg font-bold text-[#0a1e3f] dark:text-white mb-2">{v.title}</h3>
                <p className="text-[15px] text-[#5f6368] dark:text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Partner Agencies */}
      <div className="bg-[#f8fafc] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0a1e3f] dark:text-white mb-3 text-center">Our Partner Agencies</h2>
          <p className="text-[#5f6368] dark:text-slate-400 text-center mb-12 text-[16px]">Working together to keep every citizen safe.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map((t) => (
              <div key={t.name} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-[#0a1e3f] text-white font-black text-lg flex items-center justify-center mb-4">
                  {t.initial}
                </div>
                <h3 className="text-[15px] font-bold text-[#0a1e3f] dark:text-white mb-1">{t.name}</h3>
                <p className="text-[12px] font-semibold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>


      <Footer />
    </main>
  );
}

export default About;
