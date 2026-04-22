export const shellCard = "bg-white border border-slate-100 rounded-[48px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.1)]";
export const innerCard = "rounded-[32px] border border-slate-100 bg-slate-50/50 transition-all hover:bg-white hover:border-slate-200 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1";
export const pillBase = "inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]";

export const statusChip = {
  neutral: "border-slate-100 bg-slate-50 text-slate-500",
  danger: "border-red-100 bg-red-50 text-red-600",
  success: "border-emerald-100 bg-emerald-50 text-emerald-600",
};

export const incidentChip = {
  fire: "border-red-100 bg-red-50 text-red-600",
};

export const iconTone = {
  yellow: "border-red-400/20 bg-red-400/10 text-red-300",
  danger: "border-red-500/20 bg-red-500/10 text-red-100",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
};

// Data placeholders for UI
export const liveSignals = [];
export const profileStats = [];
export const queueGroups = { ongoing: [], completed: [] };
export const recentReports = [];
export const summaryCards = [];

export const SectionHeader = ({ title, action }) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
      {title}
    </h2>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export function ReportsTable({ detailed = false }) {
  return (
    <div className="overflow-x-auto rounded-[32px] border border-slate-100 bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <th className="px-8 py-5">Incident</th>
            <th className="px-8 py-5">Location</th>
            {detailed && <th className="px-8 py-5">Status</th>}
            <th className="px-8 py-5 text-right">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {recentReports.map((report) => (
            <tr className="transition hover:bg-slate-50/50" key={report.id}>
              <td className="px-8 py-6">
                <span className="text-xs font-black text-slate-900 uppercase">{report.emergencyType || "Fire Alert"}</span>
              </td>
              <td className="px-8 py-6 text-xs font-bold text-slate-600 uppercase">{report.location || "Sector Alpha"}</td>
              {detailed && (
                <td className="px-8 py-6">
                  <span className={`${pillBase} ${report.status === "Open" ? statusChip.danger : statusChip.success}`}>
                    {report.status || "Open"}
                  </span>
                </td>
              )}
              <td className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase text-right">
                {report.createdAt ? new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
