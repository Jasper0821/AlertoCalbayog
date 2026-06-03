import { useState } from "react";
import { STATUS_STYLES, TYPE_ICONS, getPriority, getIncidentId, PRIORITY_STYLES } from "./utils.js";

export default function QueuingSystem({ reports = [], onStatusChange }) {
  const [resolvingIncidentId, setResolvingIncidentId] = useState(null);

  // Only display active queues (pending & active), resolved ones go to Incident History
  const activeReports = reports.filter(r => 
    !["resolved", "responded", "closed"].includes((r.status || "").toLowerCase())
  );

  const handleStatusSelect = (id, newStatus) => {
    if (newStatus === "responded") {
      setResolvingIncidentId(id);
    } else {
      onStatusChange(id, newStatus);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Queuing System</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage active incident queues. When responded, incidents move to Incident History.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            {activeReports.filter(r => (r.status||'').toLowerCase() === 'pending').length} Pending
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            {activeReports.filter(r => (r.status||'').toLowerCase() === 'active').length} Active
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Incident ID</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeReports.map((report, idx) => {
              const status = (report.status || "pending").toLowerCase();
              const type = (report.emergencyType || "others").toLowerCase();
              const isResolved = ["resolved", "responded", "closed"].includes(status);
              const typeLabel = type === "crime" ? "Crime" : "Crime";
              
              // Location formatting
              const loc = typeof report.location === "string" 
                ? report.location 
                : `${report.location?.barangay || ""}, ${report.location?.street || ""}`.replace(/^,\s*/, "");

              // Time formatting
              const timeStr = report.createdAt 
                ? new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                : "--:--";

              const incId = report.incidentId || `INC-2024-${String(90 - idx).padStart(3, "0")}`;

              // Select status styles
              const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.pending;

              return (
                <tr key={report._id || idx} className="hover:bg-slate-50/30 transition-colors text-sm text-slate-700">
                  <td className="px-6 py-4 font-bold text-slate-900">{incId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <span className="font-semibold text-slate-700">{typeLabel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 truncate max-w-xs" title={loc}>
                    {loc || "Unknown Location"}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{timeStr}</td>
                  <td className="px-6 py-4">
                    {isResolved ? (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-bold text-emerald-600">Responded</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                        <select
                          value={status}
                          onChange={(e) => handleStatusSelect(report._id, e.target.value)}
                          className={`text-xs font-bold bg-transparent border-none p-0 pr-6 focus:outline-none focus:ring-0 cursor-pointer ${statusInfo.text}`}
                        >
                          <option value="pending" className="text-amber-600 font-bold">Pending</option>
                          <option value="active" className="text-indigo-600 font-bold">Active</option>
                          <option value="responded" className="text-emerald-600 font-bold">Resolve</option>
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {activeReports.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                  No active incidents in the queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ════════════ CUSTOM RESOLVE INCIDENT MODAL ════════════ */}
      {resolvingIncidentId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#030d1e]/75 backdrop-blur-sm" onClick={() => setResolvingIncidentId(null)} />
          <div className="relative z-10 w-full max-w-[420px] rounded-2xl overflow-hidden shadow-[0_32px_80px_-8px_rgba(0,0,0,0.7)] border border-[#1a3a6b]/60 flex flex-col bg-white animate-zoom-in">
            {/* Top accent strip */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-600 to-teal-400" />
            
            {/* Header */}
            <div className="bg-[#0a1e3f] px-6 py-4 flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-black text-sm tracking-wide uppercase">Resolve Incident</h3>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Status Update</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 bg-[#f8fafc]">
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Are you sure you want to mark this incident as resolved? It will be moved to the Incident History log.
              </p>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setResolvingIncidentId(null)}
                className="px-4 py-2 text-[13px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Keep Active
              </button>
              <button
                onClick={() => {
                  onStatusChange(resolvingIncidentId, "responded");
                  setResolvingIncidentId(null);
                }}
                className="px-5 py-2 rounded-lg text-[13px] font-black text-white bg-[#0a1e3f] hover:bg-emerald-600 active:scale-95 transition-all uppercase tracking-wide shadow-lg shadow-[#0a1e3f]/20 hover:shadow-emerald-600/30"
              >
                Resolve Now
              </button>
            </div>
            
            {/* Bottom accent strip */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-600 to-teal-400" />
          </div>
        </div>
      )}
    </div>
  );
}
