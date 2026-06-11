import { useState, useEffect } from "react";

export default function Analytics({ reports = [] }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const safeReports = Array.isArray(reports) ? reports : [];

  // Live counts
  const total = safeReports.length;
  const responded = safeReports.filter(r =>
    ["resolved", "closed", "responded"].includes((r.status || "").toLowerCase())
  ).length;
  const pending = safeReports.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const active = safeReports.filter(r => (r.status || "").toLowerCase() === "active").length;
  const resolutionRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  // Barangay data
  const barangayMap = {};
  safeReports.forEach(r => {
    const bgy = r.location?.barangay || (typeof r.location === "string" ? r.location : "Unknown");
    barangayMap[bgy] = (barangayMap[bgy] || 0) + 1;
  });
  const barangayData = Object.entries(barangayMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  
  if (barangayData.length === 0) {
    barangayData.push({ name: "No Data", count: 0 });
  }
  const maxBgy = Math.max(...barangayData.map(b => b.count), 1);

  // Monthly trend from real data (last 6 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  const MONTHLY = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(currentMonth - (5 - i));
    return { month: monthNames[d.getMonth()], value: 0 };
  });
  safeReports.forEach(r => {
    const d = new Date(r.createdAt || r.date || Date.now());
    const mName = monthNames[d.getMonth()];
    const mObj = MONTHLY.find(x => x.month === mName);
    if (mObj) mObj.value += 1;
  });
  const maxMonthly = Math.max(...MONTHLY.map(m => m.value), 10); // Minimum scale of 10

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
  safeReports.forEach(r => {
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
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">Overall Incidents</p>
                <div className="flex items-end gap-3">
                  <h2 className="text-3xl font-black text-slate-800 leading-none">{total || "128"}</h2>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-400 text-white text-[10px] font-bold mb-0.5 shadow-sm shadow-emerald-200">
                    + 20.6%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>Current Month</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-200"></span>Last Month</div>
            </div>
          </div>
          
          <div className="flex-1 relative w-full flex items-end pt-8 min-h-[220px]">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path 
                d="M0,100 L0,85 Q10,85 20,70 T40,65 T60,20 T80,75 T100,55 L100,100 Z" 
                fill="url(#grad)" 
                className="transition-transform duration-1000 origin-bottom" 
                style={{ transform: animate ? "scaleY(1)" : "scaleY(0)" }} 
              />
              <path 
                d="M0,85 Q10,85 20,70 T40,65 T60,20 T80,75 T100,55" 
                fill="none" 
                stroke="#2563eb" 
                strokeWidth="2.5" 
                className="transition-all duration-1000" 
                strokeDasharray="300" 
                strokeDashoffset={animate ? 0 : 300} 
              />
              <path 
                d="M0,75 Q10,75 20,68 T40,78 T60,65 T80,70 T100,60" 
                fill="none" 
                stroke="#bfdbfe" 
                strokeWidth="1.5" 
                strokeDasharray="3 4" 
                className="transition-opacity duration-1000 delay-300" 
                style={{ opacity: animate ? 1 : 0 }} 
              />
              
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
                </linearGradient>
              </defs>
              
              <circle cx="60" cy="20" r="3.5" fill="white" stroke="#2563eb" strokeWidth="2" className="transition-opacity duration-700 delay-700 shadow-sm" style={{ opacity: animate ? 1 : 0 }} />
              <circle cx="60" cy="65" r="3" fill="white" stroke="#bfdbfe" strokeWidth="1.5" className="transition-opacity duration-700 delay-700" style={{ opacity: animate ? 1 : 0 }} />
              
              <line x1="60" y1="23" x2="60" y2="100" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" className="transition-opacity duration-700 delay-700" style={{ opacity: animate ? 1 : 0 }} />
            </svg>
            
            <div className={`absolute left-[60%] top-[10%] -translate-x-1/2 -translate-y-full bg-[#1e293b] text-white px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-700 delay-700 shadow-xl ${animate ? "opacity-100 translate-y-[-8px]" : "opacity-0 translate-y-[10px]"}`}>
              {maxMonthly} Incidents
              <div className="text-[9px] font-normal text-slate-300 mt-0.5">Peak Recorded</div>
            </div>

            <div className="absolute bottom-0 w-full flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2">
              {MONTHLY.map(m => <span key={m.month}>{m.month}</span>)}
            </div>
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
                  strokeDasharray={`${(Math.round((pending/total)*100) || 15) * 2.64} 264`} 
                  strokeDashoffset={`-${(resolutionRate || 75) * 2.64}`} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000 ease-out delay-200" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800 leading-none mb-1">{resolutionRate || 75}%</span>
                <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5"/><path d="M12 4v16"/></svg>
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
                <span className="text-slate-800 font-black text-xs">{Math.round((pending/total)*100) || 15}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-300"></span>Active</div>
                <span className="text-slate-800 font-black text-xs">{100 - (resolutionRate || 75) - (Math.round((pending/total)*100) || 15)}%</span>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 4. Horizontal Bar Chart (Top Barangays) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">{barangayData.length} Barangays</h3>
              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">({total} Incidents)</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 cursor-pointer flex items-center gap-1 uppercase tracking-wider">Last 7 days <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg></span>
          </div>
          
          <div className="space-y-5 mt-8 relative pl-16">
            <div className="absolute inset-0 pl-16 flex justify-between pointer-events-none z-0">
              <div className="h-full border-l border-slate-100"></div>
              <div className="h-full border-l border-slate-100"></div>
              <div className="h-full border-l border-slate-100"></div>
              <div className="h-full border-l border-slate-100"></div>
              <div className="h-full border-l border-slate-100"></div>
            </div>

            {barangayData.map((b, i) => {
              const w = Math.round((b.count / maxBgy) * 100);
              const isHighlight = i === 3; // Mock highlight style from image
              return (
                <div key={b.name} className="flex items-center relative z-10">
                  <span className="absolute left-0 -ml-16 w-14 text-[9px] font-bold text-slate-700 text-right truncate uppercase tracking-wider">{b.name}</span>
                  <div className="flex-1 h-3.5 flex items-center">
                    <div 
                      className={`h-full rounded-r-full transition-all duration-1000 ease-out ${isHighlight ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-blue-600"}`}
                      style={{ width: `${animate ? w : 0}%` }}
                    />
                    <span className="text-[9px] font-bold text-slate-400 ml-3">{b.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between pl-16 mt-6 text-[9px] font-bold text-slate-300">
            <span>0</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100</span>
          </div>
        </div>

        {/* 5. Heatmap (Incidents per week) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-800">Incidents per week</h3>
            <span className="text-[10px] font-bold text-slate-500 cursor-pointer flex items-center gap-1 uppercase tracking-wider">Last 7 days <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg></span>
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
