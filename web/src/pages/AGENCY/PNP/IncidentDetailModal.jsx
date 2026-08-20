import { getIncidentId, getPriority } from "../../../utils/incidentFormatters.js";

const BRAND = "#7c3aed";

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

  const rows = [
    { label: "Incident ID", value: getIncidentId(report), mono: true },
    { label: "Reporter", value: report.userId?.fullName || "Anonymous" },
    { label: "Contact No.", value: phone ?? "N/A", mono: !!phone },
    { label: "Type", value: report.emergencyType || "Others", capitalize: true },
    { label: "Location", value: location },
    { label: "Status", value: report.status || "pending", capitalize: true },
    { label: "Priority", value: getPriority(report), capitalize: true },
    { label: "Date & Time", value: dateStr },
  ];

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
        <div className="p-4 space-y-3">
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
