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

export default function DashboardOverview({ reports = [], setActiveNav }) {
  const latestReports = (Array.isArray(reports) ? reports : []).slice(0, 4);

  return (
    <div className="space-y-6">

      {/* ── 5 KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Total Today", value: "128",
            sub: <><span className="text-emerald-500 font-bold">↑ 12%</span> vs yesterday</>,
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            iconBg: "bg-blue-50/70 text-[#0a1e3f]", valueColor: "text-slate-800",
          },
          {
            label: "Critical", value: "08",
            sub: "Requiring immediate dispatch",
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
            iconBg: "bg-red-50 text-red-500", valueColor: "text-red-600", topBar: "bg-red-500",
          },
          {
            label: "Online Units", value: "42",
            sub: <><span className="font-bold text-slate-700">85%</span> fleet capacity</>,
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
            iconBg: "bg-indigo-50 text-[#0a1e3f]", valueColor: "text-slate-800",
          },
          {
            label: "Resolved", value: "114",
            sub: <>Shift completion <span className="font-bold text-slate-700">92%</span></>,
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            iconBg: "bg-emerald-50 text-emerald-600", valueColor: "text-slate-800",
          },
          {
            label: "Avg Response", value: "06:22",
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Live Emergency Reports Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Live Emergency Reports</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Latest incoming incidents</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors">
                Export Logs
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-[#0a1e3f] hover:bg-[#07152c] text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm shadow-slate-100">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                New Report
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Incident ID", "Type", "Location", "Time", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {latestReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-slate-400">No reports available.</td>
                  </tr>
                ) : latestReports.map((report, i) => {
                  const type = (report.emergencyType || "others").toLowerCase();
                  const status = (report.status || "pending").toLowerCase();
                  const typeInfo = TYPE_ICONS[type] || TYPE_ICONS.others;
                  const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.pending;
                  const incId = String(getIncidentId(report, i));
                  const loc = typeof report.location === "string" ? report.location : (report.location?.name || "Unknown");
                  const timeStr = report.createdAt
                    ? new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                    : "—";

                  return (
                    <tr key={report._id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono font-bold text-[#0a1e3f]">{incId}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${(typeInfo.color || "").replace("text", "bg")}`} />
                          <span className="text-xs font-medium text-slate-700">{typeInfo.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-600 max-w-[130px] block truncate">{loc}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-500">{timeStr}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          <span className={`text-xs font-semibold ${statusInfo.text}`}>{statusInfo.label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-[11px] text-slate-400">{latestReports.length} most recent incidents shown</p>
            <button
              onClick={() => setActiveNav?.("active-incidents")}
              className="text-xs font-semibold text-[#0a1e3f] hover:text-[#07152c] transition-colors"
            >
              View all →
            </button>
          </div>
        </div>

        {/* Right: Map + Dispatch Feed */}
        <div className="flex flex-col gap-5">

          {/* Live Unit Map */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" style={{ height: "240px" }}>
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <p className="text-xs font-bold text-slate-700">Live Unit Distribution</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-bold text-emerald-600 tracking-wider">LIVE GPS</span>
              </div>
            </div>
            <div className="relative flex-1" style={{ height: "calc(100% - 44px)" }}>
              <MapContainer center={cityCenter} zoom={13} className="h-full w-full z-10" zoomControl={false} dragging={false} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* Active Incident Markers */}
                {latestReports.map((report, idx) => (
                  <CircleMarker
                    key={report._id || idx}
                    center={getCoordinates(report, idx)}
                    radius={6}
                    pathOptions={{ color: "#ef4444", fillColor: "#ffffff", weight: 2, fillOpacity: 1 }}
                  />
                ))}

                {/* Active Unit Markers */}
                <CircleMarker center={[12.065, 124.592]} radius={5} pathOptions={{ color: "#1e3a8a", fillColor: "#3b82f6", weight: 1.5, fillOpacity: 0.8 }} />
                <CircleMarker center={[12.072, 124.602]} radius={5} pathOptions={{ color: "#1e3a8a", fillColor: "#3b82f6", weight: 1.5, fillOpacity: 0.8 }} />
              </MapContainer>

              <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm z-[400] pointer-events-none">
                <p className="text-[10px] font-bold text-slate-700">Calbayog City</p>
                <p className="text-[9px] text-slate-400">Telemetry active</p>
              </div>
            </div>
          </div>

          {/* Dispatch Feed */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 p-4 min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Dispatch Feed</h3>
            </div>
            <div className="space-y-4">
              {[
                { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, bg: "bg-red-100 text-red-500", msg: "Unit F-102 deployed to Sector 4", time: "2 min ago · Dispatcher #07" },
                { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, bg: "bg-blue-100 text-[#0a1e3f]", msg: "Unit A-005 arrived at City Plaza", time: "8 min ago · GPS Trigger" },
                { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, bg: "bg-emerald-100 text-emerald-600", msg: "Incident INC-2024-086 resolved", time: "14 min ago · Sgt. Reyes" },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${f.bg} flex items-center justify-center shrink-0`}>
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{f.msg}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{f.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating action button */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-[#0a1e3f] hover:bg-[#07152c] text-white rounded-2xl shadow-lg shadow-[#0a1e3f]/20 flex items-center justify-center transition-all hover:scale-105 z-40">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
