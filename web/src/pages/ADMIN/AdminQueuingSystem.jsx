import React, { useState } from "react";
import { formatLocationForTable } from "../../utils/incidentFormatters.js";

const TYPE_LABELS = { fire: "Fire", flood: "Flood", crime: "Crime", medical: "Medical", emergency: "Others", others: "Others" };
const TYPE_COLORS = {
  fire:    { dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50",    border: "border-red-200" },
  flood:   { dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50",   border: "border-blue-200" },
  crime:   { dot: "bg-purple-500",  text: "text-purple-700",  bg: "bg-purple-50", border: "border-purple-200" },
  medical: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50",border: "border-emerald-200" },
  others:  { dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-100", border: "border-slate-200" },
  emergency:{ dot: "bg-slate-400",  text: "text-slate-600",   bg: "bg-slate-100", border: "border-slate-200" },
};
const STATUS_STYLES = {
  pending:    { dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   label: "Pending" },
  rejected:   { dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     label: "Rejected" },
  responding: { dot: "bg-indigo-500",  text: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200",  label: "Responding" },
  active:     { dot: "bg-indigo-500",  text: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200",  label: "Responding" },
  resolved:   { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Resolved" },
};

export default function AdminQueuingSystem({ reports = [], onStatusChange, onViewReport }) {
  const [resolvingIncidentId, setResolvingIncidentId] = useState(null);

  const activeReports = reports.filter(r =>
    !["resolved", "responded", "closed", "rejected"].includes((r.status || "").toLowerCase())
  );

  const pendingCount = activeReports.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const respondingCount = activeReports.filter(r => ["active", "responding"].includes((r.status || "").toLowerCase())).length;

  const handleStatusSelect = (id, newStatus) => {
    if (newStatus === "resolved") {
      setResolvingIncidentId(id);
    } else {
      onStatusChange(id, newStatus);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col font-sans p-6">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Queuing System</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage active incident queues across all agencies.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            {pendingCount} Pending
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            {respondingCount} Responding
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/50">
        <div className="hidden h-full overflow-auto lg:block">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
              <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Update Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeReports.map((report, idx) => {
                const type = (report.emergencyType || report.type || report.incidentType || "others").toLowerCase();
                const tc = TYPE_COLORS[type] || TYPE_COLORS.others;
                const sc = STATUS_STYLES[(report.status || "pending").toLowerCase()] || STATUS_STYLES.pending;
                const locationText = formatLocationForTable(report.location);
                const timeStr = report.createdAt
                  ? new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                  : "--:--";
                return (
                  <tr key={report._id || idx} className="hover:bg-slate-50/50 transition-colors text-sm text-slate-700">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tc.bg} ${tc.border} ${tc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`}></span>
                        {TYPE_LABELS[type] || "Incident"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium max-w-[200px]" title={locationText}>
                      <p className="truncate">{locationText}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{report.userId?.fullName || report.reporterName || "Anonymous"}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">{report.userId?.phoneNumber || report.phoneNumber || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${sc.bg} ${sc.border} ${sc.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${sc.dot}`}></span>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{timeStr}</td>
                    <td className="px-6 py-4">
                      <select
                        value={report.status || "pending"}
                        onChange={(e) => handleStatusSelect(report._id, e.target.value)}
                        className="text-[11px] font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none cursor-pointer hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                        <option value="responding">Responding</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewReport(report, idx)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-black text-blue-700 transition hover:bg-blue-100 active:scale-[0.98]"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        VIEW
                      </button>
                    </td>
                  </tr>
                );
              })}
              {activeReports.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-500">No active incidents in the queue.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 p-4 lg:hidden overflow-y-auto h-full">
          {activeReports.map((report, idx) => {
            const type = (report.emergencyType || report.type || report.incidentType || "others").toLowerCase();
            const tc = TYPE_COLORS[type] || TYPE_COLORS.others;
            const sc = STATUS_STYLES[(report.status || "pending").toLowerCase()] || STATUS_STYLES.pending;
            return (
              <article key={report._id || idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${tc.bg} ${tc.border} ${tc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`}></span>
                      {TYPE_LABELS[type] || "Incident"}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${sc.bg} ${sc.border} ${sc.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}></span>
                      {sc.label}
                    </span>
                  </div>
                  <button
                    onClick={() => onViewReport(report, idx)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-black text-blue-700"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    VIEW
                  </button>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</dt>
                    <dd className="mt-0.5 text-slate-700 truncate font-medium">{formatLocationForTable(report.location)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reporter</dt>
                    <dd className="mt-0.5 text-slate-700 font-medium">{report.userId?.fullName || report.reporterName || "Anonymous"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</dt>
                    <dd className="mt-0.5 font-mono text-slate-600">{report.userId?.phoneNumber || report.phoneNumber || "N/A"}</dd>
                  </div>
                </dl>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Update Status</p>
                  <select
                    value={report.status || "pending"}
                    onChange={(e) => handleStatusSelect(report._id, e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="responding">Responding</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </article>
            );
          })}
          {activeReports.length === 0 && (
            <div className="py-12 text-center text-sm font-medium text-slate-400">
              No active incidents in the queue.
            </div>
          )}
        </div>
      </div>

      {resolvingIncidentId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setResolvingIncidentId(null)} />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-center text-lg font-black text-slate-900 mb-2">Resolve Incident</h3>
              <p className="text-center text-sm text-slate-500">
                Are you sure you want to mark this incident as resolved? It will be moved to the Incident History.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setResolvingIncidentId(null)}
                className="flex-1 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-200 active:scale-95"
              >
                CANCEL
              </button>
              <button
                onClick={() => { onStatusChange(resolvingIncidentId, "resolved"); setResolvingIncidentId(null); }}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-700 active:scale-95"
              >
                RESOLVE NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
