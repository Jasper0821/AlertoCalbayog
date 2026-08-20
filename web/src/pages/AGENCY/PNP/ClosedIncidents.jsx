import { useMemo, useState } from "react";
import {
  getIncidentId,
  getPriority,
  PRIORITY_STYLES,
  TYPE_ICONS,
  formatLocationForTable,
} from "../../../utils/incidentFormatters.js";
import IncidentDetailModal from "./IncidentDetailModal.jsx";

function toDateInputValue(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

export default function ClosedIncidents({ reports = [], agencyName = "PNP" }) {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  const closedIncidents = useMemo(() => (Array.isArray(reports) ? reports : [])
    .filter((report) => (report.status || "").toLowerCase() === "closed")
    .filter((report) => {
      const incidentDate = toDateInputValue(report.createdAt || report.date);
      const location = formatLocationForTable(report.location).toLowerCase();
      const reporter = (report.userId?.fullName || "").toLowerCase();
      const type = (report.emergencyType || "").toLowerCase();
      const query = search.trim().toLowerCase();

      if (fromDate && (!incidentDate || incidentDate < fromDate)) return false;
      if (toDate && (!incidentDate || incidentDate > toDate)) return false;
      return !query || location.includes(query) || reporter.includes(query) || type.includes(query);
    })
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)), [reports, search, fromDate, toDate]);

  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5 12 3l8 4.5M5 10v8.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V10M8.5 13l2.25 2.25L15.5 10.5" /></svg>
          </span>
          <h1 className="text-xl font-bold text-slate-800">Closed Incidents</h1>
        </div>
        <p className="mt-0.5 text-sm text-slate-500">Completed {agencyName} incidents from database records.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <label className="min-w-[180px] flex-1">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Search</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Type, location, or reporter"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label>
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Incident date from</span>
          <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
        </label>
        <label>
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Incident date to</span>
          <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
        </label>
        <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Clear filters</button>
        <span className="pb-2 text-xs text-slate-400"><strong className="text-slate-700">{closedIncidents.length}</strong> closed records</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Incident ID', 'Type', 'Location', 'Reporter', 'Incident Date', 'Closed Date', 'Priority', 'Action'].map((heading) => (
                  <th key={heading} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closedIncidents.length === 0 ? (
                <tr><td colSpan="8" className="py-14 text-center text-sm text-slate-400">No closed incidents match the selected date range.</td></tr>
              ) : closedIncidents.map((report, index) => {
                const incidentDate = new Date(report.createdAt || report.date || 0);
                const closedDate = report.closedAt ? new Date(report.closedAt) : null;
                const type = (report.emergencyType || "others").toLowerCase();
                const typeInfo = TYPE_ICONS[type] || TYPE_ICONS.others;
                const priority = getPriority(report);
                return (
                  <tr key={report._id || index} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-blue-600">{getIncidentId(report, index)}</td>
                    <td className="px-5 py-3.5"><span className="text-xs font-medium text-slate-700">{typeInfo.icon} {typeInfo.label}</span></td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{formatLocationForTable(report.location)}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{report.userId?.fullName || "Unknown"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">{Number.isNaN(incidentDate.getTime()) ? "—" : incidentDate.toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">{closedDate && !Number.isNaN(closedDate.getTime()) ? closedDate.toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                    <td className="px-5 py-3.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_STYLES[priority]}`}>{priority}</span></td>
                    <td className="px-5 py-3.5"><button type="button" onClick={() => setSelectedReport(report)} className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <IncidentDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  );
}
