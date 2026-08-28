import { useMemo, useState } from "react";
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TYPE_ICONS } from "../../../utils/incidentFormatters.js";
import IncidentDetailModal from "../PNP/IncidentDetailModal.jsx";
import ResolutionEvidenceModal from "../ResolutionEvidenceModal.jsx";

/* ─── Brand (BFP Fire Red) ─────────────────────────────────────────── */
const BRAND    = "#dc2626";
const BRAND_D  = "#b91c1c";
const BRAND_BG = "#fef2f2";

/* ─── Build daily trend for THIS month ──────────────────────────── */
function buildDailyTrend(reports) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const days  = new Date(year, month + 1, 0).getDate();

  const data = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    label: `${i + 1}`,
    resolved: 0,
    pending: 0,
  }));

  reports.forEach(r => {
    if (!r.createdAt) return;
    const d = new Date(r.createdAt);
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    const idx = d.getDate() - 1;
    const isResolved = ["resolved","responded","closed"].includes((r.status || "").toLowerCase());
    if (isResolved) data[idx].resolved++;
    else data[idx].pending++;
  });
  return data;
}

/* ─── Build calendar incident map ───────────────────────────────── */
function buildCalendarMap(reports) {
  const map = {};
  reports.forEach(r => {
    if (!r.createdAt) return;
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map[key]) map[key] = { p: 0, a: 0, r: 0 };
    const s = (r.status || "").toLowerCase();
    if (["resolved","responded","closed"].includes(s)) map[key].r++;
    else if (["responding","ongoing","dispatching","en_route","active"].includes(s)) map[key].a++;
    else map[key].p++;
  });
  return map;
}

/* ─── Compact Calendar ──────────────────────────────────────────── */
function MiniCalendar({ reports }) {
  const [viewing, setViewing] = useState(() => new Date());
  const calMap = useMemo(() => buildCalendarMap(reports), [reports]);

  const year  = viewing.getFullYear();
  const month = viewing.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewing.toLocaleString("default", { month: "long" });

  const prevMonth = () => setViewing(new Date(year, month - 1, 1));
  const nextMonth = () => setViewing(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Activity Calendar</h4>
          <p className="text-[10px] font-semibold text-slate-400">{monthName} {year}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 text-center mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <span key={d} className="text-[9px] font-bold text-slate-400 uppercase">{d}</span>
        ))}
      </div>

      {/* Grid Body */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          const key = `${year}-${month}-${day}`;
          const counts = calMap[key];
          const isToday = isThisMonth && today.getDate() === day;

          let dotColor = null;
          if (counts) {
            if (counts.p > 0) dotColor = "bg-amber-400";
            else if (counts.a > 0) dotColor = "bg-red-500";
            else if (counts.r > 0) dotColor = "bg-emerald-500";
          }

          return (
            <div
              key={day}
              className={`relative flex flex-col items-center justify-center py-1 rounded-lg text-[11px] font-semibold transition-all ${
                isToday
                  ? "bg-red-600 text-white font-bold shadow-sm"
                  : counts
                  ? "bg-slate-50 text-slate-800 font-bold"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span>{day}</span>
              {dotColor && !isToday && (
                <span className={`w-1 h-1 rounded-full ${dotColor} mt-0.5`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"/> Pending</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"/> Responding</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Resolved</span>
      </div>
    </div>
  );
}

export default function DashboardOverview({ reports = [], setActiveNav, onStatusChange }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [evidenceModalReport, setEvidenceModalReport] = useState(null);

  // Filters
  const safeReports = Array.isArray(reports) ? reports : [];

  const pending     = safeReports.filter(r => ["pending","verified"].includes((r.status || "").toLowerCase()));
  const active      = safeReports.filter(r => ["responding","ongoing","dispatching","en_route","active"].includes((r.status || "").toLowerCase()));
  const resolved    = safeReports.filter(r => ["resolved","responded","closed"].includes((r.status || "").toLowerCase()));

  const trendData   = useMemo(() => buildDailyTrend(safeReports), [safeReports]);

  // Recent pending/active combined (up to 5)
  const recentIncidents = useMemo(() => {
    return [...pending, ...active]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [pending, active]);

  return (
    <div className="space-y-5">

      {/* ── Top Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Total Incidents */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Fire Incidents</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{safeReports.length}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Reported fire emergencies</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 6.51 6.51 0 009 11.5a3.25 3.25 0 006.687-1.027c.053-.197.093-.4.12-.606.03-.224.053-.45.068-.68a8.174 8.174 0 00-.513-3.973z" />
            </svg>
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div
          onClick={() => setActiveNav("queuing")}
          className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-300 transition-all"
        >
          <div>
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Dispatch</p>
            <p className="text-2xl font-black text-amber-900 mt-1">{pending.length}</p>
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Awaiting dispatch action</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Card 3: Active Responding */}
        <div
          onClick={() => setActiveNav("incident-reports")}
          className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-red-300 transition-all"
        >
          <div>
            <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Active Responses</p>
            <p className="text-2xl font-black text-red-900 mt-1">{active.length}</p>
            <p className="text-[10px] text-red-600 font-medium mt-0.5">Units currently deployed</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 6.51 6.51 0 009 11.5a3.25 3.25 0 006.687-1.027c.053-.197.093-.4.12-.606.03-.224.053-.45.068-.68a8.174 8.174 0 00-.513-3.973z" />
            </svg>
          </div>
        </div>

        {/* Card 4: Resolved */}
        <div
          onClick={() => setActiveNav("incident-history")}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Resolved Fires</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{resolved.length}</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Successfully contained</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

      </div>

      {/* ── Middle Row: Trend Chart + Mini Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Fire Incident Trend</h3>
              <p className="text-[11px] text-slate-400 font-medium">Daily breakdown for the current month</p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
              BFP Command
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs">
                        <p className="font-bold text-slate-800 mb-1">Day {label}</p>
                        {payload.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-slate-500 font-medium">{p.name}:</span>
                            <span className="font-bold text-slate-800">{p.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="pending" name="Pending/Active" stroke={BRAND} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 mt-3 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-full bg-emerald-500" />
              <span>Resolved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-full bg-red-600" />
              <span>Pending/Active</span>
            </div>
          </div>
        </div>

        {/* Mini Calendar (1 col) */}
        <div className="lg:col-span-1">
          <MiniCalendar reports={safeReports} />
        </div>

      </div>

      {/* ── Bottom Section: Active/Pending Incident Table ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Priority Incidents Queue</h3>
            <p className="text-[11px] text-slate-400 font-medium">Recent pending and active fire emergencies</p>
          </div>
          <button
            onClick={() => setActiveNav("queuing")}
            className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
          >
            <span>View Full Queue</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Type", "Location", "Reporter", "Status", "Date & Time", "Action"].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                    No active or pending fire incidents at this time.
                  </td>
                </tr>
              ) : (
                recentIncidents.map((r, i) => {
                  const type = (r.emergencyType || "fire").toLowerCase();
                  const iconInfo = TYPE_ICONS[type] || TYPE_ICONS.fire;
                  const locText = typeof r.location === "string" ? r.location : (r.location?.name || "Unknown");
                  const date = r.createdAt ? new Date(r.createdAt) : new Date();
                  const isPending = ["pending","verified"].includes((r.status || "").toLowerCase());

                  return (
                    <tr key={r._id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{iconInfo.icon}</span>
                          <span>{iconInfo.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[200px] truncate" title={locText}>{locText}</td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">{r.userId?.fullName || "Anonymous"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isPending
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPending ? "bg-amber-500" : "bg-red-500 animate-ping"}`} />
                          {r.status || "pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            View
                          </button>
                          {isPending && onStatusChange && (
                            <button
                              onClick={() => onStatusChange(r._id, "active")}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs"
                            >
                              Dispatch
                            </button>
                          )}
                          {!isPending && onStatusChange && (
                            <button
                              onClick={() => setEvidenceModalReport(r)}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail Modal */}
      <IncidentDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />

      {/* Resolution Evidence Modal */}
      {evidenceModalReport && (
        <ResolutionEvidenceModal
          report={evidenceModalReport}
          onClose={() => setEvidenceModalReport(null)}
          onSubmit={(id, newStatus, evidenceImages) => {
            onStatusChange(id, newStatus, evidenceImages);
            setEvidenceModalReport(null);
          }}
        />
      )}
    </div>
  );
}
