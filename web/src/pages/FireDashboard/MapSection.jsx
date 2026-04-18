import { useEffect, useState, useRef } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "../../lib/cn.js";
import { CloseIcon, ExpandIcon } from "./icons.jsx";
import { SectionHeader } from "./SharedUI.jsx";
import api from "../../api/axios.js";
import { io } from "socket.io-client";

const cityCenter = [12.068, 124.597];

const shellCard = "overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/80 shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl";
const innerCard = "rounded-[24px] border border-white/10 bg-white/5";

const mapPinTone = {
  danger: "bg-red-500 shadow-[0_0_0_8px_rgba(239,68,68,0.12)]",
  yellow: "bg-red-400 shadow-[0_0_0_8px_rgba(239,68,68,0.12)]",
  neutral: "bg-stone-300 shadow-[0_0_0_8px_rgba(214,211,209,0.12)]",
  success: "bg-emerald-400 shadow-[0_0_0_8px_rgba(34,197,94,0.12)]",
};

const markerStyle = {
  danger: { color: "#fecaca", fillColor: "#ef4444" },
  yellow: { color: "#fde68a", fillColor: "#facc15" },
  neutral: { color: "#e7e5e4", fillColor: "#d6d3d1" },
  success: { color: "#bbf7d0", fillColor: "#4ade80" },
};

function MapResizeBridge({ refreshKey }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

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
      <section id="map-report" className={cn(shellCard, "h-full flex flex-col")}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <SectionHeader
            eyebrow="Map Report"
            title="City coverage and hotspots"
            description="View the live distribution of emergency responding grid exclusively for Fire reports."
            action={
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-red-100 transition hover:bg-red-400/15 hover:text-red-50"
              >
                <ExpandIcon className="h-4 w-4" />
                Open fullscreen
              </button>
            }
          />
        </div>

        <div className="flex-1 relative bg-zinc-950/80">
          <MapView interactive={true} mapKey="map-live" pins={pins} />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.12),transparent_40%),linear-gradient(180deg,rgba(9,9,11,0.02),rgba(9,9,11,0.26))] z-[400]" />

          <div className="absolute left-6 top-6 flex flex-col gap-2 z-[400]">
            <span className="inline-flex max-w-max items-center rounded-full border border-red-500/30 bg-red-500/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-red-100 shadow-xl backdrop-blur-md">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-red-400"></span>
              Live Tracking
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 top-auto z-[400]">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {pins.map((pin) => {
                const tone = pin.status === "Closed" ? "success" : "danger";
                return (
                  <div
                    key={pin._id || pin.id}
                    className={cn(
                      "min-w-[#280px] shrink-0 rounded-2xl border px-4 py-3 shadow-[0_18px_28px_rgba(0,0,0,0.42)] backdrop-blur-xl",
                      tone === "danger"
                        ? "border-red-500/20 bg-red-500/10 text-red-100"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-100">{pin.emergencyType}</p>
                        <p className="max-w-[200px] truncate mt-1 text-xs text-stone-200/80">{pin.description || "Incoming Call"}</p>
                      </div>
                      <span className={cn("mt-1 h-3 w-3 shrink-0 rounded-full", mapPinTone[tone])} />
                    </div>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-200/60">
                      {pin.status || "Ongoing"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>



      {isFullscreen ? (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 sm:p-6" onClick={() => setIsFullscreen(false)}>
          <div
            className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-400">Fullscreen map</p>
                <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.04em] text-stone-50">
                  Interactive incident map
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-100"
              >
                <CloseIcon className="h-4 w-4" />
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <MapView interactive={true} mapKey="map-fullscreen" pins={pins} />
            </div>
          </div>
        </div>
      ) : null}

      {liveAlert ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm pointer-events-none transition-all duration-500">
          <div className="pointer-events-auto flex max-w-md flex-col items-center gap-4 rounded-[28px] border border-red-500/20 bg-red-500/10 p-8 shadow-[0_40px_100px_rgba(239,68,68,0.3)] backdrop-blur-xl animate-in zoom-in-95 duration-300">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-red-500 animate-pulse">
              <span className="text-white font-black text-2xl">!</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-200">New Emergency Alert</p>
              <h3 className="mt-2 font-display text-3xl font-bold text-stone-50">{liveAlert.emergencyType}</h3>
              <p className="mt-3 text-base text-stone-200">{liveAlert.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setLiveAlert(null)}
              className="mt-4 rounded-xl bg-red-500 px-6 py-3 font-bold text-white shadow-lg hover:bg-red-400 active:scale-95 transition-all"
            >
              Acknowledge
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default MapSection;
