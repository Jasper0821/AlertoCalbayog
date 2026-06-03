import { useEffect, useState } from"react";
import { Link } from"react-router-dom";
import api from"../../api/axios.js";

/* ── Status helpers ──────────────────────────────────────── */
const STATUS_STYLES = {
 pending: { dot:"bg-amber-400", text:"text-amber-600", label:"Pending" },
 responding: { dot:"bg-blue-500", text:"text-blue-600", label:"Responding" },
 resolved: { dot:"bg-emerald-500", text:"text-emerald-600", label:"Resolved" },
 closed: { dot:"bg-slate-400", text:"text-slate-500", label:"Closed" },
 ongoing: { dot:"bg-orange-500", text:"text-orange-600", label:"Ongoing" },
 cancelled: { dot:"bg-red-400", text:"text-slate-500", label:"Cancelled" },
};

const PRIORITY_STYLES = {
 critical:"bg-red-500 text-white",
 high:"bg-orange-500 text-white",
 medium:"bg-yellow-400 text-slate-900",
 low:"bg-emerald-500 text-white",
};

const TYPE_ICONS = {
 fire: { icon:"🔥", label:"Fire", color:"text-red-500" },
 medical: { icon:"🏥", label:"Medical", color:"text-emerald-500" },
 police: { icon:"🚔", label:"Police", color:"text-blue-500" },
 crime: { icon:"🚔", label:"Police", color:"text-blue-500" },
 flood: { icon:"🌊", label:"Flood", color:"text-sky-500" },
 disaster: { icon:"⚠️", label:"Disaster", color:"text-amber-500" },
 emergency: { icon:"🚨", label:"Emergency", color:"text-orange-500" },
 others: { icon:"📋", label:"Others", color:"text-slate-500" },
};

function getPriority(report) {
 const type = (report.emergencyType ||"").toLowerCase();
 if (type ==="fire") return"critical";
 if (type ==="medical") return"high";
 if (type ==="flood" || type ==="disaster") return"high";
 if (type ==="crime" || type ==="police") return"medium";
 return"medium";
}

function getIncidentId(report, index) {
 const d = report.createdAt ? new Date(report.createdAt) : new Date();
 const yr = d.getFullYear();
 const n = String(index + 100 - index + (index % 10 === 0 ? 100 : index)).padStart(3,"0");
 return`INC-${yr}-0${String(90 - index % 9).padStart(2,"0")}`;
}

/* ── Sidebar nav items ───────────────────────────────────── */
const NAV = [
 { id:"dashboard", label:"Dashboard", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
 { id:"emergency-reports",label:"Emergency Reports",icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg> },
 { id:"active-incidents", label:"Active Incidents", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
 { id:"dispatch", label:"Dispatch Center", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg> },
 { id:"live-map", label:"Live Map", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
 { id:"notifications", label:"Notifications", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg> },
 { id:"incident-history", label:"Incident History", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
 { id:"analytics", label:"Analytics", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
];

/* ── MOCK data for when API is offline ──────────────────── */
const MOCK_REPORTS = [
 { _id:"m1", emergencyType:"fire", userId: { fullName:"Juan Dela Cruz", phoneNumber:"0917-123-4567" }, location: { name:"Brgy. Hamorawon, St. Peter St." }, status:"pending", createdAt: new Date(Date.now() - 1800000).toISOString() },
 { _id:"m2", emergencyType:"medical", userId: { fullName:"Maria Santos", phoneNumber:"0920-987-6543" }, location: { name:"Calbayog Public Market" }, status:"responding", createdAt: new Date(Date.now() - 3600000).toISOString() },
 { _id:"m3", emergencyType:"police", userId: { fullName:"Robert Wilson", phoneNumber:"0998-555-0199" }, location: { name:"Magsaysay Blvd, Near Bank" }, status:"resolved", createdAt: new Date(Date.now() - 7200000).toISOString() },
 { _id:"m4", emergencyType:"medical", userId: { fullName:"Elena Gilbert", phoneNumber:"0912-333-4444" }, location: { name:"Samar State University Campus" }, status:"cancelled", createdAt: new Date(Date.now() - 9000000).toISOString() },
 { _id:"m5", emergencyType:"disaster",userId: { fullName:"Barangay Hall", phoneNumber:"055-123-1234" }, location: { name:"Brgy. Nijaga, Waterfront" }, status:"ongoing", createdAt: new Date(Date.now() - 1200000).toISOString() },
];

function AdminDashboard() {
 const [reports, setReports] = useState([]);
 const [isOffline, setIsOffline] = useState(false);
 const [activeNav, setActiveNav] = useState("emergency-reports");
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [filterType, setFilterType] = useState("all");
 const [filterStatus, setFilterStatus] = useState("all");
 const [searchQuery, setSearchQuery] = useState("");

 /* Current logged-in user info from localStorage */
 const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user") ||"{}"); } catch { return {}; } })();
 const userName = storedUser.fullName || storedUser.name ||"Admin";
 const userInitials = userName.split("").map(w => w[0]).join("").toUpperCase().slice(0, 2) ||"AD";

 useEffect(() => {
 const fetchReports = async () => {
 try {
 const res = await api.get("/emergency");
 setReports(res.data);
 setIsOffline(false);
 } catch {
 setIsOffline(true);
 setReports(MOCK_REPORTS);
 }
 };
 fetchReports();
 const iv = setInterval(fetchReports, 10000);
 return () => clearInterval(iv);
 }, []);

 const filtered = reports.filter(r => {
 const type = (r.emergencyType ||"").toLowerCase();
 const status = (r.status ||"").toLowerCase();
 const name = (r.userId?.fullName ||"").toLowerCase();
 const loc = (typeof r.location ==="string" ? r.location : r.location?.name ||"").toLowerCase();
 if (filterType !=="all" && type !== filterType) return false;
 if (filterStatus !=="all" && status !== filterStatus) return false;
 if (searchQuery && !name.includes(searchQuery.toLowerCase()) && !loc.includes(searchQuery.toLowerCase()) && !type.includes(searchQuery.toLowerCase())) return false;
 return true;
 });

 const totalReports = reports.length;
 const pendingCount = reports.filter(r => r.status ==="pending").length;
 const respondingCount = reports.filter(r => r.status ==="responding").length;
 const resolvedCount = reports.filter(r => r.status ==="resolved").length;

 return (
 <div className="flex h-screen bg-slate-100 font-sans text-slate-900 antialiased overflow-hidden transition-colors duration-300">

 {/* Mobile overlay */}
 {isSidebarOpen && (
 <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
 )}

 {/* ── SIDEBAR ─────────────────────────────────────────── */}
 <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[220px] bg-[#0d1b2a] text-white transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ?"translate-x-0" :"-translate-x-full"}`}>

 {/* Logo */}
 <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
 <img src="/logo.png" alt="Alerto Calbayog" className="w-9 h-9 object-contain shrink-0" />
 <div className="min-w-0">
 <p className="text-sm font-black tracking-tight text-white leading-tight truncate">Alerto Calbayog</p>
 <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mt-0.5">Dispatch Command</p>
 </div>
 </div>

 {/* Nav */}
 <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
 {NAV.map(item => (
 <button
 key={item.id}
 onClick={() => { setActiveNav(item.id); setIsSidebarOpen(false); }}
 className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
 activeNav === item.id
 ?"bg-blue-600 text-white shadow-lg shadow-blue-600/30"
 :"text-slate-400 hover:bg-white/10 hover:text-white"
 }`}
 >
 <span className="shrink-0">{item.icon}</span>
 <span className="truncate">{item.label}</span>
 </button>
 ))}
 </nav>

 {/* Bottom: Profile + Logout */}
 <div className="border-t border-white/10 p-3 space-y-1">
 <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-all">
 <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
 <span>Profile</span>
 </button>
 <Link to="/" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all">
 <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
 <span>Logout</span>
 </Link>
 </div>
 </aside>

 {/* ── MAIN ────────────────────────────────────────────── */}
 <main className="flex-1 flex flex-col overflow-hidden bg-white transition-colors duration-300">

 {/* TOP HEADER */}
 <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 shrink-0 gap-4">
 {/* Mobile menu + Search */}
 <div className="flex items-center gap-3 flex-1 min-w-0">
 <button
 onClick={() => setIsSidebarOpen(true)}
 className="lg:hidden shrink-0 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
 </button>
 <div className="relative flex-1 max-w-xs">
 <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
 <input
 type="search"
 placeholder="Search reports..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
 />
 </div>
 </div>

 {/* Right actions */}
 <div className="flex items-center gap-2 shrink-0">

 {/* Bell */}
 <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
 {pendingCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />}
 </button>

 {/* Settings */}
 <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
 </button>

 {/* Avatar */}
 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-md cursor-pointer">
 {userInitials}
 </div>
 </div>
 </header>

 {/* PAGE CONTENT */}
 <section className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 transition-colors">

 {/* Offline banner */}
 {isOffline && (
 <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
 <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
 <p className="text-xs font-semibold text-amber-700">API offline — showing demo data</p>
 </div>
 )}

 {/* Page heading */}
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
 <div>
 <h1 className="text-lg font-bold text-slate-900">Emergency Reports</h1>
 <p className="text-xs text-blue-500 mt-0.5">Manage and respond to incoming emergency incidents in real-time.</p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-all">
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
 Export
 </button>
 <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-all shadow-sm shadow-red-600/30">
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
 + New Report
 </button>
 </div>
 </div>

 {/* FILTER BAR */}
 <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap gap-3 items-center">
 {/* Incident ID search */}
 <div className="relative">
 <input
 type="text"
 placeholder="e.g. INC-2024"
 className="h-8 pl-3 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-500 w-32 transition-all"
 />
 </div>

 {/* Emergency Type */}
 <select
 value={filterType}
 onChange={e => setFilterType(e.target.value)}
 className="h-8 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all"
 >
 <option value="all">All Types</option>
 <option value="fire">Fire</option>
 <option value="medical">Medical</option>
 <option value="police">Police</option>
 <option value="flood">Flood</option>
 <option value="disaster">Disaster</option>
 <option value="emergency">Emergency</option>
 <option value="others">Others</option>
 </select>

 {/* Status */}
 <select
 value={filterStatus}
 onChange={e => setFilterStatus(e.target.value)}
 className="h-8 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all"
 >
 <option value="all">All Statuses</option>
 <option value="pending">Pending</option>
 <option value="responding">Responding</option>
 <option value="resolved">Resolved</option>
 <option value="ongoing">Ongoing</option>
 <option value="cancelled">Cancelled</option>
 <option value="closed">Closed</option>
 </select>

 {/* Date Range */}
 <div className="flex items-center gap-1.5 ml-auto">
 <input
 type="date"
 className="h-8 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
 />
 <span className="text-xs text-slate-400">–</span>
 <input
 type="date"
 className="h-8 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
 />
 </div>
 </div>

 {/* TABLE */}
 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-slate-200 bg-slate-50">
 {["Incident ID","Type","Reporter Info","Location","Time","Priority","Status","Actions"].map(h => (
 <th key={h} className="px-4 py-3 text-[11px] font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap">
 {h}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filtered.length === 0 ? (
 <tr>
 <td colSpan={8} className="text-center py-16 text-slate-400 text-sm font-semibold">
 No reports match the current filters.
 </td>
 </tr>
 ) : (
 filtered.map((report, i) => {
 const type = (report.emergencyType ||"others").toLowerCase();
 const status = (report.status ||"pending").toLowerCase();
 const typeInfo = TYPE_ICONS[type] || TYPE_ICONS.others;
 const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.pending;
 const priority = getPriority(report);
 const incId = getIncidentId(report, i);
 const user = report.userId || {};
 const loc = typeof report.location ==="string" ? report.location : (report.location?.name ||"Unknown");
 const date = report.createdAt ? new Date(report.createdAt) : new Date();
 const timeStr = date.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
 const dateStr = date.toLocaleDateString([], { month:"short", day:"numeric" });

 return (
 <tr key={report._id || i} className="hover:bg-slate-50 transition-colors group">
 {/* Incident ID */}
 <td className="px-4 py-3">
 <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">{incId}</span>
 </td>
 {/* Type */}
 <td className="px-4 py-3">
 <div className={`flex items-center gap-1.5 text-xs font-semibold ${typeInfo.color}`}>
 <span>{typeInfo.icon}</span>
 <span>{typeInfo.label}</span>
 </div>
 </td>
 {/* Reporter Info */}
 <td className="px-4 py-3">
 <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">{user.fullName ||"Unknown"}</p>
 <p className="text-[10px] text-blue-500 mt-0.5">{user.phoneNumber ||"N/A"}</p>
 </td>
 {/* Location */}
 <td className="px-4 py-3 max-w-[140px]">
 <p className="text-xs text-slate-600 leading-snug">{loc}</p>
 </td>
 {/* Time */}
 <td className="px-4 py-3 whitespace-nowrap">
 <p className="text-xs text-slate-700">{timeStr}</p>
 <p className="text-[10px] text-slate-400">{dateStr}</p>
 </td>
 {/* Priority */}
 <td className="px-4 py-3">
 <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${PRIORITY_STYLES[priority]}`}>
 {priority}
 </span>
 </td>
 {/* Status */}
 <td className="px-4 py-3">
 <div className="flex items-center gap-1.5">
 <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo.dot}`} />
 <span className={`text-xs font-semibold ${statusInfo.text}`}>{statusInfo.label}</span>
 </div>
 </td>
 {/* Actions */}
 <td className="px-4 py-3">
 <button className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100">
 View
 </button>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>

 {/* Table footer */}
 <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
 <p className="text-xs text-slate-500">
 Showing <span className="font-bold text-slate-700">{filtered.length}</span> of <span className="font-bold text-slate-700">{totalReports}</span> reports
 </p>
 <div className="flex items-center gap-1">
 <button className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-100 transition-all">Previous</button>
 <button className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all">Next</button>
 </div>
 </div>
 </div>

 {/* Stat cards row */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
 {[
 { label:"Total Reports", value: totalReports, color:"bg-slate-900", icon:"📋" },
 { label:"Pending", value: pendingCount, color:"bg-amber-500", icon:"⏳" },
 { label:"Responding", value: respondingCount, color:"bg-blue-500", icon:"🚨" },
 { label:"Resolved", value: resolvedCount, color:"bg-emerald-500", icon:"✅" },
 ].map(stat => (
 <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
 <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center text-base shrink-0`}>{stat.icon}</div>
 <div>
 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
 <p className="text-xl font-black text-slate-900 leading-tight">{stat.value}</p>
 </div>
 </div>
 ))}
 </div>
 </section>
 </main>
 </div>
 );
}

export default AdminDashboard;