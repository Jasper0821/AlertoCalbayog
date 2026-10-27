import { useState } from "react";

const REASONS = [
  "Duplicate of another report",
  "Not an emergency",
  "False or prank report",
  "Outside Calbayog City",
  "Other",
];

/**
 * Rejecting used to happen the instant "Rejected" was picked in a status dropdown,
 * with no confirmation and no reason. A real emergency could be dismissed by a
 * mis-click, and the reporter was never told why. The reason chosen here is saved
 * on the report and sent to the reporter.
 */
export default function RejectReportModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);

  const finalReason = reason === "Other" ? detail.trim() : [reason, detail.trim()].filter(Boolean).join(" — ");
  const canSubmit = reason && (reason !== "Other" || detail.trim()) && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSubmit(finalReason.slice(0, 200));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reject-title">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 id="reject-title" className="text-base font-black text-slate-900">Reject this report?</h3>
          <p className="mt-1 text-xs text-slate-500">
            The reporter is told it was not accepted, with the reason you choose.
          </p>
        </div>

        <fieldset className="space-y-2 px-5 py-4">
          <legend className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Reason</legend>
          {REASONS.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                reason === option ? "border-red-300 bg-red-50 text-red-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="reject-reason"
                value={option}
                checked={reason === option}
                onChange={() => setReason(option)}
                className="accent-red-600"
              />
              {option}
            </label>
          ))}
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value.slice(0, 150))}
            rows={2}
            placeholder={reason === "Other" ? "Describe the reason (required)" : "Add detail (optional)"}
            aria-label="Reason detail"
            className="mt-1 w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </fieldset>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 disabled:opacity-50"
          >
            Keep report
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Rejecting…" : "Reject report"}
          </button>
        </div>
      </div>
    </div>
  );
}
