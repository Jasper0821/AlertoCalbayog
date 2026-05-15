import { shellCard, innerCard, pillBase, SectionHeader, statusChip } from "./SharedUI.jsx";

export function OverviewSection({ reports = [], isOffline }) {
  const totalReports = reports.length;
  const activeOps = reports.filter(r => r.status === "pending" || r.status === "responding").length;
  const closedCases = reports.filter(r => r.status === "resolved" || r.status === "closed").length;
  
  const summaryCards = [
    { id: "incidents", label: "Total Reports", value: totalReports, detail: "Active incidents in city grid" },
    { id: "active", label: "Active Operations", value: activeOps, detail: "Ongoing fire response units" },
    { id: "completed", label: "Closed Cases", value: closedCases, detail: "Successfully resolved reports" },
    { id: "units", label: "Deployable Units", value: "12", detail: "Available responder teams" },
  ];

  return (
    <section id="dashboard" className={shellCard}>
      <div className="p-6 sm:p-8">
        <SectionHeader
          title="Command overview"
          action={
            <span className={`${pillBase} ${isOffline ? statusChip.danger : statusChip.success}`}>
              {isOffline ? "Offline Mode Active" : "Database Sync Active"}
            </span>
          }
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <article className={`${innerCard} p-6`} key={card.id}>
              <p className="font-display text-4xl font-black tracking-[-0.07em] text-slate-900 dark:text-white transition-colors">{card.value}</p>
              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-500 leading-relaxed">{card.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6">
            <article className={`${innerCard} p-6`}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-6">Recent Alerts</h3>
                <div className="space-y-4">
                    {reports.length > 0 ? (
                      <div className="space-y-3">
                        {reports.slice(0, 3).map(report => (
                          <div key={report.id || report._id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                              <p className="text-[10px] font-black uppercase text-red-600">{report.emergencyType}</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{report.description || "Active Alert"}</p>
                            </div>
                            <span className={`${pillBase} ${report.status === "pending" ? statusChip.danger : statusChip.success}`}>
                              {report.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-slate-500 py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px]">No immediate alerts in grid</p>
                    )}
                </div>
            </article>
        </div>
      </div>
    </section>
  );
}

