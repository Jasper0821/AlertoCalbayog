import { shellCard, innerCard, pillBase, SectionHeader, statusChip } from "./SharedUI.jsx";

export function OverviewSection() {
  return (
    <section id="dashboard" className={shellCard}>
      <div className="p-10">
        <SectionHeader
          title="Command overview"
          action={<span className={`${pillBase} ${statusChip.neutral}`}>Live sync active</span>}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { id: "incidents", label: "Total Reports", value: "0", detail: "Active incidents in city grid" },
            { id: "active", label: "Active Operations", value: "0", detail: "Ongoing fire response units" },
            { id: "completed", label: "Closed Cases", value: "0", detail: "Successfully resolved reports" },
            { id: "units", label: "Deployable Units", value: "0", detail: "Available responder teams" },
          ].map((card) => (
            <article className={`${innerCard} p-8`} key={card.id}>
              <p className="font-display text-5xl font-black tracking-[-0.07em] text-slate-900">{card.value}</p>
              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{card.label}</p>
              <p className="mt-2 text-xs font-bold text-slate-600 leading-relaxed">{card.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className={`${innerCard} p-8`}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-6">Recent Alerts</h3>
                <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-500 py-10 text-center border-2 border-dashed border-slate-100 rounded-[32px]">No immediate alerts in grid</p>
                </div>
            </article>
            <article className={`${innerCard} p-8`}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-6">Sector Status</h3>
                <div className="grid grid-cols-2 gap-4">
                    {['North', 'South', 'East', 'West'].map(sector => (
                        <div key={sector} className="p-4 bg-white rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{sector}</p>
                            <p className="mt-1 text-sm font-black text-slate-900">SEC-00{sector[0]}</p>
                        </div>
                    ))}
                </div>
            </article>
        </div>
      </div>
    </section>
  );
}
