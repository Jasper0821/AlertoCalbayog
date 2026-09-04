import { useState, useEffect, useRef, useCallback } from "react";
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
 * 
 * Photos are loaded separately from report metadata to prevent the browser
 * main thread from freezing when massive Base64 strings arrive. The close
 * button stays responsive at all times.
 */
export default function IncidentDetailModal({ report: initialReport, onClose }) {
  // Store the report metadata (text fields) — lightweight, renders instantly
  const report = initialReport;

  // Store photos in SEPARATE state so they render independently
  const [proofPhotos, setProofPhotos] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Use a ref for onClose so the close handler is never stale during heavy renders
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleClose = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof onCloseRef.current === "function") onCloseRef.current();
  }, []);

  // Fetch photos separately on mount — staggered so the UI stays responsive
  useEffect(() => {
    if (!initialReport?._id) return;

    // If the report already has photos (e.g. from cache), use them directly
    if (Array.isArray(initialReport.proofPhotos) && initialReport.proofPhotos.length > 0) {
      setProofPhotos(initialReport.proofPhotos);
      setEvidence(Array.isArray(initialReport.resolutionEvidence) ? initialReport.resolutionEvidence : []);
      return;
    }

    let cancelled = false;
    setPhotosLoading(true);

    api.get(`/emergency/${initialReport._id}`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        if (!data?._id) return;

        // Feed photos into state one-at-a-time with small delays
        // so each image gets its own render frame and doesn't freeze the UI
        const photos = Array.isArray(data.proofPhotos) ? data.proofPhotos : [];
        const resEvidence = Array.isArray(data.resolutionEvidence) ? data.resolutionEvidence : [];

        if (photos.length === 0 && resEvidence.length === 0) {
          setPhotosLoading(false);
          return;
        }

        // Render photos one by one on separate animation frames
        let idx = 0;
        const allPhotos = [...photos];

        const feedNext = () => {
          if (cancelled) return;
          if (idx < allPhotos.length) {
            idx++;
            setProofPhotos(allPhotos.slice(0, idx));
            requestAnimationFrame(feedNext);
          } else {
            // Now feed evidence photos
            if (resEvidence.length > 0) {
              setEvidence(resEvidence);
            }
            setPhotosLoading(false);
          }
        };

        // Start feeding after a small delay so the modal is fully interactive first
        setTimeout(() => requestAnimationFrame(feedNext), 100);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("Failed to load full report details:", err);
          setPhotosLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [initialReport?._id]);

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

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-xs rounded-xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 relative"
          style={{ background: BRAND }}
        >
          <span className="text-white font-bold text-sm">Incident Details</span>
          <button
            type="button"
            onClick={handleClose}
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

          {/* Loading indicator for photos */}
          {photosLoading && proofPhotos.length === 0 && (
            <div className="flex items-center gap-2 py-3">
              <svg className="w-4 h-4 text-purple-500 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wide">Loading proof photos…</span>
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
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
