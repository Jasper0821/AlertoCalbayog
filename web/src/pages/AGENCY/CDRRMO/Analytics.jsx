import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, CartesianGrid, Cell, Pie, PieChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

import { getValidCalbayogBarangay } from "../../../utils/barangays.js";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Known street → barangay mappings for Calbayog City
const STREET_TO_BARANGAY = {
  "rosales boulevard": "Aguit-itan",
  "nijaga street": "Nijaga",
  "maharlika highway": "Caglanipao",
};

function getReportBarangay(report) {
  const bgyField = (report.location?.barangay || "").trim();
  const street = (report.location?.street || "").trim();
  const locName = typeof report.location === "string"
    ? report.location
    : (report.location?.name || "");

  // 1. If barangay field is a real Calbayog barangay (not 'District'), use it
  if (bgyField && bgyField.toLowerCase() !== "district") {
    const matched = getValidCalbayogBarangay(bgyField);
    if (matched) return matched;
  }

  // 2. Try to map via known street → barangay table
  if (street) {
    const key = street.toLowerCase();
    for (const [streetKey, bgy] of Object.entries(STREET_TO_BARANGAY)) {
      if (key.includes(streetKey)) return bgy;
    }
    // Also try getValidCalbayogBarangay on the street text itself
    const streetMatched = getValidCalbayogBarangay(street);
    if (streetMatched) return streetMatched;
  }

  // 3. Parse the location name parts (e.g. "Purok 2, Brgy. District, Calbayog City")
  if (locName) {
    const parts = locName.split(/,\s*/);
    for (const part of parts) {
      if (part.toLowerCase().includes("district")) continue;
      if (part.toLowerCase().includes("calbayog")) continue;
      if (part.toLowerCase().includes("purok")) continue;
      if (part.toLowerCase().startsWith("brgy")) continue;
      const partMatched = getValidCalbayogBarangay(part);
      if (partMatched) return partMatched;
    }
  }

  // 4. If barangay is 'District' and street is Rosales Blvd → map to Aguit-itan
  if (bgyField.toLowerCase() === "district") {
    const key = street.toLowerCase();
    if (key.includes("rosales")) return "Aguit-itan";
    if (key.includes("nijaga")) return "Nijaga";
  }

  // 5. Try the raw barangay field anyway (non-District)
  if (bgyField && bgyField.toLowerCase() !== "district") {
    return bgyField;
  }

  return null;
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

  // Core metrics
  const total = cdrrmoReports.length;
  const responded = cdrrmoReports.filter(r => isResolvedStatus(r.status)).length;
  const pending = cdrrmoReports.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const active = cdrrmoReports.filter(r => isActiveStatus(r.status)).length;
  const resolutionRate = total > 0 ? Math.round((responded / total) * 100) : 0;
  const unresolved = total - responded;

  // 1. Donut Chart (Attendance Statistic style)
  const donutData = useMemo(() => {
    return [
      { name: "Active", value: active, color: "#6366f1" },    // Violet
      { name: "Resolved", value: responded, color: "#10b981" }, // Emerald
      { name: "Pending", value: pending, color: "#f59e0b" },  // Amber
    ].filter(d => d.value > 0);
  }, [active, responded, pending]);


  const stackedMonthlyData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: MONTH_NAMES[date.getMonth()],
        Medical: 0,
        Flood: 0,
        Fire: 0,
        Others: 0,
      };
    });

    const monthMap = new Map(months.map(m => [m.key, m]));

    cdrrmoReports.forEach(report => {
      const date = new Date(report.createdAt || report.date || "");
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthMap.has(key)) {
        const monthObj = monthMap.get(key);
        const type = (report.emergencyType || "others").toLowerCase();
        if (type === "medical") monthObj.Medical++;
        else if (type === "flood") monthObj.Flood++;
        else if (type === "fire") monthObj.Fire++;
        else monthObj.Others++;
      }
    });

    return months;
  }, [cdrrmoReports]);

  // 3. Category Distribution (Semi-circle Gauge Breakdown)
  const typeBreakdown = useMemo(() => {
    const map = { Medical: 0, Flood: 0, Fire: 0, Others: 0 };
    const historyReports = cdrrmoReports.filter(r => ["resolved", "closed", "cancelled", "responded"].includes((r.status || "").toLowerCase()));

    historyReports.forEach(report => {
      const type = (report.emergencyType || "others").toLowerCase();
      if (type === "medical") map.Medical++;
      else if (type === "flood") map.Flood++;
      else if (type === "fire") map.Fire++;
      else map.Others++;
    });

    return [
      { name: "Medical", value: map.Medical, color: "#6366f1" },
      { name: "Flood", value: map.Flood, color: "#38bdf8" },
      { name: "Fire", value: map.Fire, color: "#f43f5e" },
      { name: "Others", value: map.Others, color: "#cbd5e1" },
    ].filter(d => d.value > 0);
  }, [cdrrmoReports]);

  const typeTotal = typeBreakdown.reduce((sum, item) => sum + item.value, 0);

  // 4. Incident counts by Barangay
  const barangayData = useMemo(() => {
    const counts = {};

    cdrrmoReports.forEach(report => {
      const bgy = getReportBarangay(report);
      if (bgy) {
        const lower = bgy.toLowerCase().trim();
        if (lower !== "unknown" && lower !== "district") {
          if (!counts[bgy]) {
            counts[bgy] = { name: bgy, count: 0, resolved: 0, pending: 0, responding: 0 };
          }
          counts[bgy].count += 1;

          const status = (report.status || "pending").toLowerCase();
          if (["resolved", "closed", "cancelled", "responded"].includes(status)) {
            counts[bgy].resolved += 1;
          } else if (status === "pending") {
            counts[bgy].pending += 1;
          } else {
            counts[bgy].responding += 1;
          }
        }
      }
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count);
  }, [cdrrmoReports]);


  return (
    <div className="space-y-6 pb-10 bg-slate-50 min-h-screen text-slate-800 p-1">

      {/* Top 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Attendance Statistic style Donut */}
        <div className={`transition-all duration-700 ease-out transform ${animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative min-h-[320px]`}>
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-[15px]">Incident Breakdown</h3>
            <span className="text-slate-400 bg-slate-50 w-6 h-6 rounded-full flex items-center justify-center text-xs border border-slate-100 cursor-pointer">ⓘ</span>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-2">
            {total > 0 ? (
              <ResponsiveContainer width="100%" height={160} minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={animate}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs font-semibold">No incidents logged</div>
            )}
            {/* Absolute Center Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800">{total}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Cases</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-600 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span>Total ({total})</span>
            </div>
            {donutData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Loan Payment Recieve style radial progress */}
        <div className={`transition-all duration-700 ease-out transform ${animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]`}>
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-[15px]">Resolution Rate</h3>
            <span className="text-slate-400 bg-slate-50 w-6 h-6 rounded-full flex items-center justify-center text-xs border border-slate-100 cursor-pointer">ⓘ</span>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-2">
            {total > 0 ? (
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#0ea5e9"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * resolutionRate) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[25px] font-black text-slate-800">{resolutionRate}%</span>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Success Rate</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs font-semibold">No data available</div>
            )}
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-100 text-center mt-2 border-t border-slate-50 pt-3">
            <div>
              <span className="block text-[16px] font-black text-slate-800">{responded}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Resolved</span>
            </div>
            <div>
              <span className="block text-[16px] font-black text-slate-800">{unresolved}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Unresolved</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row: Stacked Bar Chart & Semi-circle gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Stacked Bar Chart: Position Wise Recruitment style */}
        <div className={`transition-all duration-700 ease-out transform ${animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-[15px]">Incident Types by Month</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Historical breakdown of monthly emergency logs</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-slate-500 flex items-center gap-1 cursor-pointer">
                Yearly
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
              <BarChart data={stackedMonthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} />
                <Tooltip
                  cursor={{ fill: "rgba(99, 102, 241, 0.04)" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-xl text-xs">
                        <p className="font-black text-slate-800 mb-1">{label}</p>
                        {payload.map((p) => (
                          <div key={p.name} className="flex items-center gap-2 py-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="font-semibold text-slate-500">{p.name}:</span>
                            <span className="font-black text-slate-800">{p.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="Medical" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Flood" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Fire" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Others" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Semi-circle Donut Chart (Awarded style) */}
        <div className={`transition-all duration-700 ease-out transform ${animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-slate-800 text-[15px]">Category Distribution</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Distribution of emergency cases by category</p>
            </div>
            <span className="text-slate-400 bg-slate-50 w-6 h-6 rounded-full flex items-center justify-center text-xs border border-slate-100 cursor-pointer">···</span>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-1">
            {typeTotal > 0 ? (
              <ResponsiveContainer width="100%" height={170} minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
                <PieChart>
                  <Pie
                    data={typeBreakdown}
                    cx="50%"
                    cy="85%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={animate}
                  >
                    {typeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs font-semibold">No data yet</div>
            )}
            {/* Gauge center info */}
            <div className="absolute bottom-[20%] flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800">{typeTotal}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Classified</span>
            </div>
          </div>

          {/* Legend Checklist style */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] font-bold text-slate-600 mt-1 border-t border-slate-50 pt-3">
            {typeBreakdown.map(tb => {
              const pct = typeTotal > 0 ? Math.round((tb.value / typeTotal) * 100) : 0;
              return (
                <div key={tb.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tb.color }} />
                  <span className="truncate text-slate-500 font-semibold">{tb.name}</span>
                  <span className="text-slate-800">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
