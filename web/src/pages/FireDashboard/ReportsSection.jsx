import { shellCard, innerCard, pillBase, SectionHeader, ReportsTable } from "./SharedUI.jsx";

export function ReportsSection() {
  return (
    <section id="reported-incidents" className={shellCard}>
      <div className="p-10">
        <SectionHeader
          title="Incident log"
          action={<span className={`${pillBase} border-slate-100 bg-slate-50 text-slate-500 capitalize font-black tracking-widest`}>Historical Archive</span>}
        />

        <div className="mb-10 flex flex-wrap gap-3">
          {["All Sector", "Fire Only", "Priority 1"].map((item, index) => (
            <span
              key={item}
              className={`${pillBase} px-6 py-2.5 ${
                index === 1
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20 shadow-sm"
                  : "bg-slate-50 border-slate-100 text-slate-500 font-black uppercase tracking-[0.2em] text-[8px]"
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-8">
            <ReportsTable detailed />
        </div>

        <div className="mt-10 p-8 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Showing page 01 of 01</p>
            <div className="flex gap-2">
                <button className="h-10 px-4 rounded-xl border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all">Previous</button>
                <button className="h-10 px-4 rounded-xl border border-slate-100 text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-50 border-slate-200">Next</button>
            </div>
        </div>


      </div>
    </section>
  );
}
