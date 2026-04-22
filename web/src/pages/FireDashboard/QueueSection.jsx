import { useState } from "react";
import { shellCard, innerCard, pillBase, SectionHeader, queueGroups, incidentChip, statusChip } from "./SharedUI.jsx";

export function QueueSection() {
  const [activeTab, setActiveTab] = useState("pending");

  return (
    <section id="queuing" className={shellCard}>
      <div className="p-10">
        <SectionHeader
          title="Dispatch queue"
          action={<span className={`${pillBase} ${statusChip.neutral}`}>Auto-sync verified</span>}
        />

        <div className="mb-10 flex gap-4 border-b border-slate-100 pb-6">
          {[
            { id: "pending", label: "Pending", tone: "red" },
            { id: "active", label: "Active", tone: "red" },
            { id: "completed", label: "Completed", tone: "emerald" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${pillBase} transition-all px-8 py-3 ${
                activeTab === tab.id
                  ? `bg-${tab.tone}-600 text-white shadow-lg shadow-${tab.tone}-600/20`
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-8">
          {activeTab === "pending" && (
            <div className="grid gap-4">
               {(!queueGroups.pending || queueGroups.pending.length === 0) ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Queue is clear</p>
                  <p className="mt-2 text-sm font-bold text-slate-600">No pending dispatches at this moment.</p>
                </div>
              ) : (
                queueGroups.pending.map((item) => (
                    <article key={item.id} className={`${innerCard} p-8`}>
                        {/* Item layout */}
                    </article>
                ))
              )}
            </div>
          )}

          {activeTab === "active" && (
            <div className="grid gap-6">
              {(!queueGroups.ongoing || queueGroups.ongoing.length === 0) ? (
                 <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tactical Zero</p>
                 <p className="mt-2 text-sm font-bold text-slate-600">No active operations in progress.</p>
               </div>
              ) : (
                queueGroups.ongoing.map((item) => (
                  <article key={item.id} className={`${innerCard} p-8 flex items-center justify-between`}>
                    <div className="flex gap-6 items-center">
                        <div className="h-16 w-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-xl font-black text-slate-900 shadow-sm">
                            {item.type[0]}
                        </div>
                        <div>
                            <span className={`${pillBase} ${incidentChip[item.type.toLowerCase()]} mb-2`}>{item.type}</span>
                            <h4 className="text-lg font-black text-slate-900 tracking-tight">{item.location}</h4>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unit Assigned</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">{item.assigned}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {activeTab === "completed" && (
            <div className="grid gap-6">
              {(!queueGroups.completed || queueGroups.completed.length === 0) ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">History Empty</p>
                  <p className="mt-2 text-sm font-bold text-slate-600">No successfully closed reports today.</p>
                </div>
              ) : (
                queueGroups.completed.map((item) => (
                  <article key={item.id} className={`${innerCard} p-8 flex items-center justify-between opacity-80 grayscale hover:grayscale-0 hover:opacity-100`}>
                    <div className="flex gap-6 items-center">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sm font-black text-red-600">
                             ✓
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 tracking-tight">{item.location}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Status: Closed</p>
                        </div>
                    </div>
                    <span className={`${pillBase} ${statusChip.success}`}>Handled by {item.assigned}</span>
                  </article>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

export default QueueSection;
