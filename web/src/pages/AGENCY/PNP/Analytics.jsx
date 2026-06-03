import { TYPE_ICONS } from "./utils.js";

export default function Analytics({ reports = [] }) {
  const total = reports.length || 128;
  const resolved = reports.filter(r => ["resolved", "closed"].includes(r.status)).length || 114;
  const pending = reports.filter(r => r.status === "pending").length || 8;
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 89;

  const typeBreakdown = ["fire", "medical", "police", "flood", "accident", "disaster"].map(key => {
    const count = reports.filter(r => (r.emergencyType || "").toLowerCase() === key).length || Math.floor(Math.random() * 20 + 5);
    const pct = total > 0 ? Math.round((count / total) * 100) : Math.round(count / 1.2);
    const colors = { fire: "bg-red-500", medical: "bg-emerald-500", police: "bg-blue-500", flood: "bg-sky-400", accident: "bg-orange-500", disaster: "bg-amber-400" };
    const info = TYPE_ICONS[key] || TYPE_ICONS.others;
    return { key, label: info.label, icon: info.icon, count, pct, color: colors[key] || "bg-slate-400" };
  });

  const MONTHLY = [
    { month: "Jan", value: 62 },
    { month: "Feb", value: 74 },
    { month: "Mar", value: 58 },
    { month: "Apr", value: 91 },
    { month: "May", value: 83 },
    { month: "Jun", value: total || 128 },
  ];
  const maxVal = Math.max(...MONTHLY.map(m => m.value));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Incident trends, response metrics, and operational insights.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Incidents", value: total, sub: "This month", color: "text-slate-800", bg: "bg-slate-50 border-slate-200" },
          { label: "Resolved", value: resolved, sub: `${rate}% rate`, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Pending", value: pending, sub: "Need action", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
          { label: "Avg Response", value: "6:22", sub: "Target: < 8:00", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
        ].map(k => (
          <div key={k.label} className={`border rounded-2xl p-5 ${k.bg}`}>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{k.label}</p>
            <p className={`text-3xl font-black mt-2 ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Incident Trend</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Total incidents reported per month</p>
            </div>
            <select className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-600 bg-slate-50 outline-none">
              <option>2024</option>
            </select>
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
                      className={`w-full rounded-t-xl transition-all duration-500 ${isLast ? "bg-blue-600 shadow-md shadow-blue-200" : "bg-slate-200 group-hover:bg-slate-300"}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident type breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">By Incident Type</h3>
          <div className="space-y-3.5">
            {typeBreakdown.map(t => (
              <div key={t.key}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </div>
                  <span className="font-bold text-slate-800">{t.count} <span className="text-slate-400 font-normal text-[10px]">({t.pct}%)</span></span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${t.color}`} style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Performance Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Response Time by Type</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Type", "Total", "Avg Response", "Resolved", "Rate"].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { type: "fire", total: 24, avg: "4:12", resolved: 22, rate: 91 },
                { type: "medical", total: 38, avg: "5:44", resolved: 36, rate: 94 },
                { type: "police", total: 31, avg: "6:55", resolved: 28, rate: 90 },
                { type: "flood", total: 18, avg: "8:30", resolved: 15, rate: 83 },
                { type: "accident", total: 17, avg: "7:05", resolved: 13, rate: 76 },
              ].map(row => {
                const info = TYPE_ICONS[row.type] || TYPE_ICONS.others;
                return (
                  <tr key={row.type} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{info.icon}</span>
                        <span className="text-xs font-medium text-slate-700">{info.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-800">{row.total}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{row.avg} min</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{row.resolved}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${row.rate}%` }} />
                        </div>
                        <span className="text-xs font-bold text-emerald-700">{row.rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
