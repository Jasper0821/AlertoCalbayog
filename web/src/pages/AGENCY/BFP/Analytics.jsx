import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, CartesianGrid, Cell, Pie, PieChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

import { getValidCalbayogBarangay } from "../../../utils/barangays.js";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isResolvedStatus(status) {
  return ["resolved", "closed", "responded"].includes((status || "").toLowerCase());
}

function isActiveStatus(status) {
  return ["active", "responding", "ongoing", "dispatching", "en_route"].includes((status || "").toLowerCase());
}

export default function Analytics({ reports = [] }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const bfpReports = Array.isArray(reports) ? reports : [];
  const now = new Date();

  // Core metrics
  const total = bfpReports.length;
  const responded = bfpReports.filter(r => isResolvedStatus(r.status)).length;
  const pending = bfpReports.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const active = bfpReports.filter(r => isActiveStatus(r.status)).length;
  const resolutionRate = total > 0 ? Math.round((responded / total) * 100) : 0;
  const unresolved = total - responded;

  // Donut Chart
  const donutData = useMemo(() => {
    return [
      { name: "Active", value: active, color: "#ef4444" },    // Red
      { name: "Resolved", value: responded, color: "#10b981" }, // Emerald
      { name: "Pending", value: pending, color: "#f59e0b" },  // Amber
    ].filter(d => d.value > 0);
  }, [active, responded, pending]);

  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: MONTH_NAMES[date.getMonth()],
        Fire: 0,
      };
    });

    const monthMap = new Map(months.map(m => [m.key, m]));

    bfpReports.forEach(report => {
      const date = new Date(report.createdAt || report.date || "");
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthMap.has(key)) {
        const monthObj = monthMap.get(key);
        monthObj.Fire++;
      }
    });

    return months;
  }, [bfpReports]);

  return (
    <div className="space-y-6 pb-10 bg-slate-50 min-h-screen text-slate-800 p-1">

      {/* Top 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Donut Chart */}
        <div className={`transition-all duration-700 ease-out transform ${animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative min-h-[320px]`}>
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-[15px]">Fire Incident Breakdown</h3>
            <span className="text-slate-400 bg-slate-50 w-6 h-6 rounded-full flex items-center justify-center text-xs border border-slate-100 cursor-pointer">ⓘ</span>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-2">
            {total > 0 ? (
              <ResponsiveContainer width="100%" height={160} minWidth={100} minHeight={100} initialDimension={{ width: 100, height: 100 }}>
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
              <div className="text-slate-400 text-xs font-semibold">No fire incidents logged</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800">{total}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Fires</span>
            </div>
          </div>

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

        {/* Card 2: Resolution Rate */}
        <div className={`transition-all duration-700 ease-out transform ${animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]`}>
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-[15px]">Resolution Rate</h3>
            <span className="text-slate-400 bg-slate-50 w-6 h-6 rounded-full flex items-center justify-center text-xs border border-slate-100 cursor-pointer">ⓘ</span>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-2">
            {total > 0 ? (
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#dc2626"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * resolutionRate) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
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

      {/* Middle Row: Monthly Bar Chart */}
      <div className={`transition-all duration-700 ease-out transform ${animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} bg-white border border-slate-100 rounded-2xl p-6 shadow-sm`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-[15px]">Fire Emergencies by Month</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Historical breakdown of monthly fire emergency logs</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-slate-500 flex items-center gap-1 cursor-pointer">
              Yearly
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </span>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} initialDimension={{ width: 100, height: 100 }}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(220, 38, 38, 0.04)" }}
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
              <Bar dataKey="Fire" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
