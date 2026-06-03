import { STATUS_STYLES, TYPE_ICONS, getPriority, getIncidentId, PRIORITY_STYLES } from "./utils.js";

export default function ActiveIncidents({ reports = [] }) {
  const active = reports.filter(r =>
    ["responding", "ongoing", "dispatching", "en_route", "active", "pending"].includes((r.status || "").toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Active Incidents</h1>
          <p className="text-sm text-slate-500 mt-0.5">Incidents currently requiring attention or in progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
            {active.length} Live
          </span>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-bold text-slate-700">All Clear</p>
          <p className="text-sm text-slate-400 mt-1">No active incidents at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {active.map((report, i) => {
            const type = (report.emergencyType || "others").toLowerCase();
            const status = (report.status || "pending").toLowerCase();
            const typeInfo = TYPE_ICONS[type] || TYPE_ICONS.others;
            const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.pending;
            const priority = getPriority(report);
            const incId = getIncidentId(report, i);
            const loc = typeof report.location === "string" ? report.location : (report.location?.name || "Unknown");
            const elapsed = report.createdAt
              ? Math.floor((Date.now() - new Date(report.createdAt).getTime()) / 60000)
              : 0;

            return (
              <div key={report._id || i} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className={`h-1 ${priority === "critical" ? "bg-red-500" : priority === "high" ? "bg-orange-400" : "bg-amber-400"}`}></div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">{typeInfo.icon}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{typeInfo.label}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{incId}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${PRIORITY_STYLES[priority]}`}>
                      {priority}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {loc}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {report.userId?.fullName || "Anonymous"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                      <span className={`text-xs font-semibold ${statusInfo.text}`}>{statusInfo.label}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{elapsed}m elapsed</span>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button className="flex-1 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                      Respond
                    </button>
                    <button className="px-4 py-2 text-xs font-semibold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
