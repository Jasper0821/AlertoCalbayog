import { useState } from "react";
import { formatLocationForTable, getIncidentId } from "../../../utils/incidentFormatters.js";
import IncidentDetailModal from "../PNP/IncidentDetailModal.jsx";
import ResolutionEvidenceModal from "../ResolutionEvidenceModal.jsx";

const TYPE_LABELS = { fire: "Fire" };
const TYPE_COLORS = {
  fire: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};
const STATUS_STYLES = {
  pending:    { dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   label: "Pending" },
  rejected:   { dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     label: "Rejected" },
  responding: { dot: "bg-indigo-500",  text: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200",  label: "Responding" },
  active:     { dot: "bg-indigo-500",  text: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200",  label: "Responding" },
  resolved:   { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Resolved" },
};

export default function QueuingSystem({ reports = [], onStatusChange }) {
  const [resolvingIncidentId, setResolvingIncidentId] = useState(null);
  const [evidenceIncidentId, setEvidenceIncidentId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Only display active queues (pending & active), resolved ones go to Incident History
  const activeReports = reports.filter(r => 
    !["closed", "rejected"].includes((r.status || "").toLowerCase())
  );

  const handleStatusSelect = (id, newStatus) => {
    if (newStatus === "resolved" || newStatus === "responded") {
      setResolvingIncidentId(id);
    } else {
      onStatusChange(id, newStatus);
    }
  };

  const statusOptions = (status) => {
    const current = (status || "pending").toLowerCase();
    if (current === "responding" || current === "active") {
      return <><option value="responding">Responding</option><option value="resolved">Resolved</option></>;
    }
    if (current === "resolved" || current === "responded") {
      return <option value="resolved">Awaiting admin closure</option>;
    }
    return <><option value="pending">Pending</option><option value="rejected">Rejected</option><option value="responding">Responding</option></>;
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">BFP Fire Incident Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage active fire emergency queues. Responded incidents move to Incident History.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            {activeReports.filter(r => (r.status || "pending").toLowerCase() === "pending").length} Pending
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            {activeReports.filter(r => ["responding", "active"].includes((r.status || "").toLowerCase())).length} Responding
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-full overflow-x-hidden overflow-y-auto lg:overflow-auto">
          <table className="block w-full text-left lg:table lg:min-w-[980px]">
            <thead className="hidden lg:sticky lg:top-0 lg:z-10 lg:table-header-group">
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Incident ID</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Reporter</th>
                <th className="px-5 py-3.5">Contact No.</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Time</th>
                <th className="px-5 py-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="block space-y-3 p-3 lg:table-row-group lg:space-y-0 lg:p-0 lg:divide-y lg:divide-slate-100">
              {activeReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-sm text-slate-400">
                    No active fire emergency reports in the queue.
                  </td>
                </tr>
              ) : (
                activeReports.map((report, idx) => {
                  const type = "fire";
                  const typeLabel = TYPE_LABELS.fire;
                  const typeStyle = TYPE_COLORS.fire;

                  const status = (report.status || "pending").toLowerCase();
                  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;

                  // Shared helper so this matches the id shown in the detail modal,
                  // history table and PDF exports instead of inventing a third scheme.
                  const incId = getIncidentId(report, idx);
                  const locationText = formatLocationForTable(report.location, report);
                  const date = report.createdAt ? new Date(report.createdAt) : new Date();

                  return (
                    <tr key={report._id || idx} className="block rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors hover:bg-slate-100 lg:table-row lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:hover:bg-slate-50/70">
                      <td className="block px-0 py-1 lg:table-cell lg:px-5 lg:py-3.5 font-mono text-xs font-bold text-slate-700">
                        {incId}
                      </td>
                      <td className="block px-0 py-1 lg:table-cell lg:px-5 lg:py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border} border`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
                          {typeLabel}
                        </span>
                      </td>
                      <td className="block px-0 py-1 lg:table-cell lg:px-5 lg:py-3.5 text-xs text-slate-600 max-w-[200px] truncate" title={locationText}>
                        {locationText}
                      </td>
                      <td className="block px-0 py-1 lg:table-cell lg:px-5 lg:py-3.5 text-xs text-slate-600">
                        {report.userId?.fullName || "Anonymous"}
                      </td>
                      <td className="block px-0 py-1 lg:table-cell lg:px-5 lg:py-3.5 text-xs font-mono text-slate-600">
                        {report.userId?.phoneNumber || report.phoneNumber || "N/A"}
                      </td>
                      <td className="block px-0 py-1 lg:table-cell lg:px-5 lg:py-3.5">
                        <select
                          value={status === "active" ? "responding" : status}
                          onChange={(e) => handleStatusSelect(report._id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {statusOptions(report.status)}
                        </select>
                      </td>
                      <td className="block px-0 py-1 lg:table-cell lg:px-5 lg:py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="block px-0 py-1 lg:table-cell lg:px-5 lg:py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Responded */}
      {resolvingIncidentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Complete Fire Incident</h3>
            <p className="mt-1 text-xs text-slate-500">Are you sure this fire emergency has been fully contained and resolved?</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setResolvingIncidentId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = resolvingIncidentId;
                  setResolvingIncidentId(null);
                  setEvidenceIncidentId(id);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Proceed to Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Evidence Modal */}
      {evidenceIncidentId && (
        <ResolutionEvidenceModal
          report={reports.find(r => r._id === evidenceIncidentId)}
          onClose={() => setEvidenceIncidentId(null)}
          onSubmit={async (images) => {
            await onStatusChange(evidenceIncidentId, "resolved", images);
            setEvidenceIncidentId(null);
          }}
        />
      )}

      <IncidentDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}
