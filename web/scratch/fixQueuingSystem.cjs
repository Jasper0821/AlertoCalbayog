const fs = require('fs');

// Fix ADMIN Dashboard STATUS_STYLES
let adminDash = fs.readFileSync('c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/ADMIN/Dashboard.jsx', 'utf8');
if (!adminDash.includes('rejected: { dot: "bg-red-500"')) {
  adminDash = adminDash.replace(
    /closed: \{ dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", label: "Closed" \},/g,
    'closed: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", label: "Closed" },\n  rejected: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "Rejected" },'
  );
  fs.writeFileSync('c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/ADMIN/Dashboard.jsx', adminDash);
  console.log('Fixed ADMIN/Dashboard.jsx STATUS_STYLES');
}

// Fix incidentFormatters.js
let fmt = fs.readFileSync('c:/Users/Jay Comendador/AlertoCalbayog/web/src/utils/incidentFormatters.js', 'utf8');
if (!fmt.includes('rejected: "bg-red-100')) {
  fmt = fmt.replace(
    /resolved: "bg-emerald-100 text-emerald-700 border border-emerald-200",/g,
    'resolved: "bg-emerald-100 text-emerald-700 border border-emerald-200",\n  rejected: "bg-red-100 text-red-700 border border-red-200",'
  );
  fmt = fmt.replace(
    /resolved: \{ label: "Resolved", className: STATUS_STYLES_BASE.resolved \},/g,
    'resolved: { label: "Resolved", className: STATUS_STYLES_BASE.resolved },\n    rejected: { label: "Rejected", className: STATUS_STYLES_BASE.rejected },'
  );
  fmt = fmt.replace(
    /cancelled: STATUS_STYLES_BASE\.resolved,/g,
    'cancelled: STATUS_STYLES_BASE.resolved,\n  rejected: STATUS_STYLES_BASE.rejected,'
  );
  fs.writeFileSync('c:/Users/Jay Comendador/AlertoCalbayog/web/src/utils/incidentFormatters.js', fmt);
  console.log('Fixed incidentFormatters.js');
}

// Fix QueuingSystem filters
const qsFiles = [
  'c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/ADMIN/AdminQueuingSystem.jsx',
  'c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/AGENCY/PNP/QueuingSystem.jsx',
  'c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/AGENCY/CDRRMO/QueuingSystem.jsx'
];
for (let f of qsFiles) {
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('"rejected"')) {
    c = c.replace(/!\["resolved", "responded", "closed"\]\.includes/g, '!["resolved", "responded", "closed", "rejected"].includes');
    fs.writeFileSync(f, c);
    console.log('Fixed QueuingSystem filter in ' + f);
  }
}
