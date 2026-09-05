import { useState } from "react";
import { TYPE_ICONS, getPriority, getIncidentId, formatLocationForTable } from "../../../utils/incidentFormatters.js";
import IncidentDetailModal from "../PNP/IncidentDetailModal.jsx";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function RejectedReports({ reports = [] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);

  const resolved = reports.filter(r => (r.status || "").toLowerCase() === "rejected");

  const historyYears = Array.from(new Set(
    resolved
      .map(report => report.createdAt ? new Date(report.createdAt) : null)
      .filter(date => date && !Number.isNaN(date.getTime()))
      .map(date => date.getFullYear())
  )).sort((a, b) => b - a);
  const monthYears = historyYears.length > 0 ? historyYears : [new Date().getFullYear()];
  const monthOptions = monthYears.flatMap(year =>
    MONTH_NAMES.map((name, index) => ({
      value: `${year}-${String(index).padStart(2, "0")}`,
      label: `${name} ${year}`,
    }))
  );

  const [monthFilter, setMonthFilter] = useState("all");

  const filtered = resolved.filter(r => {
    const type = (r.emergencyType || "").toLowerCase();
    const loc = typeof r.location === "string" ? r.location : (r.location?.name || "");
    const name = r.userId?.fullName || "";
    const date = r.createdAt ? new Date(r.createdAt) : null;
    const monthKey = date && !Number.isNaN(date.getTime())
      ? `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`
      : "";
    if (typeFilter !== "all" && type !== typeFilter) return false;
    if (monthFilter !== "all" && monthKey !== monthFilter) return false;
    if (search && !loc.toLowerCase().includes(search) && !name.toLowerCase().includes(search)) return false;
    return true;
  });

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups for this site to download the PDF report.");
      return;
    }

    // Build incident rows
    const rowsHtml = filtered.map((r, i) => {
      const type = (r.emergencyType || "others").toUpperCase();
      const status = (r.status || "pending").toUpperCase();
      const incId = getIncidentId(r, i);
      const loc = typeof r.location === "string" ? r.location : (r.location?.name || "Unknown");
      const date = r.createdAt ? new Date(r.createdAt) : new Date();
      const dateStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const priority = getPriority(r).toUpperCase();
      const reporter = r.userId?.fullName || "Unknown";

      return `
        <tr>
          <td>${incId}</td>
          <td>${type}</td>
          <td>${loc}</td>
          <td>${reporter}</td>
          <td>${dateStr}</td>
          <td>${priority}</td>
          <td>${status}</td>
        </tr>
      `;
    }).join("");

    const htmlContent = `
      <html>
      <head>
        <title>Alerto Calbayog - Rejected Reports</title>
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
            margin-bottom: 30px;
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
          .logo {
            height: 60px;
          }
          .report-info {
            font-size: 11px;
            color: #64748b;
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            text-align: left;
          }
          td {
            padding: 10px 12px;
            font-size: 11px;
            border: 1px solid #cbd5e1;
            color: #334155;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .summary {
            font-size: 12px;
            font-weight: bold;
            color: #0a1e3f;
            margin-bottom: 40px;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 15px;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-title">
            <h1>ALERTO CALBAYOG</h1>
            <p>Incident Command Center History Report</p>
          </div>
          <div class="report-info">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Incidents:</strong> ${filtered.length}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Incident ID</th>
              <th>Type</th>
              <th>Location</th>
              <th>Reporter</th>
              <th>Date & Time</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align:center">No incident records found.</td></tr>'}
          </tbody>
        </table>

        <div class="summary">
          Report summary: Compiled ${filtered.length} resolved records.
        </div>

        <div class="footer">
          Alerto Calbayog © ${new Date().getFullYear()} — Confidential Command Center Report. All rights reserved.
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-slate-800">Rejected Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Archive of all resolved, closed, and cancelled incidents.</p>
      </div>

      {/* Filters */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value.toLowerCase())}
            className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 w-44"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="fire">Fire</option>
          <option value="medical">Medical</option>
          <option value="flood">Flood</option>

        </select>
        <select
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 cursor-pointer"
        >
          <option value="all">All Incidents</option>
          {monthOptions.map(month => (
            <option key={month.value} value={month.value}>{month.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <span className="text-xs text-slate-400">
            <span className="font-bold text-slate-700">{filtered.length}</span> records
          </span>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm shadow-emerald-600/10 active:scale-[0.98] transform"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-full overflow-x-hidden overflow-y-auto lg:overflow-auto">
          <table className="block w-full text-left lg:table lg:min-w-[980px]">
            <thead className="hidden lg:sticky lg:top-0 lg:z-10 lg:table-header-group">
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Type", "Location", "Reporter", "Contact No.", "Date", "Time", "Action"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="block space-y-3 p-3 lg:table-row-group lg:space-y-0 lg:p-0 lg:divide-y lg:divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-sm text-slate-400">
                    No history records match your filters.
                  </td>
                </tr>
              ) : filtered.map((r, i) => {
                const type = (r.emergencyType || "others").toLowerCase();
                const typeInfo = TYPE_ICONS[type] || TYPE_ICONS.others;
                const locationText = formatLocationForTable(r.location);
                const date = r.createdAt ? new Date(r.createdAt) : new Date();

                return (
                  <tr key={r._id || i} className="block rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors hover:bg-slate-100 lg:table-row lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:hover:bg-slate-50">
                    <td className="block px-0 py-1.5 lg:table-cell lg:px-5 lg:py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{typeInfo.icon}</span>
                        <span className="text-xs font-medium text-slate-700">{typeInfo.label}</span>
                      </div>
                    </td>
                    <td className="block px-0 py-1.5 lg:table-cell lg:px-5 lg:py-3.5" title={locationText}>
                      <span className="text-xs text-slate-600">{locationText}</span>
                    </td>
                    <td className="block px-0 py-1.5 lg:table-cell lg:px-5 lg:py-3.5">
                      <span className="text-xs text-slate-600">{r.userId?.fullName || "Unknown"}</span>
                    </td>
                    <td className="block px-0 py-1.5 lg:table-cell lg:px-5 lg:py-3.5">
                      <span className="text-xs font-mono text-slate-600">{r.userId?.phoneNumber || r.phoneNumber || "N/A"}</span>
                    </td>
                    <td className="block px-0 py-1.5 lg:table-cell lg:px-5 lg:py-3.5">
                      <span className="text-xs text-slate-600 whitespace-nowrap">{date.toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </td>
                    <td className="block px-0 py-1.5 lg:table-cell lg:px-5 lg:py-3.5">
                      <span className="text-xs text-slate-600">{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td className="block px-0 py-1.5 lg:table-cell lg:px-5 lg:py-3.5">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    </td>
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
