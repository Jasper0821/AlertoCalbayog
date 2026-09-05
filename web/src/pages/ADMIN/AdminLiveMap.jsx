import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AGENCY_STYLES,
  getAgencyStyle,
  getRespondingAgency,
  getIncidentId,
  formatLocationForTable,
  directionsUrl,
  accuracyLabel,
} from "../../utils/incidentFormatters.js";

const CITY_CENTER = [12.068, 124.597];

// Inner glyph per emergency type, drawn white on the agency-coloured pin.
const TYPE_GLYPHS = {
  fire: `<path d="M22 4c0 0-6 4-6 11c0 4 2.5 7 6 7s6-3 6-7c0-7-6-11-6-11z" fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
         <path d="M19.5 18c0 1.5 1 3 2.5 3s2.5-1.5 2.5-3c0-2-2.5-4-2.5-4s-2.5 2-2.5 4z" fill="white" opacity="0.75"/>`,
  flood: `<path d="M12 14c2-1.5 4 1 6 0s4-1.5 6 0" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 18.5c2-1.5 4 1 6 0s4-1.5 6 0" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 23c2-1.5 4 1 6 0s4-1.5 6 0" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
  medical: `<rect x="16" y="10" width="12" height="12" rx="2" fill="none" stroke="white" stroke-width="1.8"/>
            <path d="M22 13v6" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M19 16h6" stroke="white" stroke-width="2.2" stroke-linecap="round"/>`,
  crime: `<path d="M22 9l6 3v5c0 4-2.6 6.6-6 7.5c-3.4-0.9-6-3.5-6-7.5v-5z" fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M19.5 16.5l1.8 1.8l3.2-3.4" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  others: `<path d="M22 10v5" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
           <circle cx="22" cy="19" r="1.3" fill="white"/>`,
};

const TYPE_LABELS = {
  fire: "Fire",
  flood: "Flood",
  medical: "Medical",
  crime: "Crime",
  emergency: "Others",
  others: "Others",
};

const STATUS_FILTERS = [
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "responding", label: "Responding" },
  { id: "all", label: "All" },
];

function normalizeType(emergencyType) {
  const raw = (emergencyType || "others").toLowerCase().trim();
  if (raw === "emergency") return "others";
  return TYPE_GLYPHS[raw] ? raw : "others";
}

// Leaflet needs an explicit size recalculation when it mounts inside a flex layout.
function MapResizeBridge() {
  const map = useMap();
  useEffect(() => {
    const timers = [100, 300, 600].map((ms) => setTimeout(() => map.invalidateSize(), ms));
    return () => timers.forEach(clearTimeout);
  }, [map]);
  return null;
}

function buildPin(color, type, isPulsing) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:34px;height:44px;filter:drop-shadow(0 3px 7px rgba(0,0,0,0.35));cursor:pointer;">
        ${isPulsing ? `<div class="map-sonar-wave" style="color:${color};position:absolute;left:17px;top:16px;"></div>` : ""}
        <svg viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg"
             style="position:absolute;top:0;left:0;width:34px;height:44px;z-index:1;">
          <path d="M22 2C12.06 2 4 10.06 4 20c0 7.5 5.5 15 10.5 21C18.5 45.5 22 51 22 51s3.5-5.5 7.5-10C34.5 35 40 27.5 40 20C40 10.06 31.94 2 22 2z"
            fill="${color}" stroke="white" stroke-width="2.5"/>
          ${TYPE_GLYPHS[type] || TYPE_GLYPHS.others}
        </svg>
      </div>`,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -46],
  });
}

export default function AdminLiveMap({ reports = [], onViewReport }) {
  const [isSatellite, setIsSatellite] = useState(false);
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const visibleReports = useMemo(() => {
    const list = Array.isArray(reports) ? reports : [];

    return list.filter((report) => {
      const status = (report.status || "").toLowerCase();

      // Terminal incidents are never plotted — the map is an operational picture.
      if (["resolved", "closed", "cancelled", "rejected"].includes(status)) return false;

      if (statusFilter === "pending" && status !== "pending") return false;
      if (statusFilter === "responding" && !["responding", "active"].includes(status)) return false;

      if (agencyFilter !== "all") {
        const { agency } = getRespondingAgency(report);
        if (agencyFilter === "unassigned" ? agency !== null : agency !== agencyFilter) return false;
      }

      return true;
    });
  }, [reports, agencyFilter, statusFilter]);

  // Counts drive the filter pills so an admin can see the split without changing view.
  const agencyCounts = useMemo(() => {
    const counts = { BFP: 0, CDRRMO: 0, PNP: 0, unassigned: 0 };
    (Array.isArray(reports) ? reports : []).forEach((report) => {
      const status = (report.status || "").toLowerCase();
      if (["resolved", "closed", "cancelled", "rejected"].includes(status)) return;
      const { agency } = getRespondingAgency(report);
      if (agency) counts[agency] += 1;
      else counts.unassigned += 1;
    });
    return counts;
  }, [reports]);

  // Reports without usable GPS get a deterministic offset so they stay put between
  // renders instead of jumping around the city centre.
  const getCoordinates = (report, index) => {
    const lat = Number(report.location?.latitude);
    const lng = Number(report.location?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      return [lat, lng];
    }
    const offsets = [
      [0.003, -0.004], [-0.001, 0.002], [0.006, 0.008], [-0.004, -0.006],
      [0.002, 0.005], [-0.003, 0.007], [0.005, -0.002],
    ];
    const offset = offsets[index % offsets.length];
    return [CITY_CENTER[0] + offset[0], CITY_CENTER[1] + offset[1]];
  };

  const agencyPills = [
    { id: "all", label: "All Agencies", color: "#0f172a", count: visibleReports.length },
    { id: "BFP", label: "BFP", color: AGENCY_STYLES.BFP.color, count: agencyCounts.BFP },
    { id: "CDRRMO", label: "CDRRMO", color: AGENCY_STYLES.CDRRMO.color, count: agencyCounts.CDRRMO },
    { id: "PNP", label: "PNP", color: AGENCY_STYLES.PNP.color, count: agencyCounts.PNP },
    { id: "unassigned", label: "Unassigned", color: AGENCY_STYLES.UNASSIGNED.color, count: agencyCounts.unassigned },
  ];

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      {/* Filter bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {agencyPills.map((pill) => {
            const isActive = agencyFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setAgencyFilter(pill.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? "border-transparent text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
                style={isActive ? { backgroundColor: pill.color } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: isActive ? "rgba(255,255,255,0.85)" : pill.color }}
                />
                {pill.label}
                <span className={`text-[10px] font-black ${isActive ? "text-white/80" : "text-slate-400"}`}>
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.id}
              onClick={() => setStatusFilter(option.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                statusFilter === option.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
        <MapContainer center={CITY_CENTER} zoom={13} className="h-full w-full z-10" zoomControl={false}>
          <MapResizeBridge />
          {isSatellite ? (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps Satellite"
            />
          ) : (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          )}

          {visibleReports.map((report, idx) => {
            const coords = getCoordinates(report, idx);
            const type = normalizeType(report.emergencyType);
            const status = (report.status || "pending").toLowerCase();
            const { agency, confirmed, notified } = getRespondingAgency(report);
            const style = getAgencyStyle(agency);
            const isResponding = ["responding", "active"].includes(status);

            return (
              <Marker
                key={report._id || idx}
                position={coords}
                icon={buildPin(style.color, type, isResponding)}
              >
                <Popup>
                  <div className="min-w-[250px] p-1 text-slate-800">
                    <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {getIncidentId(report, idx)}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                          isResponding
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isResponding ? "Responding" : "Pending"}
                      </span>
                    </div>

                    <p className="mb-2 text-sm font-black text-slate-900">
                      {TYPE_LABELS[type] || "Incident"} Emergency
                    </p>

                    {/* The question this map exists to answer */}
                    <div className="mb-2 rounded-xl border p-2.5" style={{ borderColor: `${style.color}40`, background: `${style.color}0d` }}>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {confirmed ? "Responding Agency" : "Awaiting Response"}
                      </p>
                      <p className="mt-0.5 text-sm font-black" style={{ color: style.color }}>
                        {confirmed ? style.label : "No agency has taken this yet"}
                      </p>
                      {notified.length > 0 && (
                        <p className="mt-1 text-[10px] font-semibold text-slate-500">
                          Alerted: {notified.join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="my-2 space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px]">
                      <p className="font-bold text-slate-700">{formatLocationForTable(report.location)}</p>
                      {accuracyLabel(report) && (
                        <p className="text-[10px] text-slate-400">GPS accuracy {accuracyLabel(report)}</p>
                      )}
                    </div>

                    {directionsUrl(report) && (
                      <a
                        href={directionsUrl(report)}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-2 block w-full rounded-lg bg-slate-900 px-3 py-2 text-center text-[11px] font-black text-white transition hover:bg-slate-700"
                      >
                        NAVIGATE HERE
                      </a>
                    )}

                    <div className="space-y-0.5 rounded-lg border border-slate-100 bg-slate-50 p-2 text-[10px]">
                      <p className="text-slate-400">
                        Caller: <span className="font-bold text-slate-700">{report.userId?.fullName || "Anonymous"}</span>
                      </p>
                      <p className="text-slate-400">
                        Contact: <span className="font-semibold text-slate-700">{report.userId?.phoneNumber || "No record"}</span>
                      </p>
                      <p className="text-slate-400">
                        Reported:{" "}
                        <span className="font-semibold text-slate-700">
                          {report.createdAt ? new Date(report.createdAt).toLocaleString() : "Unknown"}
                        </span>
                      </p>
                    </div>

                    {onViewReport && (
                      <button
                        onClick={() => onViewReport(report, idx)}
                        className="mt-2.5 w-full rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-black text-white transition hover:bg-slate-700"
                      >
                        VIEW FULL REPORT
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <ZoomControl position="bottomright" />
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[500] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
          <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Responding Agency</p>
          <div className="space-y-1.5">
            {["BFP", "CDRRMO", "PNP", "UNASSIGNED"].map((key) => (
              <div key={key} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: AGENCY_STYLES[key].color }} />
                <span className="text-[11px] font-bold text-slate-600">{AGENCY_STYLES[key].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live counter */}
        <div className="absolute top-4 left-4 z-[500] flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <p className="text-xs font-bold text-slate-700">
            {visibleReports.length} incident{visibleReports.length !== 1 ? "s" : ""} on map
          </p>
        </div>

        <button
          onClick={() => setIsSatellite(!isSatellite)}
          className="absolute top-4 right-4 z-[500] flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-xs font-bold text-slate-700 shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-50"
        >
          {isSatellite ? "Standard View" : "Satellite View"}
        </button>

        {visibleReports.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center">
            <div className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 text-center shadow-lg backdrop-blur-sm">
              <p className="text-sm font-bold text-slate-600">No incidents match these filters</p>
              <p className="mt-1 text-xs text-slate-400">Try a different agency or status</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
