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

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");

    const dateRange = fromDate || toDate
      ? `${fromDate || "Beginning"} — ${toDate || "Present"}`
      : "All Dates";

    const rowsHtml = closedIncidents.map((r, i) => {
      const type = (r.emergencyType || "others").toUpperCase();
      const incId = getIncidentId(r, i);
      const loc = formatLocationForTable(r.location) || "Unknown";
      const reporter = r.userId?.fullName || "Unknown";
      const contact = r.userId?.phoneNumber || r.phoneNumber || "N/A";
      const incidentDate = new Date(r.createdAt || r.date || 0);
      const closedDate = r.closedAt ? new Date(r.closedAt) : null;
      const incidentDateStr = Number.isNaN(incidentDate.getTime())
        ? "—"
        : `${incidentDate.toLocaleDateString()} ${incidentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const closedDateStr = closedDate && !Number.isNaN(closedDate.getTime())
        ? `${closedDate.toLocaleDateString()} ${closedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "—";
      const agency = r.assignedAgency && r.assignedAgency !== "NONE"
        ? r.assignedAgency
        : (r.notifiedAgencies || []).join(", ") || "None";

      return `
        <tr>
          <td>${incId}</td>
          <td>${type}</td>
          <td>${loc}</td>
          <td>${reporter}</td>
          <td>${contact}</td>
          <td>${agency}</td>
          <td>${incidentDateStr}</td>
          <td>${closedDateStr}</td>
          <td style="color:#0a7a4f;font-weight:bold;">CLOSED</td>
        </tr>
      `;
    }).join("");

    const htmlContent = `
      <html>
      <head>
        <title>Alerto Calbayog - ${agencyName} Closed Incidents Report</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #334155;
            padding: 30px;
            margin: 0;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0a1e3f;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .logo {
            height: 56px;
            width: auto;
          }
          .header-title h1 {
            font-size: 24px;
            font-weight: bold;
            color: #0a1e3f;
            margin: 0;
          }
          .header-title p {
            font-size: 12px;
            color: #64748b;
            margin: 5px 0 0 0;
          }
          .report-info {
            font-size: 11px;
            color: #64748b;
            text-align: right;
            line-height: 1.8;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 10px;
          }
          th {
            background-color: #0a1e3f;
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px 10px;
            border: 1px solid #0a1e3f;
            text-align: left;
          }
          td {
            padding: 8px 10px;
            font-size: 10px;
            border: 1px solid #cbd5e1;
            color: #334155;
            vertical-align: top;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .summary {
            font-size: 12px;
            font-weight: bold;
            color: #0a1e3f;
            margin-bottom: 30px;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 12px;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
          }
          @media print {
            body { padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <img src="/logo.png" alt="Alerto Calbayog Logo" class="logo" />
            <div class="header-title">
              <h1>ALERTO CALBAYOG</h1>
              <p>${agencyName} — Closed Incidents Report</p>
            </div>
          </div>
          <div class="report-info">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Date Range:</strong> ${dateRange}</p>
            <p><strong>Total Records:</strong> ${closedIncidents.length}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Incident ID</th>
              <th>Type</th>
              <th>Location</th>
              <th>Reporter</th>
              <th>Contact No.</th>
              <th>Agency</th>
              <th>Incident Date</th>
              <th>Closed Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="10" style="text-align:center;padding:20px;">No closed incident records found.</td></tr>'}
          </tbody>
        </table>

        <div class="summary">
          Report summary: Compiled ${closedIncidents.length} closed incident records.
        </div>

        <div class="footer">
          Alerto Calbayog © ${new Date().getFullYear()} — Confidential ${agencyName} Command Center Report. All rights reserved.
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">From date</span>
          <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
        </label>
        <label>
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">To date</span>
          <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
        </label>
        <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Clear filters</button>
        <span className="pb-2 text-xs text-slate-400"><strong className="text-slate-700">{closedIncidents.length}</strong> closed records</span>

        {/* Export PDF Button */}
        <button
          type="button"
          onClick={handleExportPDF}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export PDF
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Incident ID', 'Type', 'Location', 'Reporter', 'Contact', 'Agency', 'Incident Date', 'Closed Date', 'Priority', 'Action'].map((heading) => (
                  <th key={heading} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closedIncidents.length === 0 ? (
                <tr><td colSpan="10" className="py-14 text-center text-sm text-slate-400">No closed incidents match the selected date range.</td></tr>
              ) : closedIncidents.map((report, index) => {
                const incidentDate = new Date(report.createdAt || report.date || 0);
                const closedDate = report.closedAt ? new Date(report.closedAt) : null;
                const type = (report.emergencyType || "others").toLowerCase();
                const typeInfo = TYPE_ICONS[type] || TYPE_ICONS.others;
                const priority = getPriority(report);
                const agency = report.assignedAgency && report.assignedAgency !== "NONE"
                  ? report.assignedAgency
                  : (report.notifiedAgencies || []).join(", ") || "None";
                return (
                  <tr key={report._id || index} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-blue-600">{getIncidentId(report, index)}</td>
                    <td className="px-5 py-3.5"><span className="text-xs font-medium text-slate-700">{typeInfo.icon} {typeInfo.label}</span></td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{formatLocationForTable(report.location)}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{report.userId?.fullName || "Unknown"}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600">{report.userId?.phoneNumber || report.phoneNumber || "N/A"}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{agency}</td>
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
