import { useState } from "react";
import { getIncidentId, getPriority } from "../../../utils/incidentFormatters.js";

const BRAND = "#7c3aed";

function EvidenceGallery({ images }) {
  const [lightbox, setLightbox] = useState(null);
  return (
    <>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox(src)}
            className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 group hover:ring-2 hover:ring-violet-400 transition-all"
          >
            <img src={src} alt={`Evidence ${i + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
            <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
          </button>
        ))}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightbox(null)}>
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <img src={lightbox} alt="Fullscreen evidence" className="max-h-[88vh] max-w-full rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

/**
 * Shared compact incident detail modal for all PNP dashboard sections.
 * Usage: <IncidentDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
 */
export default function IncidentDetailModal({ report, onClose }) {
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
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
