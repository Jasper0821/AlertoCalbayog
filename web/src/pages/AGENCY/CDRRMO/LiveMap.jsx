import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATUS_STYLES, getIncidentId } from "./utils.js";

const cityCenter = [12.068, 124.597];

const TYPE_MAP_CONFIG = {
  fire: {
    label: "Fire Emergency",
    color: "#dc2626",        // red-600
    legendBg: "#fef2f2",
    legendBorder: "#fca5a5",
    legendText: "#dc2626",
    svgPath: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z",
  },
  medical: {
    label: "Medical Assist",
    color: "#059669",        // emerald-600
    legendBg: "#ecfdf5",
    legendBorder: "#6ee7b7",
    legendText: "#059669",
    svgPath: "M9 12h6M12 9v6M3 12a9 9 0 1118 0 9 9 0 01-18 0z",
  },
  disaster: {
    label: "Disaster Rescue",
    color: "#d97706",        // amber-600
    legendBg: "#fffbeb",
    legendBorder: "#fcd34d",
    legendText: "#d97706",
    svgPath: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  },
  others: {
    label: "Others",
    color: "#64748b",        // slate-500
    legendBg: "#f8fafc",
    legendBorder: "#cbd5e1",
    legendText: "#64748b",
    svgPath: "M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z",
  },
};

// Force Leaflet to invalidate size when component mounts
function MapResizeBridge() {
  const map = useMap();
  useEffect(() => {
    const timers = [100, 300, 600].map(ms =>
      setTimeout(() => map.invalidateSize(), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [map]);
  return null;
}

function getTypeConfig(emergencyType) {
  const key = (emergencyType || "others").toLowerCase();
  return TYPE_MAP_CONFIG[key] || TYPE_MAP_CONFIG.others;
}

function buildDivIcon(color, svgPath) {
  return L.divIcon({
    className: "",
    html: `<div style="
        width:40px;height:40px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        border:3px solid #ffffff;
        box-shadow:0 3px 10px rgba(0,0,0,0.35)">
      <div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;width:100%;height:100%">
        <svg style="width:18px;height:18px" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="${svgPath}"/>
        </svg>
      </div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -42],
  });
}

export default function LiveMap({ reports = [] }) {
  const safeReports = Array.isArray(reports) ? reports : [];

  // Deterministic coordinate distribution for reports without geolocation
  const getCoordinates = (report, index) => {
    if (report.location && report.location.latitude && report.location.longitude) {
      return [Number(report.location.latitude), Number(report.location.longitude)];
    }
    const offsets = [
      [0.003, -0.004],
      [-0.001, 0.002],
      [0.006, 0.008],
      [-0.004, -0.006],
      [0.002, 0.005],
      [-0.003, 0.007],
      [0.005, -0.002],
    ];
    const offset = offsets[index % offsets.length];
    return [cityCenter[0] + offset[0], cityCenter[1] + offset[1]];
  };

  // Collect unique types present in reports for the legend
  const presentTypes = [...new Set(safeReports.map(r =>
    (r.emergencyType || "others").toLowerCase()
  ))].filter(t => TYPE_MAP_CONFIG[t]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Live Map</h1>
        <p className="text-sm text-slate-500 mt-0.5">Real-time geospatial view of CDRRMO emergency incidents.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Map Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {(presentTypes.length > 0 ? presentTypes : ["fire", "medical", "disaster"]).map(type => {
              const cfg = TYPE_MAP_CONFIG[type] || TYPE_MAP_CONFIG.others;
              return (
                <div key={type} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                  style={{ background: cfg.legendBg, borderColor: cfg.legendBorder, color: cfg.legendText }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
                  {cfg.label}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live GPS Sync
            </span>
          </div>
        </div>

        {/* Leaflet Map */}
        <div className="relative bg-slate-100" style={{ height: "520px" }}>
          <MapContainer center={cityCenter} zoom={14} className="h-full w-full z-10" zoomControl={false}>
            <MapResizeBridge />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {safeReports.map((report, idx) => {
              const coords = getCoordinates(report, idx);
              const status = (report.status || "pending").toLowerCase();
              const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.pending;
              const isResolved = status === "resolved" || status === "closed";
              const pinId = getIncidentId(report, idx);
              const cfg = getTypeConfig(report.emergencyType);
              const icon = buildDivIcon(isResolved ? "#94a3b8" : cfg.color, cfg.svgPath);

              return (
                <Marker key={report._id || idx} position={coords} icon={icon}>
                  <Popup>
                    <div className="p-1 min-w-[220px] text-slate-800">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{pinId}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isResolved ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-red-50 border-red-100 text-red-600"}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Type badge */}
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-bold"
                        style={{ color: cfg.color }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
                        {cfg.label}
                      </div>

                      {/* Location */}
                      <div className="text-[11px] text-slate-600 space-y-1.5 my-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {typeof report.location === "string" ? (
                          <div className="font-semibold text-slate-700">{report.location}</div>
                        ) : (
                          <>
                            <div className="font-bold text-[#0a1e3f] mb-1">{report.location?.name || "Specified Location"}</div>
                            {report.location?.barangay && (
                              <div className="flex justify-between items-center text-[10px] py-0.5 border-b border-slate-100/50">
                                <span className="font-semibold text-slate-400">Barangay</span>
                                <span className="font-bold text-slate-700">{report.location.barangay}</span>
                              </div>
                            )}
                            {report.location?.street && (
                              <div className="flex justify-between items-center text-[10px] py-0.5 border-b border-slate-100/50">
                                <span className="font-semibold text-slate-400">Street</span>
                                <span className="font-semibold text-slate-700">{report.location.street}</span>
                              </div>
                            )}
                            {report.location?.purok && (
                              <div className="flex justify-between items-center text-[10px] py-0.5">
                                <span className="font-semibold text-slate-400">Purok</span>
                                <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">{report.location.purok}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Reporter */}
                      <div className="text-[9px] bg-slate-50 rounded-lg p-1.5 space-y-0.5 border border-slate-100">
                        <p className="text-slate-400">Caller: <span className="text-slate-600 font-bold">{report.userId?.fullName || "Anonymous Caller"}</span></p>
                        <p className="text-slate-400">Contact: <span className="text-slate-600 font-semibold">{report.userId?.phoneNumber || "No record"}</span></p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            <ZoomControl position="bottomright" />
          </MapContainer>

          {/* Area label */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm z-[500]">
            <p className="text-xs font-bold text-slate-700">Calbayog City, Samar</p>
            <p className="text-[10px] text-slate-400 mt-0.5">CDRRMO Response Area</p>
          </div>

          {/* Incident count badge */}
          {safeReports.length > 0 && (
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm z-[500] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-xs font-bold text-slate-700">{safeReports.length} Active Incident{safeReports.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
