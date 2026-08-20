import { useState } from "react";
import { formatLocationForTable } from "../../../utils/incidentFormatters.js";
import IncidentDetailModal from "../PNP/IncidentDetailModal.jsx";

export default function QueuingSystem({ reports = [], onStatusChange }) {
  const [resolvingIncidentId, setResolvingIncidentId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Only display active queues (pending & active), resolved ones go to Incident History
  const activeReports = reports.filter(r => 
    !["resolved", "responded", "closed"].includes((r.status || "").toLowerCase())
  );

  const handleStatusSelect = (id, newStatus) => {
    if (newStatus === "resolved" || newStatus === "responded") {
      setResolvingIncidentId(id);
    } else {
      onStatusChange(id, newStatus);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
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
            {activeReports.filter(r => ["responding", "active"].includes((r.status||'').toLowerCase())).length} Responding
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden h-full overflow-auto lg:block">
        <table className="min-w-[650px] w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Reporter</th>
              <th className="px-6 py-4">Contact No.</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeReports.map((report, idx) => {
              const typeLabel = (report.emergencyType) ? report.emergencyType.charAt(0).toUpperCase() + report.emergencyType.slice(1) : "Emergency";
              
              // Location formatting
              const locationText = formatLocationForTable(report.location);

              // Time formatting
              const timeStr = report.createdAt 
                ? new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                : "--:--";
              return (
                <tr key={report._id || idx} className="hover:bg-slate-50/30 transition-colors text-sm text-slate-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <span className="font-semibold text-slate-700">{typeLabel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium" title={locationText}>
                    {locationText}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{report.userId?.fullName || "Anonymous"}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-xs">{report.userId?.phoneNumber || report.phoneNumber || "N/A"}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{timeStr}</td>

                  {/* Action */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
            {activeReports.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                  No active incidents in the queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        <div className="space-y-3 p-3 lg:hidden">
          {activeReports.map((report, idx) => {
            return (
              <article key={report._id || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mt-1 text-sm font-bold capitalize text-slate-800">{report.emergencyType || "Emergency"}</p>
                  </div>
                  <button onClick={() => setSelectedReport(report)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>View</button>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-xs">
                  <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Location</dt><dd className="mt-0.5 text-slate-700">{formatLocationForTable(report.location)}</dd></div>
                  <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Reporter</dt><dd className="mt-0.5 text-slate-700">{report.userId?.fullName || "Anonymous"}</dd></div>
                  <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Contact</dt><dd className="mt-0.5 font-mono text-slate-700">{report.userId?.phoneNumber || report.phoneNumber || "N/A"}</dd></div>
                </dl>
              </article>
            );
          })}
          {activeReports.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No active incidents in the queue.</p>}
        </div>
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
                  onStatusChange(resolvingIncidentId, "resolved");
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
      <IncidentDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  );
}
