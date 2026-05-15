import { shellCard, innerCard, pillBase, SectionHeader, ReportsTable } from "./SharedUI.jsx";

export function ReportsSection({ reports = [] }) {
  return (
    <section id="reported-incidents" className={shellCard}>
      <div className="p-10">
        <SectionHeader
          title="Incident log"
          action={<span className={`${pillBase} border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 capitalize font-black tracking-widest transition-colors`}>Historical Archive</span>}
        />

        <div className="mb-10 flex flex-wrap gap-3">
          {["All Sector", "Fire Only", "Priority 1"].map((item, index) => (
            <span
              key={item}
              className={`${pillBase} px-6 py-2.5 transition-all ${
                index === 1
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20 border-red-600"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] text-[8px]"
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-8">
            <ReportsTable detailed data={reports} />
        </div>

        <div className="mt-10 p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Showing {reports.length} Reports</p>
            <div className="flex gap-2">
                <button className="h-10 px-4 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Previous</button>
                <button className="h-10 px-4 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all">Next</button>
            </div>
        </div>
      </div>
    </section>
  );
}

