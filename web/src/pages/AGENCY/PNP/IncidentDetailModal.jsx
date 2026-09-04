import { useState, useEffect } from "react";
import { getIncidentId, getPriority } from "../../../utils/incidentFormatters.js";
import api from "../../../api/axios.js";

const BRAND = "#7c3aed";

function EvidenceGalleryItem({ src, index, onOpen }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onOpen(src)}
      className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 group hover:ring-2 hover:ring-violet-400 transition-all bg-slate-100"
    >
      {!loaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <svg className="w-5 h-5 text-slate-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
        </div>
      )}
      <img
        src={src}
        alt={`Evidence ${index + 1}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover group-hover:scale-105 transition-all duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </span>
    </button>
  );
}

function EvidenceGallery({ images }) {
  const [lightbox, setLightbox] = useState(null);
  return (
    <>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {images.map((src, i) => (
          <EvidenceGalleryItem key={i} src={src} index={i} onOpen={setLightbox} />
        ))}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors" onClick={() => setLightbox(null)}>
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <img src={lightbox} alt="Fullscreen evidence" loading="lazy" decoding="async" className="max-h-[88vh] max-w-full rounded-xl shadow-2xl object-contain animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

/**
 * Shared compact incident detail modal for all PNP dashboard sections.
 * Usage: <IncidentDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
 */
export default function IncidentDetailModal({ report: initialReport, onClose }) {
  const [fullReport, setFullReport] = useState(initialReport);

  useEffect(() => {
    setFullReport(initialReport);
    if (initialReport?._id && (!initialReport.proofPhotos || !initialReport.resolutionEvidence)) {
      api.get(`/emergency/${initialReport._id}`)
        .then((res) => {
          if (res.data?._id) setFullReport(res.data);
        })
        .catch((err) => console.warn("Failed to load full report details:", err));
    }
  }, [initialReport]);

  const report = fullReport || initialReport;
  if (!report) return null;

  const phone = report.userId?.phoneNumber || report.phoneNumber || null;
  const location =
    report.location?.name ||
    [report.location?.barangay, report.location?.street, report.location?.purok]
      .filter(Boolean)
      .join(", ") ||
    (typeof report.location === "string" ? report.location : "Unknown");

  const dateStr = report.createdAt
    ? new Date(report.createdAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })
    : "Unknown";

  // Fallback: show agency name if no individual is assigned yet
  const agencyFallback = report.assignedAgency && report.assignedAgency !== "NONE"
    ? report.assignedAgency
    : (report.notifiedAgencies || []).join(", ") || "None";

  const responderVal = report.assignedResponder
    ? `${report.assignedResponder.fullName} (${report.assignedResponder.agency || agencyFallback})`
    : agencyFallback;

  const rows = [
    { label: "Incident ID", value: getIncidentId(report), mono: true },
    { label: "Reporter", value: report.userId?.fullName || "Anonymous" },
    { label: "Contact No.", value: phone ?? "N/A", mono: !!phone },
    { label: "Type", value: report.emergencyType || "Others", capitalize: true },
    { label: "Location", value: location },
    { label: "Status", value: report.status || "pending", capitalize: true },
    { label: "Priority", value: getPriority(report), capitalize: true },
    { label: "Responder", value: responderVal },
    { label: "Date & Time", value: dateStr },
  ];

  const proofPhotos = Array.isArray(report.proofPhotos) ? report.proofPhotos : [];
  const evidence = Array.isArray(report.resolutionEvidence) ? report.resolutionEvidence : [];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xs rounded-xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: BRAND }}
        >
          <span className="text-white font-bold text-sm">Incident Details</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof onClose === "function") onClose();
            }}
            className="p-1.5 -mr-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer z-20"
            aria-label="Close modal"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
          {rows.map(({ label, value, mono, capitalize }) => (
            <div key={label} className="flex justify-between gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0 mt-0.5">
                {label}
              </span>
              <span
                className={`text-xs font-semibold text-slate-800 text-right ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`}
              >
                {value}
              </span>
            </div>
          ))}

          {report.description && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Description
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">{report.description}</p>
            </div>
          )}

          {/* Resident Proof Photos */}
          {proofPhotos.length > 0 && (
            <div>
              <span className="text-[10px] font-bold font-mono text-purple-600 uppercase tracking-wide block mb-1">
                📸 Resident Proof Photos ({proofPhotos.length})
              </span>
              <EvidenceGallery images={proofPhotos} />
            </div>
          )}

          {/* Resolution Evidence */}
          {evidence.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                📷 Resolution Evidence ({evidence.length})
              </span>
              <EvidenceGallery images={evidence} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof onClose === "function") onClose();
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
