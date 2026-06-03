import { STATUS_STYLES } from "./utils.js";

export default function ActiveIncidents({ reports = [] }) {
  // Only show reports that are currently ACTIVE (being responded to)
  const activeReports = (Array.isArray(reports) ? reports : []).filter(r =>
    (r.status || "").toLowerCase() === "active"
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Incident ID</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Barangay</th>
              <th className="px-6 py-4">Street / Purok</th>
              <th className="px-6 py-4">Reporter</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeReports.map((report, idx) => {
              const status = (report.status || "active").toLowerCase();
              const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.active;

              // Location
              const barangay = report.location?.barangay
                || (typeof report.location === "string" ? report.location : "Unknown");
              const streetPurok = [report.location?.street, report.location?.purok]
                .filter(Boolean)
                .join(" · ") || "—";

              // Time
              const timeStr = report.createdAt
                ? new Date(report.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "--:--";

              const incId =
                report.incidentId ||
                `INC-2024-${String(90 - idx).padStart(3, "0")}`;

              return (
                <tr
                  key={report._id || idx}
                  className="hover:bg-slate-50/40 transition-colors text-sm text-slate-700"
                >
                  {/* Incident ID */}
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">
                    {incId}
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                      <span className="font-semibold text-slate-700">Crime</span>
                    </div>
                  </td>

                  {/* Barangay */}
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {barangay}
                  </td>

                  {/* Street / Purok */}
                  <td className="px-6 py-4 text-slate-500 truncate max-w-[180px]" title={streetPurok}>
                    {streetPurok}
                  </td>

                  {/* Reporter */}
                  <td className="px-6 py-4 text-slate-600">
                    {report.userId?.fullName || "Anonymous"}
                  </td>

                  {/* Time */}
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {timeStr}
                  </td>

                  {/* Status — read-only badge, no dropdown */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                        status === "active"
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                      {statusInfo.label}
                    </span>
                  </td>
                </tr>
              );
            })}

            {activeReports.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-14 text-center"
                >
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
    </div>
  );
}
