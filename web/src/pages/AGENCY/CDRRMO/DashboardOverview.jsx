import { useMemo, useState } from "react";
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TYPE_ICONS } from "../../../utils/incidentFormatters.js";
import IncidentDetailModal from "../PNP/IncidentDetailModal.jsx";
import ResolutionEvidenceModal from "../ResolutionEvidenceModal.jsx";

/* ─── Brand (CDRRMO Emerald) ─────────────────────────────────────────── */
const BRAND    = "#10b981";
const BRAND_D  = "#059669";
const BRAND_BG = "#ecfdf5";

/* ─── Build daily trend for THIS month ──────────────────────────── */
function buildDailyTrend(reports) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const days  = new Date(year, month + 1, 0).getDate();

  const data = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    label: `${i + 1}`,
    resolved: 0,
    pending: 0,
  }));

  reports.forEach(r => {
    if (!r.createdAt) return;
    const d = new Date(r.createdAt);
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    const idx = d.getDate() - 1;
    const isResolved = ["resolved","responded","closed"].includes((r.status || "").toLowerCase());
    if (isResolved) data[idx].resolved++;
    else data[idx].pending++;
  });
  return data;
}

/* ─── Build calendar incident map ───────────────────────────────── */
function buildCalendarMap(reports) {
  const map = {};
  reports.forEach(r => {
    if (!r.createdAt) return;
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map[key]) map[key] = { p: 0, a: 0, r: 0 };
    const s = (r.status || "").toLowerCase();
    if (["resolved","responded","closed"].includes(s)) map[key].r++;
    else if (["responding","ongoing","dispatching","en_route","active"].includes(s)) map[key].a++;
    else map[key].p++;
  });
  return map;
}

/* ─── Compact Calendar ──────────────────────────────────────────── */
function MiniCalendar({ reports }) {
  const [viewing, setViewing] = useState(() => new Date());
  const calMap = useMemo(() => buildCalendarMap(reports), [reports]);

  const year  = viewing.getFullYear();
  const month = viewing.getMonth();
  const monthName = new Intl.DateTimeFormat("en", { month: "long" }).format(viewing);
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Calendar</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setViewing(v => new Date(v.getFullYear(), v.getMonth()-1, 1))}
            style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#0f172a" }}>{monthName} {year}</span>
          <button onClick={() => setViewing(v => new Date(v.getFullYear(), v.getMonth()+1, 1))}
            style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 2 }}>
        {["S","M","T","W","T","F","S"].map((d,i) => (
          <div key={i} style={{ textAlign:"center", fontSize:9, fontWeight:700, color:"#94a3b8" }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", flex: 1, alignContent: "start", gap: 1 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i}/>;
          const key  = `${year}-${month}-${day}`;
          const data = calMap[key];
          const isToday = day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
          return (
            <div key={i} style={{ textAlign:"center", padding:"3px 1px", borderRadius:6, background:isToday?BRAND:"transparent" }}>
              <span style={{ fontSize:10, fontWeight:isToday?800:400, color:isToday?"#fff":"#374151" }}>{day}</span>
              {data&&(
                <div style={{ display:"flex", justifyContent:"center", gap:1.5, marginTop:1 }}>
                  {data.p>0&&<span style={{ width:4, height:4, borderRadius:"50%", background:"#f59e0b", display:"inline-block" }}/>}
                  {data.a>0&&<span style={{ width:4, height:4, borderRadius:"50%", background:"#6366f1", display:"inline-block" }}/>}
                  {data.r>0&&<span style={{ width:4, height:4, borderRadius:"50%", background:BRAND, display:"inline-block" }}/>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", gap:10, marginTop:8, flexWrap:"wrap" }}>
        {[["#f59e0b","Pending"],["#6366f1","Responding"],[BRAND,"Resolved"]].map(([dot,label])=>(
          <div key={label} style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, color:"#64748b", fontWeight:600 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:dot, display:"inline-block" }}/>{label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Chart tooltip ─────────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 12px", boxShadow:"0 4px 16px rgba(0,0,0,0.08)", fontSize:10 }}>
      <p style={{ color:"#64748b", fontWeight:700, margin:"0 0 3px" }}>Day {label}</p>
      {payload.map(p=><p key={p.name} style={{ color:p.color, fontWeight:800, margin:"1px 0" }}>● {p.name}: {p.value}</p>)}
    </div>
  );
}

/* ─── Table filter tabs ─────────────────────────────────────────── */
/* ─── Table filter tabs removed ────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════ */
export default function DashboardOverview({ reports = [], setActiveNav, onStatusChange }) {
  const safe = Array.isArray(reports) ? reports : [];
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolvingReportId, setResolvingReportId] = useState(null);
  const [tab, setTab] = useState("Today");

  /* KPIs */
  const total    = safe.length;
  const pending  = safe.filter(r=>["pending","verified"].includes((r.status||"").toLowerCase())).length;
  const active   = safe.filter(r=>["responding","ongoing","dispatching","en_route","active"].includes((r.status||"").toLowerCase())).length;
  const resolved = safe.filter(r=>["resolved","responded","closed"].includes((r.status||"").toLowerCase())).length;

  /* Chart */
  const chartData = useMemo(() => buildDailyTrend(safe), [safe]);

  /* Table rows */
  const tableRows = useMemo(() => {
    return [...safe].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,2);
  }, [safe]);

  /* Cards */
  const cards = [
    { label:"Total Reports",  value:total,   desc:"All citizen-reported incidents", iconBg:"#fef9ec", iconColor:"#b45309",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 10-8 0 4 4 0 008 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
    { label:"Units Deployed", value:active,  desc:"CDRRMO units currently responding", iconBg:BRAND_BG, iconColor:BRAND_D, highlight:true,
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
    { label:"Pending Cases",  value:pending, desc:"Awaiting dispatch or response",          iconBg:"#eff6ff", iconColor:"#1d4ed8",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg> },
    { label:"Resolved", valueA:resolved, labelA:"Closed", valueB:total-resolved, labelB:"Ongoing", iconBg:"#f0fdf4", iconColor:"#166534",
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  ];

  return (
    <div className="agency-dashboard" style={{
      width:"100%", height:"100%",
      display:"flex", flexDirection:"column",
      padding:"0px 16px 4px", gap:4,
      boxSizing:"border-box", overflow:"hidden",
      background:"#f8fafc", fontFamily:"inherit",
    }}>

      {/* KPI Cards */}
      <div className="agency-dashboard-kpis" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, flexShrink:0 }}>
        {cards.map((c,i)=>(
          <div key={i} style={{
            background: c.highlight ? BRAND_BG : "#fff",
            borderRadius:10, padding:"6px 10px",
            boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
            border: c.highlight ? `1px solid #a7f3d0` : "1px solid transparent",
            transition:"box-shadow .2s, transform .2s",
          }}
            onMouseEnter={e=>{ e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.09)"; e.currentTarget.style.transform="translateY(-1px)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform="translateY(0)"; }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <div style={{ width:24, height:24, borderRadius:6, background:c.iconBg, color:c.iconColor, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {c.icon}
              </div>
              <span style={{ fontSize:10, fontWeight:700, color:"#64748b" }}>{c.label}</span>
              <span style={{ marginLeft:"auto", fontSize:14, color:"#cbd5e1", cursor:"pointer" }}>···</span>
            </div>
            {c.valueA!==undefined ? (
              <div style={{ display:"flex", gap:12 }}>
                <div><div style={{ fontSize:18, fontWeight:800, color:"#0f172a" }}>{c.valueA}</div><div style={{ fontSize:9, color:"#94a3b8", fontWeight:600 }}>{c.labelA}</div></div>
                <div><div style={{ fontSize:18, fontWeight:800, color:"#0f172a" }}>{c.valueB}</div><div style={{ fontSize:9, color:"#94a3b8", fontWeight:600 }}>{c.labelB}</div></div>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:0 }}>
                <span style={{ fontSize:20, fontWeight:800, color:"#0f172a", lineHeight:1 }}>{String(c.value).padStart(2,"0")}</span>
              </div>
            )}
            <p style={{ fontSize:9, color:"#94a3b8", margin:0, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="agency-dashboard-charts" style={{ display:"grid", gridTemplateColumns:"1.55fr 1fr", gap:6, flex:1, minHeight:0 }}>

        {/* Case Overview chart — this month daily */}
        <div className="agency-dashboard-chart" style={{ background:"#fff", borderRadius:12, padding:"6px 10px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4, flexShrink:0 }}>
            <span style={{ fontSize:13, fontWeight:800, color:"#0f172a" }}>Incident Overview</span>
            <div style={{ display:"flex", gap:12 }}>
              {[[BRAND,"Resolved"],["#f59e0b","Pending"]].map(([c,l])=>(
                <span key={l} style={{ fontSize:9, fontWeight:700, color:c, display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:c, display:"inline-block" }}/>{l}
                </span>
              ))}
            </div>
            <span style={{ fontSize:9, color:"#94a3b8", fontWeight:600 }}>
              {new Intl.DateTimeFormat("en",{month:"long",year:"numeric"}).format(new Date())}
            </span>
          </div>
          <div style={{ flex:1, minHeight:0, position:"relative" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
              <LineChart data={chartData} margin={{ top:20, right:10, left:-26, bottom:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill:"#94a3b8", fontSize:8, fontWeight:600 }} interval={4}/>
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill:"#94a3b8", fontSize:8, fontWeight:600 }}/>
                <Tooltip content={<ChartTip/>}/>
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke={BRAND} strokeWidth={2} dot={false} activeDot={{ r:5 }} isAnimationActive animationDuration={800}/>
                <Line type="monotone" dataKey="pending"  name="Pending"  stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r:5 }} isAnimationActive animationDuration={800}/>
              </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="agency-dashboard-calendar" style={{ background:"#fff", borderRadius:12, padding:"6px 10px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <MiniCalendar reports={safe}/>
        </div>
      </div>

      {/* Incident Reports table */}
      <div className="agency-dashboard-reports" style={{ background:"#fff", borderRadius:12, boxShadow:"0 1px 4px rgba(0,0,0,0.05)", overflow:"hidden", flexShrink:0 }}>
        <div className="agency-dashboard-reports-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", borderBottom:"1px solid #f1f5f9" }}>
          <div>
            <span style={{ fontSize:13, fontWeight:800, color:"#0f172a" }}>Incident Reports</span>
            <span className="agency-dashboard-reports-summary" style={{ fontSize:9, color:"#94a3b8", marginLeft:8, fontWeight:500 }}>
              Live reports filed through AlertoCalbayog
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={()=>setActiveNav?.("incident-reports")}
              style={{ padding:"5px 12px", borderRadius:7, fontSize:10, fontWeight:700, background:BRAND_BG, color:BRAND_D, border:`1px solid #a7f3d0`, cursor:"pointer" }}>
              View All
            </button>
          </div>
        </div>

        <table className="agency-dashboard-reports-table" style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#f8fafc" }}>
              {["Reporter","Incident Type","Location","Contact No.","Action"].map(h=>(
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.length===0 ? (
              <tr><td colSpan={5} style={{ padding:"20px 0", textAlign:"center", fontSize:11, color:"#94a3b8" }}>No incidents for this period</td></tr>
            ) : tableRows.map((r,i)=>{
              const typeKey  = (r.emergencyType||"others").toLowerCase();
              const typeInfo = TYPE_ICONS[typeKey]||TYPE_ICONS.others;
              const reporter = r.userId?.fullName||r.name||"Anonymous";
              const phone    = r.userId?.phoneNumber||r.phoneNumber||"N/A";
              const loc      = typeof r.location==="string"?r.location:(r.location?.name||[r.location?.barangay,r.location?.street].filter(Boolean).join(", ")||"Unknown");
              return (
                <tr key={r._id||i} style={{ borderTop:"1px solid #f8fafc", transition:"background .12s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={TD}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:BRAND_BG, color:BRAND_D, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, flexShrink:0 }}>
                        {reporter.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:"#0f172a" }}>{reporter}</div>
                        <div style={{ fontSize:9, color:"#94a3b8" }}>Complainant</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...TD, fontWeight:600, color:"#374151" }}>{typeInfo.label}</td>
                  <td style={{ ...TD, color:"#64748b", maxWidth:130, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{loc}</td>
                  <td style={{ ...TD, color:"#64748b", fontFamily:"monospace", fontSize:10 }}>{phone}</td>
                  <td style={TD}>
                    <div style={{ display:"flex", gap:8 }}>
                      <button title="View Details" onClick={()=>setSelectedReport(r)}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b", padding:3, borderRadius:5 }}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
                        onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      <button title="Mark Resolved" onClick={()=>setResolvingReportId(r._id)}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"#10b981", padding:3, borderRadius:5 }}
                        onMouseEnter={e=>e.currentTarget.style.background="#ecfdf5"}
                        onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <IncidentDetailModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}

      {resolvingReportId && (
        <ResolutionEvidenceModal
          onClose={() => setResolvingReportId(null)}
          onSubmit={async (images) => {
            await onStatusChange?.(resolvingReportId, "resolved", images);
            setResolvingReportId(null);
          }}
        />
      )}
    </div>
  );
}

const TH = { padding:"4px 10px", textAlign:"left", fontSize:8, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" };
const TD = { padding:"5px 10px", fontSize:11, verticalAlign:"middle" };
