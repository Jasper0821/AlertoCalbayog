import { useState } from"react";
import { STATUS_STYLES, PRIORITY_STYLES, TYPE_ICONS, getPriority, getIncidentId } from"./utils.js";

export default function EmergencyReports({ reports, isOffline }) {
 const [filterType, setFilterType] = useState("all");
 const [filterStatus, setFilterStatus] = useState("all");
 const [searchQuery, setSearchQuery] = useState("");

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
 <div className="transition-opacity duration-500">
 {/* Offline banner */}
 {isOffline && (
 <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
 <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
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
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
 Export
 </button>
 <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-all shadow-sm shadow-red-600/30">
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
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
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
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
 </div>
 );
}
