import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios.js";

const cityCenter = [12.068, 124.597];

const markerStyle = {
  danger: { color: "#ef4444", fillColor: "#ffffff" },
  yellow: { color: "#f59e0b", fillColor: "#ffffff" },
  neutral: { color: "#64748b", fillColor: "#ffffff" },
  success: { color: "#10b981", fillColor: "#ffffff" },
};

export const pillBase = "inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]";
export const statusChip = {
  danger: "border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
  success: "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
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

  return (
    <main className="relative flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased transition-colors duration-300 overflow-hidden">
      <div className="shrink-0 relative z-50">
         <Navbar />
      </div>
      
      <div className="flex-1 w-full relative z-0 mt-16 sm:mt-24">
         <MapContainer center={cityCenter} zoom={13} className="h-full w-full" zoomControl={false}>
            <MapResizeBridge refreshKey="incident-map" />
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />
            {pins.map((pin) => {
              const markerMode = (pin.status === "Closed" || pin.status === "resolved") ? "success" : "danger";
              const marker = markerStyle[markerMode] || markerStyle.danger;
              const coordinates = pin.location && pin.location.latitude ? [pin.location.latitude, pin.location.longitude] : cityCenter;

              return (
                <CircleMarker
                  key={pin._id || pin.id}
                  center={coordinates}
                  radius={12}
                  pathOptions={{
                    color: marker.color,
                    fillColor: marker.fillColor,
                    fillOpacity: 0.9,
                    weight: 2,
                  }}
                >
                  <Popup autoPan closeButton={true}>
                    <div className="grid min-w-[200px] gap-2 text-slate-900">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{pin.emergencyType}</p>
                      <p className="text-sm font-semibold text-slate-900">{pin.description || "No description"}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className={`${pillBase} ${pin.status === "pending" || pin.status === "responding" ? statusChip.danger : statusChip.success}`}>
                          {pin.status || "Ongoing"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
                          {pin.assignedAgency || "Unit Dispatched"}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
            <ZoomControl position="bottomright" />
         </MapContainer>
      </div>
    </main>
  );
}

export default IncidentMap;