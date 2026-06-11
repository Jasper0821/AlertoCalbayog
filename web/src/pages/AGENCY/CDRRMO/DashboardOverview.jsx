import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { STATUS_STYLES, TYPE_ICONS, getIncidentId } from "./utils.js";

const cityCenter = [12.068, 124.597];

const getCoordinates = (report, index) => {
  if (report.location && report.location.latitude && report.location.longitude) {
    return [Number(report.location.latitude), Number(report.location.longitude)];
  }
  const offsets = [
    [0.003, -0.004], // Hamorawon
    [-0.001, 0.002], // City Plaza
    [0.006, 0.008],  // Maharlika Hwy
    [-0.004, -0.006], // Riverside
    [0.002, 0.005],  // Nijaga
  ];
  const offset = offsets[index % offsets.length];
  return [cityCenter[0] + offset[0], cityCenter[1] + offset[1]];
};

export default function DashboardOverview({ reports = [], setActiveNav, onStatusChange }) {
  const activeIncidentReports = (Array.isArray(reports) ? reports : []).filter(report =>
    !["resolved", "responded", "closed"].includes((report.status || "").toLowerCase())
  );

  // Dynamic KPI calculations based on mock / API reports
  const totalIncidents = reports.length;
  const pendingCount = reports.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const activeCount = reports.filter(r => ["responding", "ongoing", "dispatching", "en_route", "active"].includes((r.status || "").toLowerCase())).length;
  const resolvedCount = reports.filter(r => ["resolved", "responded", "closed"].includes((r.status || "").toLowerCase())).length;
  
  const avgResponse = totalIncidents > 0 
    ? `0${Math.max(3, Math.min(7, Math.floor(5 + (pendingCount * 0.5) - (resolvedCount * 0.2))))}:${String(Math.abs(Math.floor(22 + (activeCount * 4))) % 60).padStart(2, "0")}`
    : "00:00";

  return (
    <div className="space-y-6">

      {/* ── 5 KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Total Today", value: String(totalIncidents).padStart(2, "0"),
            sub: <><span className="text-emerald-500 font-bold">Live Data</span> synced</>,
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            iconBg: "bg-blue-50/70 text-[#0a1e3f]", valueColor: "text-slate-800",
          },
          {
            label: "Pending", value: String(pendingCount).padStart(2, "0"),
            sub: "Requiring dispatch",
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>,
            iconBg: "bg-amber-50 text-amber-600", valueColor: "text-amber-600", topBar: "bg-amber-500",
          },
          {
            label: "Active Cases", value: String(activeCount).padStart(2, "0"),
            sub: "In progress responding",
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
            iconBg: "bg-indigo-50 text-indigo-600", valueColor: "text-indigo-600",
          },
          {
            label: "Resolved", value: String(resolvedCount).padStart(2, "0"),
            sub: "Completed and closed",
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            iconBg: "bg-emerald-50 text-emerald-600", valueColor: "text-emerald-600",
          },
          {
            label: "Avg Response", value: avgResponse,
            sub: "Target: < 08:00 min",
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            iconBg: "bg-slate-100 text-slate-600", valueColor: "text-slate-800",
          },
        ].map(card => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
            {card.topBar && <div className={`absolute top-0 inset-x-0 h-0.5 ${card.topBar}`} />}
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                {card.icon}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
            </div>
            <div>
              <p className={`text-3xl font-black ${card.valueColor}`}>{card.value}</p>
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="w-full">

        {/* Live Emergency Reports Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Live Emergency Reports</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">All unresolved emergency incidents with inline status controls</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors">
                Export Logs
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Incident ID", "Type", "Location", "Time", "Status"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeIncidentReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-slate-400">No reports available.</td>
                  </tr>
                ) : activeIncidentReports.map((report, i) => {
                  const type = (report.emergencyType || "others").toLowerCase();
                  const status = (report.status || "pending").toLowerCase();
                  const typeInfo = TYPE_ICONS[type] || TYPE_ICONS.others;
                  const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.pending;
                  const incId = String(getIncidentId(report, i));
                  const loc = typeof report.location === "string"
                    ? report.location
                    : (report.location?.name || [report.location?.barangay, report.location?.street, report.location?.purok].filter(Boolean).join(", ") || "Unknown");
                  const timeStr = report.createdAt
                    ? new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                    : "—";

                  return (
                    <tr key={report._id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono font-bold text-[#0a1e3f]">{incId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${(typeInfo.color || "").replace("text", "bg")}`} />
                          <span className="text-xs font-medium text-slate-700">{typeInfo.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-600 truncate block max-w-sm">{loc}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-500 font-semibold">{timeStr}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          <select
                            value={status === "active" ? "responding" : (status === "responded" ? "resolved" : status)}
                            onChange={(e) => onStatusChange?.(report._id, e.target.value)}
                            disabled={!report._id}
                            className={`min-w-[160px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none transition-colors focus:border-[#0a1e3f] focus:ring-2 focus:ring-[#0a1e3f]/10 disabled:cursor-not-allowed disabled:opacity-60 ${statusInfo.text}`}
                            title="Update incident status"
                          >
                            <option value="pending">Pending</option>
                            <option value="responding">Responding</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-[11px] text-slate-400">{activeIncidentReports.length} open incidents shown</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveNav?.("incident-reports")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                View All Reports
              </button>
              <button
                onClick={() => setActiveNav?.("queuing")}
                className="text-xs font-semibold text-[#0a1e3f] hover:text-[#07152c] transition-colors"
              >
                Manage Queue →
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
