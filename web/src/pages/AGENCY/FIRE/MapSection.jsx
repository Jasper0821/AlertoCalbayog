import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CloseIcon, ExpandIcon, BoltIcon, MapIcon } from "./icons.jsx";
import { SectionHeader, shellCard, innerCard, pillBase, statusChip } from "./SharedUI.jsx";

const cityCenter = [12.068, 124.597];

const markerStyle = {
  danger: { color: "#ef4444", fillColor: "#ffffff" },
  yellow: { color: "#f59e0b", fillColor: "#ffffff" },
  neutral: { color: "#64748b", fillColor: "#ffffff" },
  success: { color: "#10b981", fillColor: "#ffffff" },
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
        const markerMode = (pin.status === "Closed" || pin.status === "resolved") ? "success" : "danger";
        const marker = markerStyle[markerMode] || markerStyle.danger;
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
                  <span className={`${pillBase} ${pin.status === "pending" || pin.status === "responding" ? statusChip.danger : statusChip.success}`}>
                    {pin.status || "Ongoing"}
                  </span>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-300">
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

function MapSection({ reports: pins = [], isOffline }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveAlert, setLiveAlert] = useState(null);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => { if (e.key === "Escape") setIsFullscreen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  return (
    <>
      <section id="map-report" className={`${shellCard} flex flex-col`}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-8 py-6">
          <SectionHeader
            title="Live Grid"
            description="Access the secure city-wide emergency distribution terminal."
            action={isOffline ? <span className="text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-950/20 px-4 py-1.5 rounded-full border border-red-100 dark:border-red-900/30 uppercase tracking-widest">Offline Mode</span> : <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-widest">Database Sync Active</span>}
          />
        </div>

        <div className="flex-1 w-full relative z-0 min-h-[600px]">
           <MapView interactive={true} mapKey="map-inline" pins={pins} />
           
           <button
             type="button"
             onClick={() => setIsFullscreen(true)}
             className="absolute bottom-6 right-6 z-[400] flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 shadow-2xl transition-all hover:bg-black dark:hover:bg-slate-100 hover:scale-[1.05] active:scale-95"
           >
             <ExpandIcon className="h-4 w-4" />
             Expand to Hub
           </button>
        </div>
      </section>

      {isFullscreen ? (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 animate-in fade-in duration-500 overflow-hidden">
          <div className="absolute top-8 left-8 z-[1000]">
            <button 
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 pr-6 rounded-2xl shadow-2xl hover:scale-105 transition-all group active:scale-95"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5 transition-transform group-hover:-translate-x-1">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Back to Hub</p>
                <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase transition-colors">Exit Terminal</p>
              </div>
            </button>
          </div>

          <div className="h-full w-full">
            <MapView interactive={true} mapKey="map-fullscreen" pins={pins} />
            <div className="pointer-events-none absolute inset-0 z-[400] ring-inset ring-[40px] ring-white/10 dark:ring-black/20 opacity-50" />
            <div className="pointer-events-none absolute inset-0 z-[400] bg-[radial-gradient(circle_at_center,transparent_40%,rgba(255,255,255,0.05)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.2)_100%)]" />
          </div>

          <div className="absolute bottom-10 left-10 right-10 top-auto z-[1000] pointer-events-none">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide pointer-events-auto">
              {pins.map((pin) => (
                  <div
                    key={pin.id || pin._id}
                    className="bg-slate-900/95 dark:bg-slate-900 border border-slate-800 dark:border-slate-700 p-6 rounded-[32px] shadow-2xl min-w-[320px] backdrop-blur-xl"
                  >
                     <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">{pin.emergencyType}</p>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[220px]">{pin.description || "Active Alert"}</h4>
                          <p className="mt-2 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{pin.location?.name || "Sector Alpha"}</p>
                        </div>
                        <div className={`h-2.5 w-2.5 rounded-full ${pin.status === "pending" || pin.status === "responding" ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(239,68,68,0.5)]`} />
                     </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {liveAlert ? (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-xl pointer-events-none transition-all duration-700">
          <div className="pointer-events-auto flex max-w-md flex-col items-center gap-6 rounded-[56px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 shadow-[0_40px_120px_rgba(0,0,0,0.1)] transition-all animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="grid h-20 w-20 place-items-center rounded-[32px] bg-red-600 shadow-2xl shadow-red-600/30 animate-bounce">
              <BoltIcon className="h-10 w-10 text-white" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-4">Urgent Database Update</p>
              <h3 className="font-display text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-[0.9]">{liveAlert.emergencyType} Alert</h3>
              <p className="mt-6 text-lg font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{liveAlert.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setLiveAlert(null)}
              className="mt-4 h-16 w-full rounded-2xl bg-slate-900 dark:bg-white px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 shadow-2xl shadow-slate-900/20 hover:bg-black dark:hover:bg-slate-100 active:scale-95 transition-all"
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

