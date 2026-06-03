export const shellCard ="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.1)] transition-colors duration-300";
export const innerCard ="rounded-2xl border border-slate-100 bg-slate-50/50 transition-all hover:bg-white hover:border-slate-200 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1";
export const pillBase ="inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]";

export const statusChip = {
 neutral:"border-slate-100 bg-slate-50 text-slate-500",
 danger:"border-red-100 bg-red-50 text-red-600",
 success:"border-emerald-100 bg-emerald-50 text-emerald-600",
};

export const incidentChip = {
 fire:"border-red-100 bg-red-50 text-red-600",
 medical:"border-emerald-100 bg-emerald-50 text-emerald-600",
 others:"border-amber-100 bg-amber-50 text-amber-600",
 flood:"border-sky-100 bg-sky-50 text-sky-600",
 emergency:"border-emerald-100 bg-emerald-50 text-emerald-600",
 crime:"border-violet-100 bg-violet-50 text-violet-600",
};

export const iconTone = {
 yellow:"border-red-400/20 bg-red-400/10 text-red-300",
 danger:"border-red-500/20 bg-red-500/10 text-red-100",
 success:"border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
};

// Data placeholders for UI - Reverting to mock data as per user request
export const liveSignals = [
 { id: 1, type:"FIRE", status:"CRITICAL", location:"Sector 01 - Dagum" },
 { id: 2, type:"MEDICAL", status:"STABLE", location:"Sector 03 - Nijaga" },
];

export const profileStats = [
 { label:"Reports Resolved", value:"124" },
 { label:"Active Deployments", value:"3" },
];

export const queueGroups = {
 pending: [
 { id: 101, type:"Fire", location:"Purok 5, Brgy. Hamorawon", intensity:"High" }
 ],
 ongoing: [
 { id: 201, type:"Fire", location:"Public Market Area", assigned:"Engine 01, Ladder 02" },
 { id: 202, type:"Medical", location:"Nijaga Park", assigned:"Ambulance Bravo" }
 ],
 completed: [
 { id: 301, type:"Fire", location:"Rawis Commercial District", assigned:"Engine 05" },
 { id: 302, type:"Rescue", location:"Calbayog River Basin", assigned:"Rescue Team Alpha" }
 ]
};

export const recentReports = [
 { 
 id:"fire-01", 
 emergencyType:"Fire", 
 description:"Residential Fire - Brgy. Obrero",
 location: { name:"Brgy. Obrero", latitude: 12.0722, longitude: 124.5944 }, 
 status:"closed", 
 assignedAgency:"BFP Engine 01",
 createdAt: new Date(Date.now() - 3600000).toISOString() 
 },
 { 
 id:"fire-02", 
 emergencyType:"Fire", 
 description:"Structural Fire - Public Market",
 location: { name:"Public Market", latitude: 12.0655, longitude: 124.5998 }, 
 status:"pending", 
 assignedAgency:"Dispatching...",
 createdAt: new Date(Date.now() - 1800000).toISOString() 
 },
 { 
 id:"fire-03", 
 emergencyType:"Fire", 
 description:"Wildfire Alert - Sector Alpha",
 location: { name:"Purok 2, Hamorawon", latitude: 12.0780, longitude: 124.5850 }, 
 status:"responding", 
 assignedAgency:"DRRMO Team A",
 createdAt: new Date().toISOString() 
 },
];


export const summaryCards = [
 { id:"incidents", label:"Total Reports", value:"48", detail:"Active incidents in city grid" },
 { id:"active", label:"Active Operations", value:"3", detail:"Ongoing fire response units" },
 { id:"completed", label:"Closed Cases", value:"142", detail:"Successfully resolved reports" },
 { id:"units", label:"Deployable Units", value:"12", detail:"Available responder teams" },
];

export const SectionHeader = ({ title, action }) => (
 <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase whitespace-nowrap">
 {title}
 </h2>
 {action ? <div className="shrink-0">{action}</div> : null}
 </div>
);


export function ReportsTable({ detailed = false, data = [] }) {
 return (
 <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm transition-colors">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
 <th className="px-8 py-5">Incident</th>
 <th className="px-8 py-5">Location</th>
 {detailed && <th className="px-8 py-5">Status</th>}
 <th className="px-8 py-5 text-right">Time</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {data.map((report) => (
 <tr className="transition hover:bg-slate-50/50" key={report.id || report._id}>
 <td className="px-8 py-6">
 <span className="text-xs font-black text-slate-900 uppercase">{report.emergencyType ||"Fire Alert"}</span>
 </td>
 <td className="px-8 py-6 text-xs font-bold text-slate-600 uppercase">
 {typeof report.location ==='string' ? report.location : (report.location?.name ||"Sector Alpha")}
 </td>
 {detailed && (
 <td className="px-8 py-6">
 <span className={`${pillBase} ${report.status ==="Open" || report.status ==="Ongoing" ? statusChip.danger : statusChip.success}`}>
 {report.status ||"Open"}
 </span>
 </td>
 )}
 <td className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase text-right">
 {report.createdAt ? new Date(report.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) :"Active"}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 );
}
