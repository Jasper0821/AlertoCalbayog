import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Live Map</h1>
        <p className="text-sm text-slate-500 mt-0.5">Real-time geospatial view of PNP crime incidents.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Map Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#0a1e3f", display: "inline-block" }}></span>
              <span className="text-xs font-semibold text-slate-600">Crime Incidents</span>
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

              const pnpIcon = L.divIcon({
                className: '',
                html: `<div style="width:36px;height:36px;background:#0a1e3f;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.35)">
                         <svg style="width:16px;height:16px" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                       </div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
              });

              return (
                <Marker
                  key={report._id || idx}
                  position={coords}
                  icon={pnpIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[220px] text-slate-800">
                      <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{pinId}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isResolved ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-red-50 border-red-100 text-red-600"}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-800">
                        <span className={typeInfo.color}>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </div>
                      
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
            <p className="text-[10px] text-slate-400 mt-0.5">PNP Jurisdiction Area</p>
          </div>
        </div>
      </div>
    </div>
  );
}
