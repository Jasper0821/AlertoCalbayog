import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TYPE_ICONS, STATUS_STYLES, getIncidentId } from "./utils.js";

const cityCenter = [12.068, 124.597];

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
  const safeReports = Array.isArray(reports) ? reports : [];

  // Deterministic coordinate distribution for mock reports without geolocation
  const getCoordinates = (report, index) => {
    if (report.location && report.location.latitude && report.location.longitude) {
      return [Number(report.location.latitude), Number(report.location.longitude)];
    }
    // Hardcoded offsets to map items beautifully across Calbayog City
    const offsets = [
      [0.003, -0.004], // Hamorawon area
      [-0.001, 0.002], // City Plaza area
      [0.006, 0.008],  // Maharlika Highway area
      [-0.004, -0.006], // Riverside Subd. area
      [0.002, 0.005],  // Brgy. Nijaga area
    ];
    const offset = offsets[index % offsets.length];
    return [cityCenter[0] + offset[0], cityCenter[1] + offset[1]];
  };

  // Mock responder units distributed around the city center
  const mockUnits = [
    { name: "Patrol Unit A-101", coords: [12.065, 124.592], status: "Active Patrolling" },
    { name: "Rescue Unit B-102", coords: [12.072, 124.602], status: "Dispatched to Incident" },
    { name: "Fire Truck F-203", coords: [12.069, 124.595], status: "Station Standby" }
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Live Map</h1>
        <p className="text-sm text-slate-500 mt-0.5">Real-time geospatial view of incidents and active units.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Map Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-xs font-semibold text-slate-600">Active Incidents</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-xs font-semibold text-slate-600">Responder Units</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold text-slate-600">Resolved Alerts</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live GPS Sync
            </span>
          </div>
        </div>

        {/* Leaflet Map Section */}
        <div className="relative bg-slate-100" style={{ height: "520px" }}>
          <MapContainer center={cityCenter} zoom={14} className="h-full w-full z-10" zoomControl={false}>
            <MapResizeBridge />
            
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Render Incidents from state */}
            {safeReports.map((report, idx) => {
              const coords = getCoordinates(report, idx);
              const type = (report.emergencyType || "others").toLowerCase();
              const status = (report.status || "pending").toLowerCase();
              const typeInfo = TYPE_ICONS[type] || TYPE_ICONS.others;
              const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.pending;
              const isResolved = status === "resolved" || status === "closed";
              const pinId = getIncidentId(report, idx);

              return (
                <CircleMarker
                  key={report._id || idx}
                  center={coords}
                  radius={11}
                  pathOptions={{
                    color: isResolved ? "#10b981" : "#ef4444",
                    fillColor: "#ffffff",
                    fillOpacity: 1,
                    weight: 3,
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px] text-slate-800">
                      <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{pinId}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isResolved ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-red-50 border-red-100 text-red-600"}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-slate-800">
                        <span className={typeInfo.color}>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-2">
                        {typeof report.location === "string" ? report.location : (report.location?.name || "Unknown Location")}
                      </p>
                      <div className="text-[9px] bg-slate-50 rounded-lg p-1.5 space-y-0.5 border border-slate-100">
                        <p className="text-slate-400">Caller: <span className="text-slate-600 font-bold">{report.userId?.fullName || "Anonymous Caller"}</span></p>
                        <p className="text-slate-400">Contact: <span className="text-slate-600 font-semibold">{report.userId?.phoneNumber || "No record"}</span></p>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* Render Mock Responder Units */}
            {mockUnits.map((unit, idx) => (
              <CircleMarker
                key={`unit-${idx}`}
                center={unit.coords}
                radius={9}
                pathOptions={{
                  color: "#1e3a8a", // Navy color (landing page theme)
                  fillColor: "#3b82f6",
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[150px] text-slate-800">
                    <p className="text-xs font-bold text-[#0a1e3f]">{unit.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">{unit.status}</p>
                    <div className="h-px bg-slate-100 my-1.5"></div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                      </svg>
                      <span>Telemetry active</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            <ZoomControl position="bottomright" />
          </MapContainer>

          {/* Area label */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm z-[500]">
            <p className="text-xs font-bold text-slate-700">Calbayog City, Samar</p>
            <p className="text-[10px] text-slate-400 mt-0.5">PNP Jurisdiction Area</p>
          </div>
        </div>
      </div>
    </div>
  );
}
