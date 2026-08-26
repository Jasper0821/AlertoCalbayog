const fs = require('fs');

const files = [
  'c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/AGENCY/CDRRMO/Dashboard.jsx',
  'c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/AGENCY/PNP/Dashboard.jsx'
];

const navObj = `
  {
    id: "rejected-incidents",
    label: "Rejected Reports",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
      </svg>
    ),
  },`;

for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('import RejectedReports from "./RejectedReports.jsx";')) {
    content = content.replace('import ClosedIncidents', 'import RejectedReports from "./RejectedReports.jsx";\nimport ClosedIncidents');
  }

  if (!content.includes('id: "rejected-incidents"')) {
    const closedNavIdx = content.indexOf('id: "closed-incidents"');
    if (closedNavIdx !== -1) {
      const endOfClosedNav = content.indexOf('  },', closedNavIdx);
      if (endOfClosedNav !== -1) {
        content = content.substring(0, endOfClosedNav + 4) + navObj + content.substring(endOfClosedNav + 4);
      }
    }
  }

  if (!content.includes('case "rejected-incidents":')) {
    content = content.replace(
      /case "closed-incidents": return <ClosedIncidents reports=\{filteredReports\} \/>;/g,
      'case "closed-incidents": return <ClosedIncidents reports={filteredReports} />;\n      case "rejected-incidents": return <RejectedReports reports={filteredReports} />;'
    );
  }

  content = content.replace(/const fixedHeightPages = \["incident-reports", "queuing", "incident-history", "closed-incidents"\];/g, 'const fixedHeightPages = ["incident-reports", "queuing", "incident-history", "closed-incidents", "rejected-incidents"];');

  fs.writeFileSync(file, content);
  console.log('Patched ' + file);
}
