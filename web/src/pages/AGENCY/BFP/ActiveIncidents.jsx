import { useState } from "react";
import { TYPE_ICONS, formatLocationForTable, normalizeIncidentStatus } from "../../../utils/incidentFormatters.js";
import IncidentDetailModal from "../PNP/IncidentDetailModal.jsx";

export default function ActiveIncidents({ reports = [] }) {
  const [selectedReport, setSelectedReport] = useState(null);
  // Show all unresolved reports so responders can progress incidents without opening the queue.
  const activeReports = (Array.isArray(reports) ? reports : []).filter(r =>
    ["pending", "responding"].includes(normalizeIncidentStatus(r.status))
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Fire Incident Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Current emergency fire incidents routed to BFP units.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-bold bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full shrink-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          {activeReports.length} Open
        </span>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-full overflow-auto">
        <table className="incident-reports-table min-w-[650px] w-full text-left border-collapse">
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
              // Location
              const locationText = formatLocationForTable(report.location);

              // Time
              const timeStr = report.createdAt
                ? new Date(report.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "--:--";
              const phone = report.userId?.phoneNumber || report.phoneNumber || "N/A";
              const reporter = report.userId?.fullName || "Anonymous";

              return (
                <tr
                  key={report._id || idx}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Type */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[17px] leading-none shrink-0">🔥</span>
                      <span className="text-xs font-medium text-slate-800">Fire</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4 text-xs font-medium text-slate-700 max-w-[220px] truncate" title={locationText}>
                    {locationText}
                  </td>

                  {/* Reporter */}
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">
                    {reporter}
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4 text-xs font-mono text-slate-600">
                    {phone}
                  </td>

                  {/* Time */}
                  <td className="px-6 py-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                    {timeStr}
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
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
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs font-medium">No active fire incident reports at the moment.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <IncidentDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}
