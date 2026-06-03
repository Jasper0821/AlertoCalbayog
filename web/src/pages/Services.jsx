import { Navbar } from"../components/Navbar";
import { Footer } from"../components/Footer";
import { Link } from"react-router-dom";

const services = [
 {
 icon: (
 <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
 </svg>
 ),
 title:"CDRRMO",
 subtitle:"City Disaster Risk Reduction",
 description:"Coordinated disaster risk reduction and management for all natural and man-made hazards across Calbayog City.",
 tag:"Disaster Response",
 color:"text-blue-700",
 tagColor:"bg-blue-50 text-blue-700 border-blue-200",
 },
 {
 icon: (
 <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
 <polyline points="9 22 9 12 15 12 15 22" />
 </svg>
 ),
 title:"BFP",
 subtitle:"Bureau of Fire Protection",
 description:"24/7 fire suppression, emergency rescue, and fire safety enforcement across all barangays.",
 tag:"Fire Emergency",
 color:"text-red-600",
 tagColor:"bg-red-50 text-red-600 border-red-200",
 },
 {
 icon: (
 <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <circle cx="12" cy="12" r="10" />
 <line x1="12" y1="8" x2="12" y2="12" />
 <line x1="12" y1="16" x2="12.01" y2="16" />
 </svg>
 ),
 title:"PNP",
 subtitle:"Philippine National Police",
 description:"Law enforcement, crime prevention, and public safety operations for all citizens of Calbayog.",
 tag:"Law Enforcement",
 color:"text-indigo-700",
 tagColor:"bg-indigo-50 text-indigo-700 border-indigo-200",
 },
 {
 icon: (
 <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
 </svg>
 ),
 title:"Medical Response",
 subtitle:"Emergency Medical Services",
 description:"Rapid medical response, ambulance dispatch, and coordination with hospitals for life-saving care.",
 tag:"Medical",
 color:"text-emerald-700",
 tagColor:"bg-emerald-50 text-emerald-700 border-emerald-200",
 },
 {
 icon: (
 <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <polygon points="3 11 22 2 13 21 11 13 3 11" />
 </svg>
 ),
 title:"Incident Reporting",
 subtitle:"Real-Time Alert System",
 description:"Citizens can report emergencies instantly using the platform, ensuring immediate dispatch and coordination.",
 tag:"Citizen Alert",
 color:"text-orange-600",
 tagColor:"bg-orange-50 text-orange-600 border-orange-200",
 },
 {
 icon: (
 <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
 <circle cx="12" cy="10" r="3" />
 </svg>
 ),
 title:"City Grid Map",
 subtitle:"Live Incident Mapping",
 description:"Real-time geospatial tracking of all active incidents, unit positions, and hazard zones across the city.",
 tag:"Monitoring",
 color:"text-purple-700",
 tagColor:"bg-purple-50 text-purple-700 border-purple-200",
 },
];

function Services() {
 return (
 <main className="min-h-screen flex flex-col bg-white font-sans text-slate-900 antialiased">
 <Navbar />

 {/* Hero */}
 <div className="relative pt-32 pb-16 px-6 sm:px-10">
 <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
 <div className="relative max-w-7xl mx-auto text-center">
 <span className="inline-flex items-center gap-2 rounded-md bg-[#ffe8e8] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#d93025] mb-6">
 <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
 </svg>
 Emergency Services
 </span>
 <h1 className="text-4xl sm:text-5xl font-bold text-[#0a1e3f] tracking-tight mb-4">
 Our Response Services
 </h1>
 <p className="text-[17px] text-[#5f6368] max-w-2xl mx-auto">
 Alerto Calbayog connects you to all city emergency services in one unified platform — faster, smarter, and always available.
 </p>
 </div>
 </div>

 {/* Services Grid */}
 <div className="flex-1 pb-20 px-6 sm:px-10">
 <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {services.map((svc) => (
 <div
 key={svc.title}
 className="group relative bg-white border border-slate-200 rounded-2xl p-7 hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1 transition-all duration-300"
 >
 <div className={`mb-4 ${svc.color}`}>{svc.icon}</div>
 <span className={`inline-block rounded-full border px-3 py-0.5 text-[10px] font-black uppercase tracking-widest mb-4 ${svc.tagColor}`}>
 {svc.tag}
 </span>
 <h2 className="text-xl font-bold text-[#0a1e3f] mb-1">{svc.title}</h2>
 <p className="text-[13px] font-semibold text-slate-500 mb-3">{svc.subtitle}</p>
 <p className="text-[15px] text-[#5f6368] leading-relaxed">{svc.description}</p>
 </div>
 ))}
 </div>
 </div>



 <Footer />
 </main>
 );
}

export default Services;
