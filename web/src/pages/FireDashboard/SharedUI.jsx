import { cn } from "../../lib/cn.js";

export const shellCard = "overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/80 shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl";
export const innerCard = "rounded-[24px] border border-white/10 bg-white/5";
export const pillBase = "inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]";

export const statusChip = {
  neutral: "border-white/10 bg-white/5 text-stone-200",
  danger: "border-red-500/20 bg-red-500/10 text-red-100",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
};

export const incidentChip = {
  fire: "border-red-500/20 bg-red-500/10 text-red-100",
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

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-400">{eyebrow}</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-stone-50 sm:text-[1.9rem]">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ReportsTable({ detailed = false }) {
  return (
    <div className="overflow-x-auto rounded-[20px] border border-white/10 bg-white/5">
      <table className="min-w-[640px] w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-[0.12em] text-stone-400">
            <th className="px-6 py-4">Incident</th>
            <th className="px-6 py-4">Location</th>
            {detailed ? <th className="px-6 py-4">Priority</th> : null}
            {detailed ? <th className="px-6 py-4">Unit</th> : null}
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Time</th>
          </tr>
        </thead>
        <tbody>
          {recentReports.map((report) => (
            <tr className="border-b border-white/5 transition hover:bg-white/5" key={report.id}>
              <td className="px-6 py-5">
                <div className="grid gap-1">
                  <span className={cn(pillBase, incidentChip[report.type.toLowerCase()])}>{report.type}</span>
                  <span className="text-xs text-stone-400">{report.id}</span>
                </div>
              </td>
              <td className="px-6 py-5 text-sm text-stone-200">{report.location}</td>
              {detailed ? (
                <td className="px-6 py-5">
                  <span className={cn(pillBase, statusChip.neutral)}>{report.priority}</span>
                </td>
              ) : null}
              {detailed ? <td className="px-6 py-5 text-sm text-stone-200">{report.unit}</td> : null}
              <td className="px-6 py-5">
                <span className={cn(pillBase, report.status === "Ongoing" ? statusChip.danger : statusChip.success)}>
                  {report.status}
                </span>
              </td>
              <td className="px-6 py-5 text-sm text-stone-200">{report.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
