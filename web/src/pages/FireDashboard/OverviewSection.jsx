import { cn } from "../../lib/cn.js";
import { shellCard, innerCard, pillBase, SectionHeader, summaryCards, ReportsTable, iconTone, statusChip, liveSignals } from "./SharedUI.jsx";

export function OverviewSection() {
  return (
    <section id="dashboard" className={shellCard}>
      <div className="p-6">
        <SectionHeader
          eyebrow="Dashboard"
          title="Command overview"
          description="Monitor incoming reports, active response units, and current city-wide status from one control surface."
          action={<span className={cn(pillBase, "border-white/10 bg-white/5 text-stone-200")}>Live sync 12s</span>}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { id: "all", label: "All reports", value: "0", detail: "Total recorded incidents" },
            { id: "pending", label: "Pending", value: "0", detail: "Cases waiting for dispatch" },
            { id: "active", label: "Active", value: "0", detail: "Currently responding teams" },
            { id: "completed", label: "Completed", value: "0", detail: "Successfully closed cases" },
          ].map((card) => (
            <article className={cn(innerCard, "p-6")} key={card.id}>
              <p className="font-display text-5xl font-extrabold tracking-[-0.04em] text-stone-50">{card.value}</p>
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.08em] text-stone-400">{card.label}</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">{card.detail}</p>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
