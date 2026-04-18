
import { shellCard, innerCard, pillBase, SectionHeader, profileStats } from "./SharedUI.jsx";

export function ProfileSection() {
  return (
    <section id="profile" className={shellCard}>
      <div className="p-6">
        <SectionHeader
          eyebrow="Profile"
          title="Account and shift details"
          description="Keep the responder profile visible so the whole team knows who is on duty and what network they manage."
          action={<span className={`${pillBase} border-white/10 bg-white/5 text-stone-200`}>Operations Lead</span>}
        />

        <div className="flex justify-center">
          <article className="rounded-[24px] border border-white/10 bg-white/5 p-5 w-full max-w-2xl">
            <div className="flex items-center gap-4">
              <div className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[24px] bg-gradient-to-b from-red-200 to-red-400 text-2xl font-extrabold tracking-[-0.06em] text-stone-950 shadow-[0_20px_32px_rgba(239,68,68,0.16)]">
                AC
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-400">Admin / Responder</p>
                <h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-stone-50">
                  Operations Lead
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">
                  Monitoring all emergency channels, dispatching units, and keeping city-wide alerts in sync.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {profileStats.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3">
                  <span className="block text-xs font-bold uppercase tracking-[0.08em] text-stone-400">{item.label}</span>
                  <strong className="mt-2 block text-sm text-stone-100">{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

        </div>
      </div>
    </section>
  );
}
