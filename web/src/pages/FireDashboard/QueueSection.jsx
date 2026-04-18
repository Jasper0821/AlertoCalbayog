import { useState } from "react";

import { shellCard, innerCard, pillBase, SectionHeader, queueGroups, incidentChip, statusChip } from "./SharedUI.jsx";

export function QueueSection() {
  const [activeTab, setActiveTab] = useState("pending");

  return (
    <section id="queuing" className={shellCard}>
      <div className="p-6">
        <SectionHeader
          eyebrow="Queuing"
          title="Dispatch queue"
          description="Review pending dispatches, what is active now, and what has been successfully closed."
          action={<span className={`${pillBase} border-white/10 bg-white/5 text-stone-200`}>Auto-refreshes seamlessly</span>}
        />

        <div className="mb-6 flex gap-3 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("pending")}
            className={`${pillBase} transition-all ${activeTab === "pending" ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-transparent bg-transparent text-stone-400 hover:text-stone-200 hover:bg-white/5"}`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`${pillBase} transition-all ${activeTab === "active" ? "border-red-500/20 bg-red-500/10 text-red-100" : "border-transparent bg-transparent text-stone-400 hover:text-stone-200 hover:bg-white/5"}`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`${pillBase} transition-all ${activeTab === "completed" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100" : "border-transparent bg-transparent text-stone-400 hover:text-stone-200 hover:bg-white/5"}`}
          >
            Completed
          </button>
        </div>

        <div className="grid gap-6">
          {activeTab === "pending" && (
            <article className={`${innerCard} p-4`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">Waiting</p>
                  <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.04em] text-stone-50">Pending Dispatches</h3>
                </div>
                <span className={`${pillBase} ${statusChip.neutral}`}>0 waiting</span>
              </div>
              <div className="grid gap-3">
                <p className="text-stone-400 text-sm py-4">No pending operations at this time.</p>
              </div>
            </article>
          )}

          {activeTab === "active" && (
            <article className={`${innerCard} p-4`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">Ongoing</p>
                  <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.04em] text-stone-50">Active operations</h3>
                </div>
                <span className={`${pillBase} ${statusChip.danger}`}>{queueGroups.ongoing?.length || 0} active</span>
              </div>
              <div className="grid gap-3">
                {(!queueGroups.ongoing || queueGroups.ongoing.length === 0) ? (
                  <p className="text-stone-400 text-sm py-4">No active operations at this time.</p>
                ) : (
                  queueGroups.ongoing.map((item) => (
                    <div key={item.id} className={`${innerCard} grid gap-3 p-4`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid gap-1">
                          <span className={`${pillBase} ${incidentChip[item.type.toLowerCase()] || ""}`}>{item.type}</span>
                          <span className="text-xs text-stone-400">{item.id}</span>
                        </div>
                        <span className="text-xs font-semibold text-stone-400">{item.assigned}</span>
                      </div>
                      <p className="text-sm leading-6 text-stone-200">{item.location}</p>
                      <div className="flex items-center justify-between gap-3">
                        <span className={`${pillBase} ${statusChip.danger}`}>ETA {item.eta}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          )}

          {activeTab === "completed" && (
            <article className={`${innerCard} p-4`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">Completed</p>
                  <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.04em] text-stone-50">Closed cases</h3>
                </div>
                <span className={`${pillBase} ${statusChip.success}`}>{queueGroups.completed?.length || 0} done</span>
              </div>
              <div className="grid gap-3">
                 {(!queueGroups.completed || queueGroups.completed.length === 0) ? (
                  <p className="text-stone-400 text-sm py-4">No closed operations at this time.</p>
                ) : (
                  queueGroups.completed.map((item) => (
                    <div key={item.id} className={`${innerCard} grid gap-3 p-4`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid gap-1">
                          <span className={`${pillBase} ${incidentChip[item.type.toLowerCase()] || ""}`}>{item.type}</span>
                          <span className="text-xs text-stone-400">{item.id}</span>
                        </div>
                        <span className="text-xs font-semibold text-stone-400">{item.assigned}</span>
                      </div>
                      <p className="text-sm leading-6 text-stone-200">{item.location}</p>
                      <div className="flex items-center justify-between gap-3">
                        <span className={`${pillBase} ${statusChip.success}`}>Closed {item.closedAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
