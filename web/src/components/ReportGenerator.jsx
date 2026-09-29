import { useMemo, useState } from "react";
import { REPORT_PERIODS, REPORT_TYPES, generateReport, printReport, reportToText } from "../utils/reportGenerator.js";

// Literal class names so Tailwind keeps them in the build.
const ACCENTS = {
  slate: { button: "bg-slate-900 hover:bg-slate-800", active: "border-slate-900 bg-slate-900 text-white", dot: "bg-slate-900" },
  emerald: { button: "bg-emerald-600 hover:bg-emerald-700", active: "border-emerald-600 bg-emerald-600 text-white", dot: "bg-emerald-600" },
  violet: { button: "bg-violet-700 hover:bg-violet-800", active: "border-violet-700 bg-violet-700 text-white", dot: "bg-violet-700" },
  red: { button: "bg-red-600 hover:bg-red-700", active: "border-red-600 bg-red-600 text-white", dot: "bg-red-600" },
};

function ReportTable({ table }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <tr>{table.columns.map((c) => <th key={c} className="px-3 py-2">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "font-semibold text-slate-900" : ""} ${/^\+/.test(cell) ? "text-red-600 font-semibold" : ""} ${/^-\d/.test(cell) ? "text-emerald-600 font-semibold" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Rule-based report builder shown on every analytics page.
 * `scope` tailors the recommendations ("admin", "CDRRMO", "PNP", "BFP").
 */
export default function ReportGenerator({ reports = [], scope = "admin", scopeLabel = "Citywide", accent = "slate" }) {
  const [type, setType] = useState("executive");
  const [periodId, setPeriodId] = useState("last30");
  const [request, setRequest] = useState(null);
  const [copied, setCopied] = useState(false);
  const colors = ACCENTS[accent] || ACCENTS.slate;

  // Re-derived from live data, so an open report stays current as new incidents arrive.
  const report = useMemo(
    () => (request ? generateReport({ reports, scope, scopeLabel, ...request }) : null),
    [reports, scope, scopeLabel, request],
  );

  const handleGenerate = () => {
    setCopied(false);
    setRequest({ type, periodId, now: new Date() });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportToText(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed — your browser blocked clipboard access.");
    }
  };

  const isStale = report && (request.type !== type || request.periodId !== periodId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-black tracking-tight text-slate-900">Generate Report</h2>
          <p className="text-xs font-medium text-slate-500">
            Builds a written report with findings and recommendations from {scope === "admin" ? "citywide" : scopeLabel} incident data.
          </p>
        </div>
      </div>

      {/* Report type */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {REPORT_TYPES.map((t) => {
          const active = t.id === type;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${active ? colors.active : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              <span className="block text-sm font-bold">{t.label}</span>
              <span className={`mt-0.5 block text-[11px] leading-snug ${active ? "text-white/80" : "text-slate-500"}`}>{t.description}</span>
            </button>
          );
        })}
      </div>

      {/* Period + generate */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
          Period
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 sm:flex-none"
          >
            {REPORT_PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <button
          type="button"
          onClick={handleGenerate}
          className={`h-10 rounded-xl px-5 text-sm font-bold text-white transition-colors sm:ml-auto ${colors.button}`}
        >
          {report ? "Regenerate report" : "Generate report"}
        </button>
      </div>

      {report && (
        <article className="mt-5 border-t border-slate-100 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">{report.title}</h3>
              <p className="text-xs font-medium text-slate-500">
                {report.scopeLabel} · {report.periodLabel} ({report.rangeText}) · Generated {report.generatedAt.toLocaleString("en-PH")}
              </p>
              {isStale && (
                <p className="mt-1 text-xs font-semibold text-amber-600">Settings changed — click “Regenerate report” to update.</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={handleCopy} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
                {copied ? "Copied" : "Copy text"}
              </button>
              <button type="button" onClick={() => printReport(report)} className={`h-9 rounded-lg px-3 text-xs font-bold text-white ${colors.button}`}>
                Download PDF
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {report.metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.label}</p>
                <p className="mt-0.5 text-xl font-black text-slate-900">{m.value}</p>
                <p className="text-[11px] font-medium text-slate-500">{m.hint}</p>
              </div>
            ))}
          </div>

          <h4 className="mt-5 text-xs font-black uppercase tracking-wider text-slate-500">Key findings</h4>
          <ul className="mt-2 space-y-1.5">
            {report.findings.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {report.sections.map((s) => (
            <div key={s.heading} className="mt-5">
              <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">{s.heading}</h4>
              {(s.paragraphs || []).map((p, i) => <p key={i} className="mb-2 text-sm leading-relaxed text-slate-700">{p}</p>)}
              {s.bullets && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
              {s.table && <ReportTable table={s.table} />}
            </div>
          ))}

          <h4 className="mt-5 text-xs font-black uppercase tracking-wider text-slate-500">Recommendations</h4>
          <ol className="mt-2 space-y-2">
            {report.recommendations.map((r, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                <span className="font-black text-slate-900">{i + 1}.</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </article>
      )}
    </section>
  );
}
