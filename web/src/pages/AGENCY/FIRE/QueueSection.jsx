import { useState } from "react";
import { shellCard, innerCard, pillBase, SectionHeader, incidentChip, statusChip } from "./SharedUI.jsx";

export function QueueSection({ reports = [] }) {
  const [activeTab, setActiveTab] = useState("pending");

  const pendingReports = reports.filter(r => r.status === "pending");
  const activeReports = reports.filter(r => r.status === "responding");
  const completedReports = reports.filter(r => r.status === "resolved" || r.status === "closed");

  const getTabData = () => {
    switch (activeTab) {
      case "pending": return pendingReports;
      case "active": return activeReports;
      case "completed": return completedReports;
      default: return [];
    }
  };

  const currentData = getTabData();

  return (
    <section id="queuing" className={shellCard}>
      <div className="p-10">
        <SectionHeader
          title="Dispatch queue"
          action={<span className={`${pillBase} ${statusChip.neutral}`}>Auto-sync verified</span>}
        />

        <div className="mb-10 flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 transition-colors">
          {[
            { id: "pending", label: "Pending", tone: "red", count: pendingReports.length },
            { id: "active", label: "Active", tone: "red", count: activeReports.length },
            { id: "completed", label: "Completed", tone: "emerald", count: completedReports.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${pillBase} transition-all px-8 py-3 ${
                activeTab === tab.id
                  ? `bg-${tab.tone}-600 text-white shadow-lg shadow-${tab.tone}-600/20`
                  : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 border-transparent"
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label} ({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="grid gap-8">
          {currentData.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px] bg-slate-50/30 dark:bg-slate-950/20">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Queue is clear</p>
              <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-500">No {activeTab} reports at this moment.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {currentData.map((item) => (
                <article key={item.id || item._id} className={`${innerCard} p-8 flex items-center justify-between`}>
                  <div className="flex gap-6 items-center">
                    <div className="h-16 w-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-xl font-black text-slate-900 dark:text-white shadow-sm transition-colors">
                      {item.emergencyType[0].toUpperCase()}
                    </div>
                    <div>
                      <span className={`${pillBase} ${incidentChip[item.emergencyType] || incidentChip.fire} mb-2`}>{item.emergencyType}</span>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight transition-colors">{item.location?.name || "Sector Alpha"}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description || "No description provided"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Assigned Agency</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200 mt-1 transition-colors">{item.assignedAgency || "Dispatching..."}</p>
                    <span className={`${pillBase} mt-2 ${item.status === "pending" ? statusChip.danger : statusChip.success}`}>
                      {item.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default QueueSection;

