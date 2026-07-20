import { useState } from "react";
import { getIncidentStatusInfo, normalizeIncidentStatus } from "../../../utils/incidentFormatters.js";
import IncidentDetailModal from "./IncidentDetailModal.jsx";

export default function ActiveIncidents({ reports = [] }) {
  const activeReports = (Array.isArray(reports) ? reports : []).filter(r =>
    normalizeIncidentStatus(r.status) !== "resolved"
  );
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Incident Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Currently active crime incidents being responded to by PNP units.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full shrink-0">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          {activeReports.length} Active
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Incident ID</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Reporter</th>
              <th className="px-6 py-4">Contact No.</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeReports.map((report, idx) => {
              const statusInfo = getIncidentStatusInfo(report.status);
              const location =
                report.location?.name ||
                [report.location?.barangay, report.location?.street].filter(Boolean).join(", ") ||
                (typeof report.location === "string" ? report.location : "Unknown");
              const timeStr = report.createdAt
                ? new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                : "--:--";
              const incId = report.incidentId || `INC-2024-${String(90 - idx).padStart(3, "0")}`;
              const phone = report.userId?.phoneNumber || report.phoneNumber || "N/A";
              const reporter = report.userId?.fullName || "Anonymous";

              return (
                <tr key={report._id || idx} className="hover:bg-slate-50/40 transition-colors text-sm text-slate-700">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{incId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                      <span className="font-semibold text-slate-700 capitalize">{report.emergencyType || "Crime"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium max-w-[160px] truncate" title={location}>{location}</td>
                  <td className="px-6 py-4 text-slate-600">{reporter}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-xs">{phone}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{timeStr}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${statusInfo.className}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      {statusInfo.label}
                    </span>
                  </td>
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
                <td colSpan="8" className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">No active incidents</p>
                      <p className="text-xs text-slate-400 mt-0.5">All incidents are pending or have been resolved.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <IncidentDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  );
}
