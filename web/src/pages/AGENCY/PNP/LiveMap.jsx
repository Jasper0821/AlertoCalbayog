import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATUS_STYLES, getIncidentId } from "./utils.js";

const cityCenter = [12.068, 124.597];

// PNP shield SVG path data (teardrop pin icon)
const PNP_SHIELD_SVG = `
  <path d="M22 4 C22 4 15 7 15 14 C15 18.5 18 21 22 22 C26 21 29 18.5 29 14 C29 7 22 4 22 4Z"
    fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M20 14 L21.5 16 L25 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
`;

// Crime type config — all use PNP navy as base color with shade variations
const CRIME_TYPE_CONFIG = {
  theft:       { label: "Theft",          color: "#1e3a5f", legendBg: "#eff6ff", legendBorder: "#93c5fd", legendText: "#1e40af" },
  assault:     { label: "Assault",        color: "#7c2020", legendBg: "#fef2f2", legendBorder: "#fca5a5", legendText: "#dc2626" },
  robbery:     { label: "Robbery",        color: "#7c3200", legendBg: "#fff7ed", legendBorder: "#fdba74", legendText: "#ea580c" },
  homicide:    { label: "Homicide",       color: "#1a0a2e", legendBg: "#faf5ff", legendBorder: "#d8b4fe", legendText: "#7c3aed" },
  "drug-related": { label: "Drug-Related",color: "#064e3b", legendBg: "#f0fdf4", legendBorder: "#86efac", legendText: "#16a34a" },
  others:      { label: "Crime Incident", color: "#0a1e3f", legendBg: "#eff6ff", legendBorder: "#93c5fd", legendText: "#1d4ed8" },
};

function getCrimeTypeConfig(crimeType) {
  const raw = (crimeType || "others").toLowerCase().replace(/\s+/g, "-");
  return CRIME_TYPE_CONFIG[raw] || CRIME_TYPE_CONFIG.others;
}

// Build a teardrop Leaflet pin with PNP shield icon inside
function buildPNPDivIcon(cfg) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:56px;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.4));cursor:pointer;">
        <div class="map-sonar-wave" style="color: ${cfg.color}; position: absolute; left: 22px; top: 20px;"></div>
        <svg viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg"
             style="position:absolute;top:0;left:0;width:44px;height:56px;z-index:1;">
          <path d="M22 2C12.06 2 4 10.06 4 20c0 7.5 5.5 15 10.5 21C18.5 45.5 22 51 22 51s3.5-5.5 7.5-10C34.5 35 40 27.5 40 20C40 10.06 31.94 2 22 2z"
            fill="${cfg.color}" stroke="white" stroke-width="2.5"/>
          ${PNP_SHIELD_SVG}
        </svg>
      </div>`,
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -58],
  });
}

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

export default function LiveMap({ reports = [] }) {
  // Filter out resolved/closed reports — they should not appear on the live map
  const safeReports = (Array.isArray(reports) ? reports : []).filter(r => {
    const status = (r.status || "").toLowerCase();
    return !["resolved", "closed", "responded", "cancelled"].includes(status);
  });

  // Collect present crime types for legend
  const presentTypes = [...new Set(safeReports.map(r => {
    const raw = (r.type || r.crimeType || r.incidentType || r.emergencyType || "others")
      .toLowerCase().replace(/\s+/g, "-");
    return CRIME_TYPE_CONFIG[raw] ? raw : "others";
  }))];

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

  return (
    <div className="h-full w-full overflow-hidden bg-slate-100">
      {/* Map Toolbar */}
      <div className="hidden items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {(presentTypes.length > 0 ? presentTypes : ["others"]).map(type => {
            const cfg = CRIME_TYPE_CONFIG[type] || CRIME_TYPE_CONFIG.others;
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

      {/* Leaflet Map Section */}
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
            const crimeRaw = (report.type || report.crimeType || report.incidentType || report.emergencyType || "others")
              .toLowerCase().replace(/\s+/g, "-");
            const cfg = getCrimeTypeConfig(crimeRaw);
            const icon = buildPNPDivIcon(cfg);

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
          <p className="text-[10px] text-slate-400 mt-0.5">PNP Jurisdiction Area</p>
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
