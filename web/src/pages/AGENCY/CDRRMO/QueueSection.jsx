import { useState } from"react";
import { shellCard, innerCard, pillBase, SectionHeader, incidentChip, statusChip } from"./SharedUI.jsx";
import api from"../../../api/axios.js";

export function QueueSection({ reports = [] }) {
 const [activeTab, setActiveTab] = useState("pending");

 const pendingReports = reports.filter(r => r.status ==="pending" || r.status ==="verified");
 const activeReports = reports.filter(r => r.status ==="responding" || r.status ==="active");
 const completedReports = reports.filter(r => r.status ==="resolved" || r.status ==="closed" || r.status ==="responded");

 const getTabData = () => {
 switch (activeTab) {
 case"pending": return pendingReports;
 case"active": return activeReports;
 case"completed": return completedReports;
 default: return [];
 }
 };

 const currentData = getTabData();

 return (
 <section id="queuing" className={shellCard}>
 <div className="p-6 sm:p-8">
 <SectionHeader
 title="Dispatch queue"
 action={<span className={`${pillBase} ${statusChip.neutral}`}>Auto-sync verified</span>}
 />

 <div className="mb-10 flex gap-4 border-b border-slate-100 pb-6 transition-colors">
 {[
 { id:"pending", label:"Pending", tone:"red", count: pendingReports.length },
 { id:"active", label:"Active", tone:"red", count: activeReports.length },
 { id:"completed", label:"Completed", tone:"emerald", count: completedReports.length },
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`${pillBase} transition-all px-8 py-3 ${
 activeTab === tab.id
 ?`bg-${tab.tone}-600 text-white shadow-lg shadow-${tab.tone}-600/20`
 :"bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 border-transparent"
 }`}
 >
 <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label} ({tab.count})</span>
 </button>
 ))}
 </div>

 <div className="grid gap-8">
 {currentData.length === 0 ? (
 <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Queue is clear</p>
 <p className="mt-2 text-sm font-bold text-slate-600">No {activeTab} reports at this moment.</p>
 </div>
 ) : (
 <div className="grid gap-4">
 {currentData.map((item) => (
 <article key={item.id || item._id} className={`${innerCard} p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between`}>
 <div className="flex gap-4 items-center">
 <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg font-black text-slate-900 shadow-sm transition-colors">
 {item.emergencyType[0].toUpperCase()}
 </div>
 <div>
 <span className={`${pillBase} ${incidentChip[item.emergencyType] || incidentChip.fire} mb-2`}>{item.emergencyType}</span>
 <h4 className="text-lg font-black text-slate-900 tracking-tight transition-colors">{item.location?.name ||"Sector Alpha"}</h4>
 <p className="text-xs text-slate-500 mt-1">{item.description ||"No description provided"}</p>
 </div>
 </div>
 <div className="text-left sm:text-right flex flex-col sm:items-end">
 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned Agency</p>
 <p className="text-sm font-bold text-slate-900 mt-1 transition-colors">{item.assignedAgency ||"Dispatching..."}</p>
 <select
 className={`${pillBase} mt-2 cursor-pointer outline-none ${item.status ==="pending" || item.status ==="verified" ? statusChip.danger : statusChip.success}`}
 value={item.status === "active" ? "responding" : (item.status === "responded" ? "resolved" : item.status)}
 onChange={async (e) => {
 try {
 await api.put(`/reports/${item._id || item.id}/status`, { status: e.target.value });
 } catch (err) {
 console.error("Failed to update report status:", err);
 }
 }}
 >
  <option value="pending">Pending</option>
  <option value="responding">Responding</option>
  <option value="resolved">Resolved</option>
 </select>
 </div>
 </article>
 ))}
 </div>
 )}
 </div>
 </div>
 </section>
 );
}

export default QueueSection;

