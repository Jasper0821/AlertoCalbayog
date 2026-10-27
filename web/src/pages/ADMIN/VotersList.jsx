import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import api from "../../api/axios.js";

const CHUNK_SIZE = 5000;

/** Splits CSV text into rows, honouring quoted fields. Detects , ; or tab. */
function parseCsv(text) {
  const firstLine = text.slice(0, text.indexOf("\n") >>> 0);
  const delimiter = [",", ";", "\t"].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field); field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

const FIELDS = [
  { key: "fullName", label: "Full name (\"LAST, FIRST MIDDLE\")", match: /^(name|full ?name|voter'?s? ?name|pangalan)$/i },
  { key: "lastName", label: "Last name", match: /last|surname|apelyido/i },
  { key: "firstName", label: "First name", match: /first|given/i },
  { key: "middleName", label: "Middle name", match: /middle/i },
  { key: "barangay", label: "Barangay", match: /barangay|brgy/i },
  { key: "birthdate", label: "Birthdate (optional)", match: /birth|b-?day|dob/i },
];

function guessMapping(headers) {
  const mapping = {};
  for (const field of FIELDS) {
    const index = headers.findIndex((h) => field.match.test(String(h).trim()));
    mapping[field.key] = index;
  }
  // A dedicated last/first column beats splitting a combined name.
  if (mapping.lastName >= 0 && mapping.firstName >= 0) mapping.fullName = -1;
  return mapping;
}

/** "DELA CRUZ, JUAN CARLOS SANTOS" -> last DELA CRUZ, first JUAN CARLOS, middle SANTOS. */
function splitFullName(value) {
  const [last, rest = ""] = String(value).split(",");
  const tokens = rest.trim().split(/\s+/).filter(Boolean);
  const middleName = tokens.length >= 2 ? tokens.pop() : "";
  return { lastName: last.trim(), firstName: tokens.join(" "), middleName };
}

function toVoterRows(dataRows, mapping) {
  const cell = (row, key) => (mapping[key] >= 0 ? String(row[mapping[key]] ?? "").trim() : "");
  return dataRows.map((row) => {
    const names =
      mapping.fullName >= 0
        ? splitFullName(cell(row, "fullName"))
        : { lastName: cell(row, "lastName"), firstName: cell(row, "firstName"), middleName: cell(row, "middleName") };
    return { ...names, barangay: cell(row, "barangay"), birthdate: cell(row, "birthdate") };
  });
}

const formatDate = (value) => (value ? new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "—");

/**
 * Admin page for the City's voters list. The CSV is parsed in this browser and sent
 * as rows; the server keeps only one-way fingerprints, never names. Residents use it
 * to get a "Verified resident" badge; it never blocks anyone from reporting.
 */
export default function VotersList() {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [dataRows, setDataRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [agreementReference, setAgreementReference] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/voters/status");
      setStatus(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the voters list status.");
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const voterRows = useMemo(() => toVoterRows(dataRows, mapping), [dataRows, mapping]);
  const includesBirthdate = mapping.birthdate >= 0;
  const hasNames = mapping.fullName >= 0 || (mapping.lastName >= 0 && mapping.firstName >= 0);
  const canUpload = dataRows.length > 0 && hasNames && mapping.barangay >= 0 && agreementReference.trim() && confirmed && !progress;

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setResult(null);
    setError("");
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setError("Save the list as a CSV file first (in Excel: File → Save As → CSV).");
      return;
    }
    const rows = parseCsv(await file.text());
    if (rows.length < 2) {
      setError("That file has no data rows.");
      return;
    }
    setFileName(file.name);
    setHeaders(rows[0]);
    setDataRows(rows.slice(1));
    setMapping(guessMapping(rows[0]));
  };

  const upload = async () => {
    if (!canUpload) return;
    setError("");
    setResult(null);
    const totals = { inserted: 0, skipped: 0, duplicates: 0, total: 0 };
    const chunks = Math.ceil(voterRows.length / CHUNK_SIZE);
    try {
      for (let i = 0; i < chunks; i += 1) {
        setProgress({ done: i, chunks });
        const { data } = await api.post("/voters/import", {
          rows: voterRows.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
          replace: i === 0,
          final: i === chunks - 1,
          includesBirthdate,
          agreementReference: agreementReference.trim(),
        });
        totals.inserted += data.inserted;
        totals.skipped += data.skipped;
        totals.duplicates += data.duplicates;
        totals.total = data.total;
      }
      setResult(totals);
      // The file has done its job; drop it from memory.
      setDataRows([]);
      setHeaders([]);
      setFileName("");
      setConfirmed(false);
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. The list may be incomplete; upload it again.");
    } finally {
      setProgress(null);
    }
  };

  const deleteList = async () => {
    const answer = await Swal.fire({
      icon: "warning",
      title: "Delete the voters list?",
      text: "Residents who are already verified stay verified. New residents can't verify until a list is uploaded again.",
      showCancelButton: true,
      confirmButtonText: "Delete list",
      confirmButtonColor: "#b91c1c",
    });
    if (!answer.isConfirmed) return;
    try {
      await api.delete("/voters");
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete the list.");
    }
  };

  const resolveDispute = async (id) => {
    try {
      await api.post(`/voters/disputes/${id}/resolve`);
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update this claim.");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Voters List</h1>
        <p className="mt-0.5 max-w-3xl text-sm text-slate-500">
          Residents can check themselves against the City's voters list to get a "Verified resident" badge that
          responders see. It never blocks anyone from registering or reporting. Only fingerprints of each voter are
          stored — no names, addresses or birthdates.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      )}

      {/* Status */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Voters loaded</p>
          <p className="mt-1 text-3xl font-black text-slate-800">{loadingStatus ? "…" : (status?.records ?? 0).toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">
            {status?.lastImport
              ? `${formatDate(status.lastImport.importedAt)} by ${status.lastImport.importedByName || "an admin"}`
              : "No list uploaded yet"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Verified residents</p>
          <p className="mt-1 text-3xl font-black text-emerald-700">{loadingStatus ? "…" : status?.verifiedResidents ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">Matched against the voters list</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Agreement</p>
          <p className="mt-1 break-words text-sm font-bold text-slate-800">{status?.lastImport?.agreementReference || "—"}</p>
          <p className="mt-1 text-xs text-slate-500">
            {status?.lastImport ? (status.lastImport.includesBirthdate ? "Matches name, barangay and birthdate" : "Matches name and barangay") : ""}
          </p>
        </div>
      </section>

      {status && !status.configured && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          The server has no VOTER_MATCH_SECRET yet. Add it (16+ random characters) in Render → Environment, then reload this page.
        </p>
      )}

      {/* Upload */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-base font-black text-slate-800">{status?.records ? "Replace the voters list" : "Upload the voters list"}</h2>
          <p className="mt-1 text-sm text-slate-500">
            CSV with columns for last name, first name, middle name and barangay (or one "LAST, FIRST MIDDLE" name column).
            Birthdate is optional; if included, residents must enter theirs too. Uploading replaces the current list.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
          Choose CSV file
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        </label>
        {fileName && <span className="ml-3 text-sm text-slate-600">{fileName} · {dataRows.length.toLocaleString()} rows</span>}

        {headers.length > 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FIELDS.map((field) => (
                <label key={field.key} className="text-xs font-bold text-slate-600">
                  {field.label}
                  <select
                    value={mapping[field.key] ?? -1}
                    onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
                  >
                    <option value={-1}>— not in file —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Last name</th>
                    <th className="px-3 py-2">First name</th>
                    <th className="px-3 py-2">Middle</th>
                    <th className="px-3 py-2">Barangay</th>
                    {includesBirthdate && <th className="px-3 py-2">Birthdate</th>}
                  </tr>
                </thead>
                <tbody>
                  {voterRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-slate-100 text-slate-700">
                      <td className="px-3 py-2">{row.lastName}</td>
                      <td className="px-3 py-2">{row.firstName}</td>
                      <td className="px-3 py-2">{row.middleName}</td>
                      <td className="px-3 py-2">{row.barangay}</td>
                      {includesBirthdate && <td className="px-3 py-2">{row.birthdate}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">Preview of the first 5 rows as they will be matched.</p>
            </div>

            <label className="block text-xs font-bold text-slate-600">
              Data-sharing agreement reference
              <input
                value={agreementReference}
                onChange={(e) => setAgreementReference(e.target.value)}
                placeholder="e.g. COMELEC–Calbayog City DSA No. 2026-01"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
              />
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
              This list was provided by COMELEC to the City under the agreement above, and will be used only to verify residents of this app.
            </label>

            <button
              type="button"
              onClick={upload}
              disabled={!canUpload}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {progress ? `Uploading… ${Math.round((progress.done / progress.chunks) * 100)}%` : "Upload list"}
            </button>
          </>
        )}

        {result && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Loaded {result.inserted.toLocaleString()} voters.
            {result.skipped ? ` ${result.skipped.toLocaleString()} rows were incomplete.` : ""}
            {result.duplicates ? ` ${result.duplicates.toLocaleString()} duplicates were ignored.` : ""}
          </p>
        )}
      </section>

      {/* Duplicate claims */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-black text-slate-800">Duplicate claims to review</h2>
        <p className="mt-1 text-sm text-slate-500">
          Another account matched a voter that was already used to verify. Check both accounts, then verify or unverify them in User Management.
        </p>
        {!status?.disputes?.length ? (
          <p className="mt-3 text-sm text-slate-400">None.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {status.disputes.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-bold text-slate-800">
                    Verified: {d.claimedBy?.fullName || "Unknown"} {d.claimedBy?.phoneNumber ? `· ${d.claimedBy.phoneNumber}` : ""}
                  </p>
                  <p className="text-slate-600">
                    Also matched: {d.disputedBy.map((u) => `${u.fullName}${u.phoneNumber ? ` (${u.phoneNumber})` : ""}`).join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => resolveDispute(d.id)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Mark reviewed
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {status?.records > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
          <h2 className="text-base font-black text-red-800">Delete the voters list</h2>
          <p className="mt-1 text-sm text-red-700">Use this when the data-sharing agreement ends.</p>
          <button
            type="button"
            onClick={deleteList}
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700"
          >
            Delete list
          </button>
        </section>
      )}
    </div>
  );
}
