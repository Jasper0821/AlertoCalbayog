import { useState, useEffect } from "react";
import { BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { getValidCalbayogBarangay } from "../../../utils/barangays.js";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getReportBarangay(report) {
  const rawLoc = report.location?.barangay || (typeof report.location === "string" ? report.location : report.location?.name || "");
  return getValidCalbayogBarangay(rawLoc);
}

function isResolvedStatus(status) {
  return ["resolved", "closed", "responded"].includes((status || "").toLowerCase());
}

function isHistoryStatus(status) {
  return ["resolved", "closed", "cancelled", "responded"].includes((status || "").toLowerCase());
}

function isActiveStatus(status) {
  return ["active", "responding", "ongoing", "dispatching", "en_route"].includes((status || "").toLowerCase());
}

function isCrimeReport(report) {
  return (report.emergencyType || report.incidentType || report.type || "").toLowerCase() === "crime";
}

function isAccidentReport(report) {
  const searchable = [
    report.emergencyType,
    report.incidentType,
    report.type,
    report.category,
    report.description,
  ].filter(Boolean).join(" ").toLowerCase();

  return searchable.includes("accident") || searchable.includes("vehicular") || searchable.includes("collision");
}

function isCurrentMonth(report, now) {
  const date = new Date(report.createdAt || report.date || "");
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function getReportDate(report) {
  const date = new Date(report.createdAt || report.date || "");
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTypeLabel(type) {
  return String(type || "Others")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

export default function Analytics({ reports = [] }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const safeReports = Array.isArray(reports) ? reports : [];
  const cdrrmoReports = safeReports.filter(report => !isCrimeReport(report));
  const now = new Date();

  // Live counts from actual data
  const total = cdrrmoReports.length;
  const responded = cdrrmoReports.filter(r => isResolvedStatus(r.status)).length;
  const pending = cdrrmoReports.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const active = cdrrmoReports.filter(r => isActiveStatus(r.status)).length;
  const resolutionRate = total > 0 ? Math.round((responded / total) * 100) : 0;
  const historyReports = cdrrmoReports.filter(r => isHistoryStatus(r.status));
  const currentMonthReports = cdrrmoReports.filter(report => isCurrentMonth(report, now));
  const latestReportDate = cdrrmoReports
    .map(getReportDate)
    .filter(Boolean)
    .sort((a, b) => b - a)[0] || now;
  const latestMonthReports = cdrrmoReports.filter(report => {
    const date = getReportDate(report);
    return date && date.getFullYear() === latestReportDate.getFullYear() && date.getMonth() === latestReportDate.getMonth();
  });
  const monthlySourceReports = currentMonthReports.length > 0 ? currentMonthReports : latestMonthReports;
  const monthlySourceDate = currentMonthReports.length > 0 ? now : latestReportDate;
  const monthlySourceLabel = `${MONTH_NAMES[monthlySourceDate.getMonth()]} ${monthlySourceDate.getFullYear()}`;

  // Monthly trend from actual report dates, rolling last 6 months
  const MONTHLY = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: MONTH_NAMES[date.getMonth()],
      value: 0,
    };
  });
  const monthMap = new Map(MONTHLY.map(month => [month.key, month]));
  cdrrmoReports.forEach(report => {
    const date = new Date(report.createdAt || report.date || "");
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (monthMap.has(key)) {
      monthMap.get(key).value += 1;
    }
  });
  const maxVal = Math.max(...MONTHLY.map(m => m.value), 1);

  // Incident type breakdown from Incident History records
  const typeColors = ["#dc2626", "#0ea5e9", "#10b981", "#f59e0b", "#6366f1", "#64748b"];
  const typeMap = {};
  historyReports.forEach(report => {
    const type = formatTypeLabel(report.emergencyType || report.incidentType || report.type || "Others");
    typeMap[type] = (typeMap[type] || 0) + 1;
  });
  const incidentTypes = Object.entries(typeMap)
    .map(([label, count], index) => ({ label, count, color: typeColors[index % typeColors.length] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const incidentTotal = incidentTypes.reduce((s, c) => s + c.count, 0);

  // Low-to-high barangay accident ranking from fetched CDRRMO database data.
  const accidentSourceReports = monthlySourceReports.filter(isAccidentReport);
  const barangayAccidentSource = accidentSourceReports.length > 0 ? accidentSourceReports : monthlySourceReports;
  const barangayAccidentMap = {};
  barangayAccidentSource.forEach(report => {
    const bgy = getReportBarangay(report);
    if (bgy) {
      barangayAccidentMap[bgy] = (barangayAccidentMap[bgy] || 0) + 1;
    }
  });
  const barangayAccidentData = Object.entries(barangayAccidentMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.count - b.count || a.name.localeCompare(b.name))
    .slice(0, 6);
  const accidentChartLabel = accidentSourceReports.length > 0 ? "accident reports" : "CDRRMO incidents";

  return (
    <div className="space-y-5 pb-10">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Emergency Trend</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Total emergency incidents reported per month</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2024</span>
          </div>
          <div className="flex items-end justify-between gap-3 h-44">
            {MONTHLY.map((m, i) => {
              const heightPct = Math.round((m.value / maxVal) * 100);
              const isLast = i === MONTHLY.length - 1;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{m.value}</span>
                  <div className="w-full flex items-end" style={{ height: "128px" }}>
                    <div
                      className={`w-full rounded-t-xl transition-all duration-1000 ease-out ${isLast ? "bg-[#0a1e3f] shadow-md shadow-blue-200" : "bg-slate-200 group-hover:bg-slate-300"}`}
                      style={{ height: `${animate ? heightPct : 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident Type Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Incident Type Circle</h3>
          <p className="text-[11px] text-slate-400 mb-4">Based on Incident History records</p>
          {incidentTypes.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incidentTypes}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={3}
                    isAnimationActive={animate}
                  >
                    {incidentTypes.map(item => (
                      <Cell key={item.label} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      const pct = incidentTotal > 0 ? Math.round((item.count / incidentTotal) * 100) : 0;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                          <p className="font-black text-slate-900">{item.label}</p>
                          <p className="mt-1 font-semibold text-slate-600">{item.count} incidents ({pct}%)</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">No incident history type data yet.</div>
          )}
          <div className="mt-2 space-y-2">
            {incidentTypes.map(t => {
              const pct = incidentTotal > 0 ? Math.round((t.count / incidentTotal) * 100) : 0;
              return (
                <div key={t.label} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color }} />
                    <span className="truncate font-medium text-slate-700">{t.label}</span>
                  </div>
                  <span className="shrink-0 font-bold text-slate-800">{t.count} <span className="text-[10px] font-normal text-slate-400">({pct}%)</span></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barangay Accident Ranking */}
      <div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-slate-800">Barangays With Most Accidents</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Low-to-high barangay graph from database data ({monthlySourceLabel})</p>
          </div>
          <div className="h-72">
            {barangayAccidentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barangayAccidentData} layout="vertical" margin={{ top: 8, right: 18, left: 28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                  <YAxis type="category" dataKey="name" width={132} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs shadow-lg">
                          <p className="font-black text-slate-900">{label}</p>
                          <p className="mt-1 font-semibold text-blue-700">{payload[0].value} {accidentChartLabel} in {monthlySourceLabel}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No barangay data in the database yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
