import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../../api/axios.js";

const DOCUMENT_LABELS = {
  voters_id: "Voter's ID",
  voters_certification: "Voter's Certification",
};

// Shown to the resident as written, so each one says what to fix.
const REJECT_REASONS = [
  "The photo is blurry or cut off.",
  "The name on the document doesn't match the account.",
  "The selfie doesn't match the photo on the document.",
  "This isn't a Voter's ID or Voter's Certification.",
  "The address on the document isn't in Calbayog City.",
];

const formatDate = (value) => (value ? new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "—");

/** One photo. Links last 10 minutes, so a failed load points the admin to Refresh. */
function Photo({ src, label, onOpen }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure>
      <figcaption className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</figcaption>
      {failed || !src ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs font-semibold text-slate-500">
          The photo link expired or the photo is missing. Press Refresh.
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onOpen({ src, label })}
          className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 hover:border-emerald-400"
          aria-label={`Enlarge: ${label}`}
        >
          <img src={src} alt={label} onError={() => setFailed(true)} className="h-48 w-full object-contain" />
        </button>
      )}
    </figure>
  );
}

/**
 * Admin page for Voter's ID verification. Residents send a photo of their Voter's
 * ID or Voter's Certification plus a selfie holding it; approving gives them the
 * "Verified resident" tag responders see. The server deletes the photos as soon as
 * a request is approved or rejected.
 */
export default function VoterIdReview({ onReviewed, refreshKey = 0 }) {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [reviewed, setReviewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, reviewedRes] = await Promise.all([
        api.get("/voter-id/requests", { params: { status: "pending" } }),
        api.get("/voter-id/requests", { params: { status: "reviewed" } }),
      ]);
      setPending(pendingRes.data.requests || []);
      setReviewed(reviewedRes.data.requests || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "The server doesn't have Voter's ID review yet. Deploy the latest backend, then refresh this page."
          : err.response?.data?.message || "Could not load Voter's ID requests."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Reloads when the dashboard hears that a new request arrived.
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (!preview) return undefined;
    const close = (e) => e.key === "Escape" && setPreview(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [preview]);

  const decide = async (request, action, body) => {
    setBusyId(request.userId);
    try {
      const { data } = await api.post(`/voter-id/requests/${request.userId}/${action}`, body);
      onReviewed?.(request.userId, data.user);
    } catch (err) {
      setError(err.response?.data?.message || `Could not ${action} this request.`);
    } finally {
      setBusyId(null);
      // Also picks up a request another admin already decided.
      await load();
    }
  };

  const approve = async (request) => {
    const answer = await Swal.fire({
      icon: "question",
      title: `Approve ${request.fullName}?`,
      text: "They'll get the Verified resident tag that responders see on their reports. The photos will be deleted.",
      showCancelButton: true,
      confirmButtonText: "Approve",
      confirmButtonColor: "#047857",
    });
    if (answer.isConfirmed) await decide(request, "approve");
  };

  const reject = async (request) => {
    const choice = await Swal.fire({
      icon: "warning",
      title: `Reject ${request.fullName}'s request?`,
      text: "Choose the reason the resident will see. They can send new photos from their Profile.",
      input: "select",
      inputOptions: { ...Object.fromEntries(REJECT_REASONS.map((reason) => [reason, reason])), other: "Other reason…" },
      inputPlaceholder: "Choose a reason",
      inputValidator: (value) => !value && "Choose a reason",
      showCancelButton: true,
      confirmButtonText: "Reject",
      confirmButtonColor: "#b91c1c",
    });
    if (!choice.isConfirmed) return;

    let reason = choice.value;
    if (reason === "other") {
      const custom = await Swal.fire({
        title: "Reason for the resident",
        input: "textarea",
        inputPlaceholder: "Tell them what to fix, e.g. take the photo in better light.",
        inputAttributes: { maxlength: "300" },
        inputValidator: (value) => !value?.trim() && "Write a short reason",
        showCancelButton: true,
        confirmButtonText: "Reject",
        confirmButtonColor: "#b91c1c",
      });
      if (!custom.isConfirmed) return;
      reason = custom.value.trim();
    }
    await decide(request, "reject", { reason });
  };

  const tabs = [
    ["pending", `Waiting${pending.length ? ` (${pending.length})` : ""}`],
    ["reviewed", "Reviewed"],
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Voter's ID Review</h1>
          <p className="mt-0.5 max-w-3xl text-sm text-slate-500">
            Residents can send a photo of their Voter's ID or Voter's Certification and a selfie holding it. Approving
            gives them the "Verified resident" tag that responders see on reports. It never blocks anyone from
            registering or reporting, and the photos are deleted as soon as you approve or reject.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      )}

      <div role="tablist" aria-label="Voter's ID requests" className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-bold ${tab === id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pending" ? (
        pending.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            {loading ? "Loading…" : "No Voter's IDs waiting for review."}
          </p>
        ) : (
          <ul className="space-y-4">
            {pending.map((request) => {
              const documentName = DOCUMENT_LABELS[request.documentType] || "Document";
              const busy = busyId === request.userId;
              return (
                <li key={request.userId} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
                    <Photo key={request.frontUrl} src={request.frontUrl} label={`Front of ${documentName}`} onOpen={setPreview} />
                    <Photo key={request.selfieUrl} src={request.selfieUrl} label="Selfie holding it" onOpen={setPreview} />

                    <div className="space-y-3 md:col-span-2 xl:col-span-1">
                      <div>
                        <p className="text-base font-black text-slate-800">{request.fullName}</p>
                        <p className="text-xs font-semibold text-slate-500">
                          {documentName} · sent {formatDate(request.submittedAt)}
                        </p>
                      </div>

                      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                        <dt className="text-slate-400">Barangay</dt>
                        <dd className="font-semibold text-slate-700">{request.barangay ? `Brgy. ${request.barangay}` : "Not given"}</dd>
                        <dt className="text-slate-400">Address</dt>
                        <dd className="break-words font-semibold text-slate-700">{request.completeAddress || "Not given"}</dd>
                        <dt className="text-slate-400">Mobile</dt>
                        <dd className="font-semibold text-slate-700">{request.phoneNumber || "—"}</dd>
                        {request.email && (
                          <>
                            <dt className="text-slate-400">Email</dt>
                            <dd className="break-words font-semibold text-slate-700">{request.email}</dd>
                          </>
                        )}
                        <dt className="text-slate-400">Account</dt>
                        <dd className="font-semibold text-slate-700">created {formatDate(request.accountCreatedAt)}</dd>
                      </dl>

                      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                        <p className="font-black uppercase tracking-widest text-slate-400">Check before approving</p>
                        <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                          <li>The name on the document is <span className="font-bold text-slate-800">{request.fullName}</span></li>
                          <li>The face in the selfie matches the photo on the document</li>
                          <li>The address or precinct on the document is in Calbayog City</li>
                        </ul>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => approve(request)}
                          disabled={busy}
                          className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => reject(request)}
                          disabled={busy}
                          className="rounded-xl border border-red-300 bg-white px-5 py-2 text-sm font-black text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : reviewed.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">{loading ? "Loading…" : "No decisions yet."}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-3">Resident</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3">Reviewed by</th>
              </tr>
            </thead>
            <tbody>
              {reviewed.map((row) => (
                <tr key={row.userId} className="border-t border-slate-100 align-top text-slate-700">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{row.fullName}</p>
                    {row.barangay && <p className="text-xs text-slate-500">Brgy. {row.barangay}</p>}
                  </td>
                  <td className="px-4 py-3">{DOCUMENT_LABELS[row.documentType] || "—"}</td>
                  <td className="px-4 py-3">
                    {row.status === "approved" ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">Approved</span>
                    ) : (
                      <>
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">Rejected</span>
                        {row.rejectionReason && <p className="mt-1.5 max-w-xs text-xs text-slate-500">{row.rejectionReason}</p>}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{row.reviewedByName || "Admin"}</p>
                    <p className="text-xs text-slate-500">{formatDate(row.reviewedAt)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={preview.label}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <img src={preview.src} alt={preview.label} className="max-h-full max-w-full rounded-lg object-contain" />
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute right-4 top-4 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-slate-800 shadow"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
