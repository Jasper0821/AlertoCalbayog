import { Link } from "react-router-dom";

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
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-24 items-center justify-between px-12 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <Link to="/" className="flex items-center gap-3 group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/20 transition-transform group-hover:scale-110">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            <p className="text-xl font-black tracking-tighter uppercase"><span className="text-red-600 italic">Alerto</span> Calbayog</p>
        </Link>
        
        <div className="flex items-center gap-4">
            <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all px-6 py-3">Login</Link>
            <Link to="/register" className="h-12 px-8 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-black transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center">Register Now</Link>
        </div>
      </nav>

      <div className="pt-40 pb-20 px-8 flex flex-col items-center">
        <div className="max-w-7xl w-full">
            <header className="mb-20 text-center sm:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-6 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-red-600" />
                    Our Capabilities
                </span>
                <h1 className="font-display text-4xl font-black leading-[0.95] tracking-[-0.06em] text-slate-900 sm:text-7xl lg:text-8xl mb-8">
                    Emergency <span className="text-red-600 italic">Services</span>.
                </h1>
                <p className="max-w-2xl text-xl leading-relaxed text-slate-500">
                    A comprehensive suite of emergency response protocols and digital tracking systems designed for Calbayog's safety and resilience.
                </p>
            </header>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
                {services.map((service, index) => (
                    <div 
                        key={index}
                        className="group relative overflow-hidden rounded-[40px] border border-slate-100 bg-white p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:-translate-y-1"
                    >
                        <div className={`mb-8 grid h-16 w-16 place-items-center rounded-2xl ${service.color} text-white shadow-2xl ${service.shadow} transition-transform group-hover:scale-110`}>
                            {service.icon}
                        </div>
                        <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-4">{service.title}</h3>
                        <p className="text-lg leading-relaxed text-slate-500 mb-8">{service.description}</p>
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
    </main>
  );
}

export default Services;
