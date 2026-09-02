import { useState } from "react";
import { formatLocationForTable, normalizeIncidentStatus } from "../../../utils/incidentFormatters.js";
import IncidentDetailModal from "../PNP/IncidentDetailModal.jsx";

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

export default function ActiveIncidents({ reports = [] }) {
  const [selectedReport, setSelectedReport] = useState(null);

  // Show all unresolved reports so responders can progress incidents without opening the queue.
  const activeReports = (Array.isArray(reports) ? reports : []).filter(r =>
    ["pending", "responding"].includes(normalizeIncidentStatus(r.status))
  );

  const pendingCount = activeReports.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const respondingCount = activeReports.filter(r => ["active", "responding"].includes((r.status || "").toLowerCase())).length;

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Incident Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Current emergency incidents routed to CDRRMO units.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            {pendingCount} Pending
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            {respondingCount} Responding
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden h-full overflow-auto lg:block">
          <table className="min-w-[650px] w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Reporter</th>
                <th className="px-5 py-4">Contact No.</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Time</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeReports.map((report, idx) => {
                const type = (report.emergencyType || "others").toLowerCase();
                const tc = TYPE_COLORS[type] || TYPE_COLORS.others;
                const sc = STATUS_STYLES[(report.status || "pending").toLowerCase()] || STATUS_STYLES.pending;
                const locationText = formatLocationForTable(report.location, report);
                const timeStr = report.createdAt
                  ? new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                  : "--:--";
                const phone = report.userId?.phoneNumber || report.phoneNumber || "N/A";
                const reporter = report.userId?.fullName || "Anonymous";

                return (
                  <tr key={report._id || idx} className="hover:bg-slate-50/30 transition-colors text-sm text-slate-700">
                    {/* Type */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${tc.bg} ${tc.border} ${tc.text}`}>
                        <span className={`w-2 h-2 rounded-full ${tc.dot}`}></span>
                        {TYPE_LABELS[type] || "Incident"}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4 text-slate-500 font-medium max-w-[160px]" title={locationText}>
                      <p className="truncate">{locationText}</p>
                    </td>

                    {/* Reporter */}
                    <td className="px-5 py-4 text-slate-600 font-medium">{reporter}</td>

                    {/* Contact No. */}
                    <td className="px-5 py-4 text-slate-600 font-mono text-xs">{phone}</td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${sc.bg} ${sc.border} ${sc.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}></span>
                        {sc.label}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="px-5 py-4 text-slate-500 font-medium">{timeStr}</td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  <td colSpan="7" className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-semibold">No open incidents.</p>
                      <p className="text-xs text-slate-400">All incidents are pending or have been resolved.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="space-y-3 p-3 lg:hidden">
          {activeReports.map((report, idx) => {
            const type = (report.emergencyType || "others").toLowerCase();
            const tc = TYPE_COLORS[type] || TYPE_COLORS.others;
            const sc = STATUS_STYLES[(report.status || "pending").toLowerCase()] || STATUS_STYLES.pending;
            const locationText = formatLocationForTable(report.location, report);
            const reporter = report.userId?.fullName || "Anonymous";
            const phone = report.userId?.phoneNumber || report.phoneNumber || "N/A";

            return (
              <article key={report._id || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${tc.bg} ${tc.border} ${tc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`}></span>
                      {TYPE_LABELS[type] || "Incident"}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black ${sc.bg} ${sc.border} ${sc.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}></span>
                      {sc.label}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Location</dt>
                    <dd className="mt-0.5 text-slate-700 truncate font-medium">{locationText}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Reporter</dt>
                    <dd className="mt-0.5 text-slate-700 font-medium">{reporter}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Contact</dt>
                    <dd className="mt-0.5 font-mono text-slate-700">{phone}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
          {activeReports.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">No open incidents.</p>
          )}
        </div>
      </div>

      <IncidentDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  );
}
