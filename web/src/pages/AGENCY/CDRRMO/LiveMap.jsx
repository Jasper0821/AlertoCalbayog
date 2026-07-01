import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATUS_STYLES, getIncidentId } from "./utils.js";

const cityCenter = [12.068, 124.597];

// ── SVG path data for each emergency type icon ──
const ICON_SVGS = {
  fire: `<path d="M22 6c0 0-3 2-3 5s1.5 4 3 5c1.5-1 3-2 3-5s-3-5-3-5z" fill="white" opacity="0.9"/>
         <path d="M22 4c0 0-6 4-6 11c0 4 2.5 7 6 7s6-3 6-7c0-7-6-11-6-11z" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
         <path d="M19.5 18c0 1.5 1 3 2.5 3s2.5-1.5 2.5-3c0-2-2.5-4-2.5-4s-2.5 2-2.5 4z" fill="white" opacity="0.7"/>`,
  flood: `<path d="M12 14c2-1.5 4 1 6 0s4-1.5 6 0" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 18.5c2-1.5 4 1 6 0s4-1.5 6 0" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 23c2-1.5 4 1 6 0s4-1.5 6 0" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M20 8l2 3 2-3" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="22" cy="11" r="0.8" fill="white"/>`,
  medical: `<rect x="16" y="10" width="12" height="12" rx="2" fill="none" stroke="white" stroke-width="1.8"/>
            <path d="M22 13v6" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M19 16h6" stroke="white" stroke-width="2.2" stroke-linecap="round"/>`,
  others: `<path d="M22 10v4" stroke="white" stroke-width="2" stroke-linecap="round"/>
           <circle cx="22" cy="18" r="1.2" fill="white"/>
           <path d="M22 6l-7 14h14z" fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>`,
};

// ── Pin config for each CDRRMO emergency type (no crime — that's PNP) ──
const TYPE_MAP_CONFIG = {
  fire: {
    label: "Fire Emergency",
    svg: ICON_SVGS.fire,
    color: "#dc2626",
    legendBg: "#fef2f2",
    legendBorder: "#fca5a5",
    legendText: "#dc2626",
  },
  medical: {
    label: "Medical Emergency",
    svg: ICON_SVGS.medical,
    color: "#059669",
    legendBg: "#ecfdf5",
    legendBorder: "#6ee7b7",
    legendText: "#059669",
  },
  flood: {
    label: "Flood / Water",
    svg: ICON_SVGS.flood,
    color: "#2563eb",
    legendBg: "#eff6ff",
    legendBorder: "#93c5fd",
    legendText: "#2563eb",
  },
  others: {
    label: "Other Incident",
    svg: ICON_SVGS.others,
    color: "#d97706",
    legendBg: "#fffbeb",
    legendBorder: "#fcd34d",
    legendText: "#d97706",
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

// Resolve a report's emergencyType to a config entry
function getTypeConfig(emergencyType) {
  const raw = (emergencyType || "others").toLowerCase().trim();
  // crime is PNP-only — show as generic warning on CDRRMO map
  if (raw === "crime" || raw === "security") return TYPE_MAP_CONFIG.others;
  return TYPE_MAP_CONFIG[raw] || TYPE_MAP_CONFIG.others;
}

// Build a teardrop Leaflet pin with SVG icon inside
function buildDivIcon(cfg) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:56px;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.4));cursor:pointer;">
        <div class="map-sonar-wave" style="color: ${cfg.color}; position: absolute; left: 22px; top: 20px;"></div>
        <svg viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg"
             style="position:absolute;top:0;left:0;width:44px;height:56px;z-index:1;">
          <path d="M22 2C12.06 2 4 10.06 4 20c0 7.5 5.5 15 10.5 21C18.5 45.5 22 51 22 51s3.5-5.5 7.5-10C34.5 35 40 27.5 40 20C40 10.06 31.94 2 22 2z"
            fill="${cfg.color}" stroke="white" stroke-width="2.5"/>
          ${cfg.svg}
        </svg>
      </div>`,
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -58],
  });
}

export default function LiveMap({ reports = [] }) {
  // Filter out resolved/closed reports — they disappear from live map once resolved
  const safeReports = (Array.isArray(reports) ? reports : []).filter(r => {
    const status = (r.status || "").toLowerCase();
    return !["resolved", "closed", "responded", "cancelled"].includes(status);
  });

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
  const presentTypes = [...new Set(safeReports.map(r => {
    const raw = (r.emergencyType || "others").toLowerCase().trim();
    // crime → others for CDRRMO
    if (raw === "crime" || raw === "security") return "others";
    return raw;
  }))].filter(t => TYPE_MAP_CONFIG[t]);

  return (
    <div className="h-full w-full overflow-hidden bg-slate-100">
      {/* Map Toolbar */}
      <div className="hidden items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {(presentTypes.length > 0 ? presentTypes : ["fire", "medical", "flood"]).map(type => {
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
      <div className="relative h-full w-full bg-slate-100">
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
              const icon = buildDivIcon(cfg, isResolved);

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
          <div className="hidden absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm z-[500]">
            <p className="text-xs font-bold text-slate-700">Calbayog City, Samar</p>
            <p className="text-[10px] text-slate-400 mt-0.5">CDRRMO Response Area</p>
          </div>

          {/* Incident count badge */}
          {safeReports.length > 0 && (
            <div className="hidden absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm z-[500] items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-xs font-bold text-slate-700">{safeReports.length} Active Incident{safeReports.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
    </div>
  );
}
