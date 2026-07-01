import { useState, useEffect } from"react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from"react-leaflet";
import L from"leaflet";
import"leaflet/dist/leaflet.css";
import api from"../api/axios.js";

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

const TYPE_CONFIG = {
  fire:      { color: "#dc2626", label: "Fire Emergency",    svg: ICON_SVGS.fire },
  flood:     { color: "#2563eb", label: "Flood / Water",     svg: ICON_SVGS.flood },
  medical:   { color: "#059669", label: "Medical Emergency",  svg: ICON_SVGS.medical },
  crime:     { color: "#7c3aed", label: "Crime Report",      svg: ICON_SVGS.others },
  emergency: { color: "#d97706", label: "Emergency",         svg: ICON_SVGS.others },
  others:    { color: "#64748b", label: "Other Incident",    svg: ICON_SVGS.others },
};

function getTypeConfig(emergencyType) {
  const raw = (emergencyType || "others").toLowerCase().trim();
  return TYPE_CONFIG[raw] || TYPE_CONFIG.others;
}

function buildDivIcon(cfg) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:56px;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.35));cursor:pointer;">
        <svg viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg"
             style="position:absolute;top:0;left:0;width:44px;height:56px;">
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

export const pillBase ="inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]";
export const statusChip = {
 danger:"border-red-100 bg-red-50 text-red-600",
 success:"border-emerald-100 bg-emerald-50 text-emerald-600",
};

function MapResizeBridge({ refreshKey }) {
 const map = useMap();
 useEffect(() => {
 const timer = window.setTimeout(() => {
 map.invalidateSize();
 }, 250);
 return () => window.clearTimeout(timer);
 }, [map, refreshKey]);
 return null;
}

function IncidentMap() {
 const [pins, setPins] = useState([]);

 useEffect(() => {
 const fetchReports = async () => {
 try {
 const res = await api.get("/emergency");
 setPins(res.data);
 } catch (error) {
 console.error("Failed to fetch reports for map:", error);
 }
 };
 fetchReports();
 const interval = setInterval(fetchReports, 15000);
 return () => clearInterval(interval);
 }, []);

 // Filter out resolved/closed reports — they disappear from the map
 const activeReports = pins.filter((pin) => {
   const status = (pin.status || "").toLowerCase();
   return !["resolved", "closed", "responded", "cancelled"].includes(status);
 });

 return (
 <main className="relative h-dvh overflow-hidden bg-slate-50 font-sans antialiased transition-colors duration-300">
 <div className="absolute inset-0 z-0">
 <MapContainer center={cityCenter} zoom={13} className="h-full w-full" zoomControl={false}>
 <MapResizeBridge refreshKey="incident-map" />
 <TileLayer
 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
 attribution="&copy; OpenStreetMap contributors"
 />
 {activeReports.map((pin) => {
 const cfg = getTypeConfig(pin.emergencyType);
 const icon = buildDivIcon(cfg);
 const coordinates = pin.location && pin.location.latitude ? [pin.location.latitude, pin.location.longitude] : cityCenter;

 return (
 <Marker
 key={pin._id || pin.id}
 position={coordinates}
 icon={icon}
 >
 <Popup autoPan closeButton={true}>
 <div className="grid min-w-[200px] gap-2 text-slate-900">
 <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: cfg.color }}>
   <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
   {cfg.label}
 </div>
 <p className="text-[11px] font-semibold text-slate-600">📍 {typeof pin.location === 'string' ? pin.location : (pin.location?.name || `Coordinates: ${pin.location?.latitude?.toFixed(4)}, ${pin.location?.longitude?.toFixed(4)}`)}</p>
 <p className="text-sm font-semibold text-slate-900">{pin.description ||"No description"}</p>
 <div className="flex flex-wrap gap-2 pt-1">
 <span className={`${pillBase} ${pin.status ==="pending" || pin.status ==="responding" ? statusChip.danger : statusChip.success}`}>
 {pin.status ||"Ongoing"}
 </span>
 <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
 {pin.assignedAgency ||"Unit Dispatched"}
 </span>
 </div>
 </div>
 </Popup>
 </Marker>
 );
 })}
 <ZoomControl position="bottomright" />
 </MapContainer>
 </div>
 </main>
 );
}

export default IncidentMap;
