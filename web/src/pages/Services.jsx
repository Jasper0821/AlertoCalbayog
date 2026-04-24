import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const services = [
  {
    title: "Emergency Fire Response",
    description: "24/7 dedicated fire suppression and technical rescue operations with high-precision coordination.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
        <path d="M8 16c0 1.1.9 2 2 2s2-.9 2-2M18 8c0 1.1-.9 2-2 2s-2-.9-2-2M12 4v4m0 8v4M4 12h4m8 0h4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "bg-red-600",
    shadow: "shadow-red-600/20"
  },
  {
    title: "Medical Assistance",
    description: "Rapid medical response and ambulance dispatch for critical healthcare emergencies city-wide.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
        <path d="M19 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3H5C3.34 2 2 3.34 2 5v6c0 1.66 1.34 3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 2v20M2 12h20" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "bg-emerald-600",
    shadow: "shadow-emerald-600/20"
  },
  {
    title: "Incident Tracking",
    description: "Real-time monitoring and reporting system to keep citizens informed and responders synchronized.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "bg-blue-600",
    shadow: "shadow-blue-600/20"
  },
  {
    title: "Disaster Coordination",
    description: "Centralized command for large-scale disaster management and city-wide evacuation alerts.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
        <path d="M12 2L2 7l10 5 10-5-10-5Z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "bg-orange-600",
    shadow: "shadow-orange-600/20"
  }
];

function Services() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300">
      <Navbar />

      <div className="pt-28 pb-12 px-8 flex flex-col items-center">
        <div className="max-w-7xl w-full">
            <header className="mb-12 text-center sm:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 mb-4 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-red-600" />
                    Capabilities
                </span>
                <h1 className="font-display text-lg font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-4">
                    Emergency <span className="text-red-600 italic">Services</span> Hub
                </h1>
                <p className="max-w-2xl text-sm font-bold leading-relaxed text-slate-500 dark:text-slate-400">
                    A comprehensive suite of emergency response protocols designed for city safety.
                </p>
            </header>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {services.map((service, index) => (
                    <div 
                        key={index}
                        className="group relative overflow-hidden rounded-[24px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:-translate-y-1"
                    >
                        <div className={`mb-6 grid h-12 w-12 place-items-center rounded-xl ${service.color} text-white shadow-2xl ${service.shadow} transition-transform group-hover:scale-110`}>
                            {service.icon}
                        </div>
                        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-3">{service.title}</h3>
                        <p className="text-sm font-bold leading-relaxed text-slate-500 dark:text-slate-400 mb-6">{service.description}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Learn more
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default Services;
