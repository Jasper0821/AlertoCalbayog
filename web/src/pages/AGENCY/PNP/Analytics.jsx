import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function Analytics({ reports = [] }) {
  const [animate, setAnimate] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [openRangeMenu, setOpenRangeMenu] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const safeReports = Array.isArray(reports) ? reports : [];
  const rangeOptions = [
    { days: 7, label: "Last 7 Days" },
    { days: 14, label: "Last 14 Days" },
    { days: 30, label: "Last 30 Days" },
  ];
  const rangeLabel = rangeOptions.find((option) => option.days === analyticsDays)?.label || "Last 30 Days";
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - (analyticsDays - 1));
  const rangeReports = safeReports.filter((report) => {
    const reportDate = new Date(report.createdAt || report.date || 0);
    return !Number.isNaN(reportDate.getTime()) && reportDate >= rangeStart;
  });

  const renderRangePicker = (menuId) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenRangeMenu(openRangeMenu === menuId ? null : menuId)}
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition hover:text-blue-600"
        aria-expanded={openRangeMenu === menuId}
      >
        {rangeLabel}
        <svg className={`h-3 w-3 transition-transform ${openRangeMenu === menuId ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {openRangeMenu === menuId && (
        <div className="absolute right-0 top-full z-20 mt-2 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {rangeOptions.map((option) => (
            <button
              key={option.days}
              type="button"
              onClick={() => { setAnalyticsDays(option.days); setOpenRangeMenu(null); }}
              className={`block w-full px-3 py-2 text-left text-[10px] font-bold transition hover:bg-slate-50 ${analyticsDays === option.days ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Live counts
  const total = safeReports.length;
  const responded = safeReports.filter(r =>
    ["resolved", "closed", "responded"].includes((r.status || "").toLowerCase())
  ).length;
  const pending = safeReports.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const active = safeReports.filter(r => (r.status || "").toLowerCase() === "active").length;
  const resolutionRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  const monthlyTrend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const incidents = safeReports.filter((report) => {
        const reportDate = new Date(report.createdAt || report.date || 0);
        return !Number.isNaN(reportDate.getTime()) && reportDate.getFullYear() === year && reportDate.getMonth() === month;
      }).length;
      return {
        month: monthDate.toLocaleString("en", { month: "short" }),
        incidents,
      };
    });
  }, [safeReports]);
  const currentMonthIncidents = monthlyTrend.at(-1)?.incidents || 0;
  const previousMonthIncidents = monthlyTrend.at(-2)?.incidents || 0;
  const monthChange = previousMonthIncidents > 0
    ? Math.round(((currentMonthIncidents - previousMonthIncidents) / previousMonthIncidents) * 100)
    : currentMonthIncidents > 0 ? 100 : 0;
  const peakIncidents = Math.max(...monthlyTrend.map((item) => item.incidents), 0);

  // Barangay data is derived only from location fields stored on each report.
  // Do not substitute a known-barangay list or a sample location here: records
  // with no saved barangay simply cannot be represented in this chart.
  const barangayMap = {};
  rangeReports.forEach(r => {
    const bgy = typeof r.location === "string"
      ? r.location.trim()
      : (r.location?.barangay || r.location?.name || "").trim();
    if (bgy) {
      if (!barangayMap[bgy]) {
        barangayMap[bgy] = { name: bgy, count: 0, resolved: 0, pending: 0, responding: 0 };
      }
      barangayMap[bgy].count += 1;

      const status = (r.status || "pending").toLowerCase();
      if (["resolved", "closed", "cancelled", "responded"].includes(status)) {
        barangayMap[bgy].resolved += 1;
      } else if (status === "pending") {
        barangayMap[bgy].pending += 1;
      } else {
        barangayMap[bgy].responding += 1;
      }
    }
  });
  const barangayData = Object.values(barangayMap)
    .sort((a, b) => b.count - a.count);

  // Crime sub-type from real data
  const crimeTypeMap = {};
  safeReports.forEach(r => {
    const type = r.type || r.crimeType || r.incidentType || "Other";
    crimeTypeMap[type] = (crimeTypeMap[type] || 0) + 1;
  });
  const crimeTypes = Object.entries(crimeTypeMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  if (crimeTypes.length === 0) {
    crimeTypes.push({ label: "No Data", count: 0 });
  }
  const crimeTotal = crimeTypes.reduce((s, c) => s + c.count, 0) || 1;
  const maxCrime = Math.max(...crimeTypes.map(c => c.count), 1);

  // Heatmap data from real data (Rows: time blocks, Cols: Sun-Sat)
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const times = ["12am", "4am", "8am", "12pm", "4pm", "8pm"];
  const heatmapData = Array(6).fill(0).map(() => Array(7).fill(0));
  rangeReports.forEach(r => {
    const d = new Date(r.createdAt || r.date || Date.now());
    if (!isNaN(d.getTime())) {
      const day = d.getDay();
      const hour = d.getHours();
      const slot = Math.floor(hour / 4);
      if (slot >= 0 && slot < 6) {
        heatmapData[slot][day] += 1;
      }
    }
  });

  // Recent History from real data
  const sortedReports = safeReports.slice().sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
  const recentHistory = sortedReports.slice(0, 5).map((r, i) => {
    const title = r.reporterName || r.type || r.crimeType || "Incident";
    const location = r.location?.barangay || (typeof r.location === 'string' ? r.location : "Unknown");
    const date = new Date(r.createdAt || r.date || Date.now());
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isToday = date.toDateString() === new Date().toDateString();

    return {
      id: r._id || i,
      title,
      location,
      time,
      isToday,
      avatar: title.charAt(0).toUpperCase(),
      bg: ["bg-slate-200 text-slate-700", "bg-slate-800 text-white", "bg-indigo-600 text-white", "bg-blue-500 text-white", "bg-slate-300 text-slate-800"][i % 5]
    };
  });

  return (
    <div className="space-y-5 pb-10 w-full min-h-screen bg-[#f8fafc] p-4 lg:p-8 rounded-3xl font-sans">

      {/* TOP ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">

        {/* 1. Overall Trend (Line Chart) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col">
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 bg-slate-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">Overall Incidents</p>
                <div className="flex items-end gap-3">
                  <h2 className="text-3xl font-black text-slate-800 leading-none">{total}</h2>
                  <span className={`mb-0.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm ${monthChange >= 0 ? "bg-emerald-400 shadow-emerald-200" : "bg-red-400 shadow-red-200"}`}>
                    {monthChange > 0 ? "+" : ""}{monthChange}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>Current: {currentMonthIncidents}</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-200"></span>Previous: {previousMonthIncidents}</div>
            </div>
          </div>

          <div className="min-h-[220px] flex-1 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 700 }}
                  formatter={(value) => [`${value} incident${value === 1 ? "" : "s"}`, "Reports"]}
                />
                <Line type="monotone" dataKey="incidents" stroke="#2563eb" strokeWidth={4} dot={{ r: 4, fill: "#fff", stroke: "#2563eb", strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={animate} />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">Peak in this period: {peakIncidents} incident{peakIncidents === 1 ? "" : "s"}</p>
          </div>
        </div>

        {/* 2. Donut Chart (Source/Status) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-800">Status</h3>
            <span className="text-slate-300 font-bold tracking-widest leading-none mb-1">...</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="relative w-40 h-40 mb-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="12"
                  strokeDasharray={`${(resolutionRate || 75) * 2.64} 264`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray={`${(Math.round((pending / total) * 100) || 15) * 2.64} 264`}
                  strokeDashoffset={`-${(resolutionRate || 75) * 2.64}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out delay-200"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800 leading-none mb-1">{resolutionRate || 75}%</span>
                <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5" /><path d="M12 4v16" /></svg>
                  12.7%
                </span>
              </div>
            </div>

            <div className="mt-4 px-4 py-2 rounded-full border border-slate-100 shadow-sm flex items-center gap-2 mb-8">
              <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-[10px]">★</div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Poor Response Rate</span>
            </div>

            <div className="w-full space-y-3.5 mt-auto">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>Resolved</div>
                <span className="text-slate-800 font-black text-xs">{resolutionRate || 75}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Pending</div>
                <span className="text-slate-800 font-black text-xs">{Math.round((pending / total) * 100) || 15}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-300"></span>Active</div>
                <span className="text-slate-800 font-black text-xs">{100 - (resolutionRate || 75) - (Math.round((pending / total) * 100) || 15)}%</span>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* 4. Horizontal Bar Chart (Top Barangays) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Incidents by Barangay / Location</h3>
            </div>
            {renderRangePicker("barangay")}
          </div>

          <div className="flex-1 min-h-[280px] max-h-[500px] w-full overflow-y-auto overflow-x-hidden pr-2">
            {barangayData.length > 0 ? (
              <div style={{ height: Math.max(280, barangayData.length * 35) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barangayData} layout="vertical" margin={{ top: 8, right: 18, left: 28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                    <YAxis type="category" dataKey="name" width={92} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} />
                    <Tooltip
                      cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg min-w-[120px]">
                            <p className="font-black text-slate-900 mb-2">{label}</p>
                            <div className="space-y-1">
                              <p className="font-bold text-slate-600 flex justify-between gap-4"><span>Total:</span><span>{payload[0].payload.count}</span></p>
                              <p className="font-semibold text-emerald-500 flex justify-between gap-4"><span>Resolved:</span><span>{payload[0].payload.resolved}</span></p>
                              <p className="font-semibold text-amber-500 flex justify-between gap-4"><span>Pending:</span><span>{payload[0].payload.pending}</span></p>
                              <p className="font-semibold text-indigo-500 flex justify-between gap-4"><span>Active:</span><span>{payload[0].payload.responding}</span></p>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="resolved" stackId="a" fill="#10b981" barSize={16} />
                    <Bar dataKey="pending" stackId="a" fill="#f59e0b" barSize={16} />
                    <Bar dataKey="responding" stackId="a" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center px-6 text-center text-xs font-semibold text-slate-400">
                No incident records with a saved location in this period.
              </div>
            )}
          </div>
        </div>

        {/* 5. Heatmap (Incidents per week) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-800">Incidents per week</h3>
            {renderRangePicker("heatmap")}
          </div>

          <div className="flex pl-2">
            <div className="flex flex-col justify-between text-[9px] font-bold text-slate-400 pr-4 py-1 h-[200px]">
              {times.map(t => <span key={t} className="flex-1 flex items-center">{t}</span>)}
            </div>

            <div className="flex-1 flex flex-col gap-2 h-[200px]">
              {heatmapData.map((row, rIdx) => (
                <div key={rIdx} className="flex-1 flex gap-2">
                  {row.map((val, cIdx) => {
                    const bgStyles = ["bg-slate-100", "bg-blue-200", "bg-blue-400", "bg-blue-600"];
                    return (
                      <div
                        key={cIdx}
                        className={`flex-1 rounded-md ${bgStyles[val]} transition-all duration-500 hover:scale-110 hover:shadow-md cursor-pointer`}
                        style={{ opacity: animate ? 1 : 0, transitionDelay: `${(rIdx * 7 + cIdx) * 15}ms` }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between ml-10 mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">
            {days.map(d => <span key={d} className="flex-1 text-center">{d}</span>)}
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-[9px] font-bold text-slate-400">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-100"></span> 0-300</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-200"></span> 300-600</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400"></span> 600-900</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> 900+</div>
          </div>
        </div>


      </div>

    </div>
  );
}
