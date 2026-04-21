import { useEffect, useState, useRef } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CloseIcon, ExpandIcon, BoltIcon, MapIcon } from "./icons.jsx";
import { SectionHeader, shellCard, innerCard } from "./SharedUI.jsx";
import api from "../../api/axios.js";
import { io } from "socket.io-client";

const cityCenter = [12.068, 124.597];

const mapPinTone = {
  danger: "bg-red-500 shadow-[0_0_0_8px_rgba(239,68,68,0.12)]",
  yellow: "bg-red-400 shadow-[0_0_0_8px_rgba(239,68,68,0.12)]",
  neutral: "bg-stone-300 shadow-[0_0_0_8px_rgba(214,211,209,0.12)]",
  success: "bg-emerald-400 shadow-[0_0_0_8px_rgba(34,197,94,0.12)]",
};

const markerStyle = {
  danger: { color: "#ef4444", fillColor: "#ffffff" },
  yellow: { color: "#f59e0b", fillColor: "#ffffff" },
  neutral: { color: "#64748b", fillColor: "#ffffff" },
  success: { color: "#10b981", fillColor: "#ffffff" },
};

function MapResizeBridge({ refreshKey }) {
  const map = useMap();

  useEffect(() => {
    // Longer timeout to wait for modal transition
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [map, refreshKey]);

  return null;
}

function MapView({ interactive, mapKey, pins }) {
  return (
    <MapContainer
      key={mapKey}
      center={cityCenter}
      zoom={interactive ? 14 : 13}
      className="h-full w-full"
      zoomControl={false}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      keyboard={interactive}
      attributionControl={false}
    >
      <MapResizeBridge refreshKey={mapKey} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {pins.map((pin) => {
        const markerMode = pin.status === "Closed" ? "success" : "danger";
        const marker = markerStyle[markerMode];
        const coordinates = pin.location && pin.location.latitude ? [pin.location.latitude, pin.location.longitude] : cityCenter;

        return (
          <CircleMarker
            key={pin._id || pin.id}
            center={coordinates}
            radius={interactive ? 12 : 10}
            pathOptions={{
              color: marker.color,
              fillColor: marker.fillColor,
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup autoPan closeButton={interactive}>
              <div className="grid min-w-[200px] gap-2 text-slate-900">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{pin.emergencyType}</p>
                <p className="text-sm font-semibold text-slate-900">{pin.description || "No description"}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
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

      {interactive ? <ZoomControl position="bottomright" /> : null}
    </MapContainer>
  );
}

function MapSection() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pins, setPins] = useState([]);
  const [liveAlert, setLiveAlert] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await api.get("/emergency");
        // Ensure we only retrieve fire events as per instruction
        const fireIncidents = response.data.filter((inc) => inc.emergencyType?.toLowerCase() === "fire");
        setPins(fireIncidents);
      } catch (err) {
        console.error("Error fetching incidents", err);
      }
    };
    fetchIncidents();
  }, []);

  useEffect(() => {
    // Implement real Socket.io connection using existing database node
    const socket = io("http://localhost:5000");
    
    socket.on("connect", () => {
      console.log("Connected to Realtime Notification server");
    });

    socket.on("newEmergencyAlert", (report) => {
      // Check if it's fire!
      if (report.emergencyType?.toLowerCase() === "fire") {
        setPins((currentPins) => [report, ...currentPins]);
        
        // Show center screen notification
        setLiveAlert(report);
        
        // Hide notification automatically after 5 sec
        setTimeout(() => {
          setLiveAlert(null);
        }, 5000);
      }
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  return (
    <>
      <section id="map-report" className={`${shellCard} flex flex-col`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <SectionHeader
            title="Live Grid"
            description="Access the secure city-wide emergency distribution terminal."
          />
        </div>

        <div className="p-12 sm:p-20 flex flex-col items-center text-center bg-slate-50/50">
          <div className="relative mb-10 group">
             <div className="absolute inset-0 bg-red-600 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
             <div className="relative grid h-32 w-32 place-items-center rounded-[40px] bg-white border border-slate-100 text-red-600 shadow-2xl transition hover:scale-105">
                <MapIcon className="h-12 w-12" />
             </div>
             <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-slate-900 border-4 border-white flex items-center justify-center text-white shadow-xl">
                <ExpandIcon className="h-4 w-4" />
             </div>
          </div>

          <h3 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none">Operational Terminal</h3>
          <p className="mt-4 max-w-md text-base font-bold text-slate-500 leading-relaxed">
            Initialize the secure interactive grid to view real-time fire response units, sector telemetry, and active incident distribution across Calbayog City.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-lg">
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="flex-1 flex h-16 items-center justify-center gap-3 rounded-[24px] bg-slate-900 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-black hover:scale-[1.02] active:scale-95"
            >
              <ExpandIcon className="h-4 w-4" />
              Launch Fullscreen Terminal
            </button>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-8 w-full max-w-2xl border-t border-slate-100 pt-12">
             <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Districts</p>
                <p className="mt-1 text-xl font-black text-slate-900 uppercase">42 Active</p>
             </div>
             <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Load</p>
                <p className="mt-1 text-xl font-black text-slate-900 uppercase">{pins.length} Alerts</p>
             </div>
             <div className="hidden sm:block text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sync Health</p>
                <p className="mt-1 text-xl font-black text-emerald-600 uppercase">Optimal</p>
             </div>
          </div>
        </div>
      </section>


      {isFullscreen ? (
        <div className="fixed inset-0 z-[100] bg-white animate-in fade-in duration-500 overflow-hidden">
          {/* MINIMALIST FLOATING BACK BUTTON */}
          <div className="absolute top-8 left-8 z-[1000]">
            <button 
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-3 bg-white border border-slate-100 p-2 pr-6 rounded-2xl shadow-2xl hover:scale-105 transition-all group active:scale-95"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5 transition-transform group-hover:-translate-x-1">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Back to Hub</p>
                <p className="text-sm font-black tracking-tight text-slate-900 uppercase">Exit Terminal</p>
              </div>
            </button>
          </div>

          {/* STATUS OVERLAY */}
          <div className="absolute top-8 right-8 z-[1000] hidden sm:block pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md border border-slate-100 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 leading-none">Full Terminal Mode</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-100" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Grid</p>
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">Active Districts</p>
                </div>
            </div>
          </div>

          {/* THE MAP */}
          <div className="h-full w-full">
            <MapView interactive={true} mapKey="map-fullscreen" pins={pins} />
            
            {/* STUDIO LIGHT OVERLAYS */}
            <div className="pointer-events-none absolute inset-0 z-[400] ring-inset ring-[40px] ring-white/10 opacity-50" />
            <div className="pointer-events-none absolute inset-0 z-[400] bg-[radial-gradient(circle_at_center,transparent_40%,rgba(255,255,255,0.05)_100%)]" />
          </div>

          {/* BOTTOM INCIDENT CARDS */}
          <div className="absolute bottom-10 left-10 right-10 top-auto z-[1000] pointer-events-none">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide pointer-events-auto">
              {pins.map((pin) => (
                  <div
                    key={pin.id || pin._id}
                    className="bg-slate-900/95 border border-slate-800 p-6 rounded-[32px] shadow-2xl min-w-[320px] backdrop-blur-xl"
                  >
                     <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">{pin.emergencyType}</p>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[220px]">{pin.description || "Active Alert"}</h4>
                          <p className="mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">{pin.location?.name || "Sector " + (pin.sector || "01")}</p>
                        </div>
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                     </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}


      {liveAlert ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-xl pointer-events-none transition-all duration-700">
          <div className="pointer-events-auto flex max-w-md flex-col items-center gap-6 rounded-[56px] border border-slate-100 bg-white p-12 shadow-[0_40px_120px_rgba(0,0,0,0.1)] transition-all animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="grid h-20 w-20 place-items-center rounded-[32px] bg-red-600 shadow-2xl shadow-red-600/30 animate-bounce">
              <BoltIcon className="h-10 w-10 text-white" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-4">Urgent Grid Notification</p>
              <h3 className="font-display text-4xl font-black tracking-tighter text-slate-900 uppercase leading-[0.9]">{liveAlert.emergencyType} Alert</h3>
              <p className="mt-6 text-lg font-bold text-slate-500 leading-relaxed">{liveAlert.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setLiveAlert(null)}
              className="mt-4 h-16 w-full rounded-2xl bg-slate-900 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-slate-900/20 hover:bg-black active:scale-95 transition-all"
            >
              Acknowledge Ops
            </button>
          </div>
        </div>
      ) : null}

    </>
  );
}

export default MapSection;
