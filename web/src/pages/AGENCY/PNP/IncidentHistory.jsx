import { useState } from "react";
import { STATUS_STYLES, TYPE_ICONS, getPriority, getIncidentId, PRIORITY_STYLES } from "./utils.js";

export default function IncidentHistory({ reports = [] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const resolved = reports.filter(r => ["resolved", "closed", "cancelled"].includes((r.status || "").toLowerCase()));
  
  const filtered = resolved.filter(r => {
    const type = (r.emergencyType || "").toLowerCase();
    const loc = typeof r.location === "string" ? r.location : (r.location?.name || "");
    const name = r.userId?.fullName || "";
    if (typeFilter !== "all" && type !== typeFilter) return false;
    if (search && !loc.toLowerCase().includes(search) && !name.toLowerCase().includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Incident History</h1>
        <p className="text-sm text-slate-500 mt-0.5">Archive of all resolved, closed, and cancelled incidents.</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex flex-wrap gap-3 items-center">
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
          <option value="police">Police</option>
          <option value="flood">Flood</option>
          <option value="accident">Accident</option>
        </select>
        <span className="ml-auto text-xs text-slate-400">
          <span className="font-bold text-slate-700">{filtered.length}</span> records
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Incident ID", "Type", "Location", "Reporter", "Date & Time", "Priority", "Status"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-sm text-slate-400">
                    No history records match your filters.
                  </td>
                </tr>
              ) : filtered.map((r, i) => {
                const type = (r.emergencyType || "others").toLowerCase();
                const status = (r.status || "pending").toLowerCase();
                const typeInfo = TYPE_ICONS[type] || TYPE_ICONS.others;
                const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.pending;
                const priority = getPriority(r);
                const incId = getIncidentId(r, i);
                const loc = typeof r.location === "string" ? r.location : (r.location?.name || "Unknown");
                const date = r.createdAt ? new Date(r.createdAt) : new Date();

                return (
                  <tr key={r._id || i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono font-bold text-blue-600">{incId}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{typeInfo.icon}</span>
                        <span className="text-xs font-medium text-slate-700">{typeInfo.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-600">{loc}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-600">{r.userId?.fullName || "Unknown"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-slate-600">{date.toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[priority]}`}>
                        {priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                        <span className={`text-xs font-semibold ${statusInfo.text}`}>{statusInfo.label}</span>
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
