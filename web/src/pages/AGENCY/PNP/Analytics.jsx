import { useState, useEffect } from "react";

export default function Analytics({ reports = [] }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const safeReports = Array.isArray(reports) ? reports : [];

  // Live counts from actual data
  const total = safeReports.length;
  const responded = safeReports.filter(r =>
    ["resolved", "closed", "responded"].includes((r.status || "").toLowerCase())
  ).length;
  const pending = safeReports.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const active = safeReports.filter(r => (r.status || "").toLowerCase() === "active").length;
  const resolutionRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  // Barangay breakdown from mock data
  const barangayMap = {};
  safeReports.forEach(r => {
    const bgy = r.location?.barangay || (typeof r.location === "string" ? r.location : "Unknown");
    barangayMap[bgy] = (barangayMap[bgy] || 0) + 1;
  });
  const barangayData = Object.entries(barangayMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxBgy = Math.max(...barangayData.map(b => b.count), 1);

  // Monthly mock trend (based on real total for current month)
  const MONTHLY = [
    { month: "Jan", value: 14 },
    { month: "Feb", value: 19 },
    { month: "Mar", value: 11 },
    { month: "Apr", value: 23 },
    { month: "May", value: 17 },
    { month: "Jun", value: Math.max(total, 5) },
  ];
  const maxVal = Math.max(...MONTHLY.map(m => m.value));

  // Crime sub-type mock breakdown
  const crimeTypes = [
    { label: "Theft / Robbery",       count: 38, color: "bg-[#0a1e3f]",    bar: "#0a1e3f" },
    { label: "Physical Assault",      count: 27, color: "bg-blue-600",      bar: "#2563eb" },
    { label: "Trespassing",           count: 14, color: "bg-indigo-500",    bar: "#6366f1" },
    { label: "Drug-related",          count: 21, color: "bg-violet-500",    bar: "#8b5cf6" },
    { label: "Vandalism",             count: 9,  color: "bg-sky-400",       bar: "#38bdf8" },
    { label: "Other Crime",           count: 19, color: "bg-slate-400",     bar: "#94a3b8" },
  ];
  const crimeTotal = crimeTypes.reduce((s, c) => s + c.count, 0);

  // Response time mock data
  const respTable = [
    { barangay: "Poblacion",    incidents: 23, avgTime: "5:12", resolved: 20, rate: 87 },
    { barangay: "Hamorawon",    incidents: 18, avgTime: "6:44", resolved: 15, rate: 83 },
    { barangay: "Nijaga",       incidents: 14, avgTime: "7:05", resolved: 11, rate: 78 },
    { barangay: "Balud",        incidents: 11, avgTime: "5:55", resolved: 10, rate: 90 },
    { barangay: "Dagum",        incidents: 9,  avgTime: "8:20", resolved: 7,  rate: 77 },
  ];

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Crime incident trends, response metrics, and barangay insights.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Reports",    value: total   || 128, sub: "All crime reports",       color: "text-slate-800",   bg: "bg-white border-slate-200",             dot: "bg-slate-400" },
          { label: "Pending",          value: pending || 8,   sub: "Awaiting dispatch",       color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",          dot: "bg-amber-400" },
          { label: "Active",           value: active  || 3,   sub: "Currently responding",    color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200",        dot: "bg-indigo-400" },
          { label: "Responded",        value: responded || 114, sub: "Resolved incidents",    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",      dot: "bg-emerald-400" },
          { label: "Resolution Rate",  value: `${resolutionRate || 89}%`, sub: "Target: >85%", color: "text-blue-700", bg: "bg-blue-50 border-blue-200",             dot: "bg-blue-400" },
        ].map(k => (
          <div key={k.label} className={`border rounded-2xl p-4 shadow-sm ${k.bg} flex flex-col gap-2`}>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${k.dot}`} />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">{k.label}</p>
            </div>
            <p className={`text-3xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Top Barangay Insight */}
      {barangayData.length > 0 && (
        <div className="mt-6 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Top Barangay by Incidents</h3>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#0a1e3f] text-white rounded-full flex items-center justify-center text-lg font-black">
              {barangayData[0].count}
            </div>
            <div className="text-sm font-medium text-slate-700">{barangayData[0].name}</div>
          </div>
        </div>
      )}

      {/* Status Circle Analytics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Pending", value: pending, color: "bg-amber-500" },
          { label: "Responded", value: responded, color: "bg-emerald-500" },
          { label: "Active", value: active, color: "bg-indigo-500" },
        ].map((s, idx) => (
          <div key={s.label} className="flex flex-col items-center">
            <div className={`relative w-24 h-24 ${s.color} rounded-full flex items-center justify-center text-white text-2xl font-bold transition-transform duration-1000 ${animate ? "scale-100" : "scale-0"}`}>
              {s.value}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-700">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Crime Trend</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Total crime incidents reported per month</p>
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

        {/* Crime Type Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">By Crime Type</h3>
          <div className="space-y-3.5">
            {crimeTypes.map(t => {
              const pct = Math.round((t.count / crimeTotal) * 100);
              return (
                <div key={t.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 truncate">{t.label}</span>
                    <span className="font-bold text-slate-800 shrink-0 ml-2">{t.count} <span className="text-slate-400 font-normal text-[10px]">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${animate ? pct : 0}%`, background: t.bar }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barangay Hotspot & Response Time Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Barangay Hotspot Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Incident Hotspots by Barangay</h3>
          <p className="text-[11px] text-slate-400 mb-5">Top barangays with most crime reports</p>
          {barangayData.length > 0 ? (
            <div className="space-y-3">
              {barangayData.map((b, i) => {
                const pct = Math.round((b.count / maxBgy) * 100);
                const colors = ["bg-[#0a1e3f]", "bg-blue-600", "bg-indigo-500", "bg-violet-500", "bg-sky-400", "bg-slate-400"];
                return (
                  <div key={b.name} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}</span>
                    <span className="text-xs font-semibold text-slate-700 w-28 shrink-0 truncate">{b.name}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-1000 ease-out`} style={{ width: `${animate ? pct : 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 w-5 text-right">{b.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {respTable.map((row, i) => {
                const pct = Math.round((row.incidents / 23) * 100);
                const colors = ["bg-[#0a1e3f]", "bg-blue-600", "bg-indigo-500", "bg-violet-500", "bg-sky-400"];
                return (
                  <div key={row.barangay} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}</span>
                    <span className="text-xs font-semibold text-slate-700 w-28 shrink-0">{row.barangay}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i]} transition-all duration-1000 ease-out`} style={{ width: `${animate ? pct : 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 w-5 text-right">{row.incidents}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Response Time Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Response Time by Barangay</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Average dispatch response performance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Barangay", "Incidents", "Avg Time", "Resolved", "Rate"].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {respTable.map(row => (
                  <tr key={row.barangay} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{row.barangay}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-800">{row.incidents}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{row.avgTime} min</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{row.resolved}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${animate ? row.rate : 0}%` }} />
                        </div>
                        <span className="text-xs font-bold text-emerald-700">{row.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
