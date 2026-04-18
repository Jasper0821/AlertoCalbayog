
import { shellCard, innerCard, pillBase, SectionHeader, ReportsTable } from "./SharedUI.jsx";

export function ReportsSection() {
  return (
    <section id="reported-incidents" className={shellCard}>
      <div className="p-6">
        <SectionHeader
          eyebrow="Reported Incidents"
          title="Incident log and prioritization"
          description="Filter and review every incoming report before it moves through the dispatch queue."
          action={<span className={`${pillBase} border-white/10 bg-white/5 text-stone-200`}>All reports visible</span>}
        />

        <div className="mb-4 flex flex-wrap gap-2" aria-hidden="true">
          {["Fire Only"].map((item, index) => (
            <span
              key={item}
              className={`${pillBase} ${index === 0 ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-white/10 bg-white/5 text-stone-200"}`}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <article className={`${innerCard} p-4 w-full`}>
            <ReportsTable detailed />
          </article>
        </div>

      </div>
    </section>
  );
}
