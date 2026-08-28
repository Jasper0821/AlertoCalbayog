import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATUS_STYLES, getIncidentId } from "../../../utils/incidentFormatters.js";

const cityCenter = [12.068, 124.597];

// ── SVG path data for fire emergency type icon ──
const ICON_SVGS = {
  fire: `<path d="M22 6c0 0-3 2-3 5s1.5 4 3 5c1.5-1 3-2 3-5s-3-5-3-5z" fill="white" opacity="0.9"/>
         <path d="M22 4c0 0-6 4-6 11c0 4 2.5 7 6 7s6-3 6-7c0-7-6-11-6-11z" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
         <path d="M19.5 18c0 1.5 1 3 2.5 3s2.5-1.5 2.5-3c0-2-2.5-4-2.5-4s-2.5 2-2.5 4z" fill="white" opacity="0.7"/>`,
};

// ── Pin config for BFP fire emergency type (Red Teardrop Pin like CDRRMO) ──
const TYPE_MAP_CONFIG = {
  fire: {
    label: "Fire Emergency",
    svg: ICON_SVGS.fire,
    color: "#dc2626",
    legendBg: "#fef2f2",
    legendBorder: "#fca5a5",
    legendText: "#dc2626",
  },
};

// Teardrop Leaflet pin with SVG icon inside (matching CDRRMO design)
function buildDivIcon(cfg) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:32px;height:42px;filter:drop-shadow(0 3px 7px rgba(0,0,0,0.35));cursor:pointer;">
        <div class="map-sonar-wave" style="color: ${cfg.color}; position: absolute; left: 16px; top: 15px;"></div>
        <svg viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg"
             style="position:absolute;top:0;left:0;width:32px;height:42px;z-index:1;">
          <path d="M22 2C12.06 2 4 10.06 4 20c0 7.5 5.5 15 10.5 21C18.5 45.5 22 51 22 51s3.5-5.5 7.5-10C34.5 35 40 27.5 40 20C40 10.06 31.94 2 22 2z"
            fill="${cfg.color}" stroke="white" stroke-width="2.5"/>
          ${cfg.svg}
        </svg>
      </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });
}

function FlyToMarker({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export default function LiveMap({ reports = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mapCenter, setMapCenter] = useState(null);

  // Filter out resolved/closed/responded/rejected reports so they disappear once case is resolved or closed
  const activeReports = (Array.isArray(reports) ? reports : []).filter(r => {
    const status = (r.status || "").toLowerCase();
    return !["resolved", "closed", "responded", "cancelled", "rejected"].includes(status);
  });

  // Deterministic coordinate distribution for active reports
  const getCoordinates = (report, index) => {
    if (report.location && report.location.latitude && report.location.longitude) {
      return [Number(report.location.latitude), Number(report.location.longitude)];
    }
    const offsets = [
      [0.003, -0.004],
      [-0.001, 0.002],
      [0.006, 0.008],
      [-0.004, -0.005],
      [0.002, -0.007],
      [-0.005, 0.004],
      [0.007, -0.002],
      [-0.002, 0.006],
    ];
    const [dLat, dLng] = offsets[index % offsets.length];
    return [cityCenter[0] + dLat, cityCenter[1] + dLng];
  };

  const mappedReports = activeReports.map((report, index) => ({
    ...report,
    coords: getCoordinates(report, index),
  }));

  const filteredReports = mappedReports.filter(r => {
    if (selectedCategory === "all") return true;
    return (r.emergencyType || "fire").toLowerCase() === selectedCategory;
  });

  return (
    <div className="relative w-full h-full min-h-0 bg-slate-900 overflow-hidden">
      <style>{`
        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3) !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: 270px !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        }
      `}</style>

      {/* Leaflet Map */}
      <MapContainer
        center={cityCenter}
        zoom={13}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />

        {mapCenter && <FlyToMarker center={mapCenter} />}

        {filteredReports.map((r, i) => {
          const status = (r.status || "pending").toLowerCase();
          const cfg = TYPE_MAP_CONFIG.fire;
          const icon = buildDivIcon(cfg);

          const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;
          const incId = getIncidentId(r, i);
          const date = r.createdAt ? new Date(r.createdAt) : new Date();

          return (
            <Marker
              key={r._id || i}
              position={r.coords}
              icon={icon}
            >
              <Popup>
                <div className="bg-white font-sans overflow-hidden">
                  <div className="bg-[#7f1d1d] px-4 py-3 text-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black tracking-widest uppercase text-red-200 block">
                        {incId}
                      </span>
                      <h4 className="text-sm font-bold capitalize leading-tight">
                        {r.emergencyType || "Fire Emergency"}
                      </h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${statusStyle.badgeBg} ${statusStyle.badgeText}`}>
                      {status}
                    </span>
                  </div>

                  <div className="p-4 space-y-2.5 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                      <p className="font-semibold text-slate-800 leading-snug">
                        {typeof r.location === "string" ? r.location : (r.location?.name || "Calbayog City")}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reporter</p>
                      <p className="font-semibold text-slate-800">
                        {r.userId?.fullName || "Anonymous"} &bull; <span className="font-mono text-slate-500">{r.userId?.phoneNumber || r.phoneNumber || "N/A"}</span>
                      </p>
                    </div>

                    {r.description && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</p>
                        <p className="text-slate-600 line-clamp-2 italic text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{r.description}"
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>{date.toLocaleDateString()}</span>
                      <span>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-16 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg border border-slate-200/80 pointer-events-auto">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === "all"
                ? "bg-[#7f1d1d] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Active Fire Incidents ({filteredReports.length})
          </button>
        </div>

        {/* Live Incident Counter */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md text-white border border-slate-700/80 shadow-lg pointer-events-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-xs font-bold tracking-wide">
            BFP Fire Radar: <span className="text-red-400">{filteredReports.length}</span> active
          </span>
        </div>
      </div>
    </div>
  );
}
