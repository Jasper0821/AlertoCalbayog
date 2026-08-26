const fs = require('fs');
const files = [
  'c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/ADMIN/Dashboard.jsx',
  'c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/AGENCY/PNP/Dashboard.jsx',
  'c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/AGENCY/CDRRMO/Dashboard.jsx'
];

for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('import { XCircle }')) {
    content = 'import { XCircle } from "lucide-react";\n' + content;
  }

  if (!content.includes('id: "rejected-incidents"')) {
    content = content.replace(/\{ id: "closed-incidents"[^\}]+\},/g, match => match + '\n  { id: "rejected-incidents", label: "Rejected Reports", icon: XCircle },');
  }

  content = content.replace(/if\s*\(\s*status\s*===\s*["']closed["']\s*\)\s*return\s*false;/g, 'if (status === "closed" || status === "rejected") return false;');

  if (!content.includes('const rejectedReports =')) {
    const closedBlockMatch = content.match(/const closedReports = useMemo\(\(\) => \{[\s\S]*?\}, \[reports, searchQuery(, agencyFilter)?\]\);/);
    if (closedBlockMatch) {
      const rejectedBlock = closedBlockMatch[0]
        .replace('closedReports', 'rejectedReports')
        .replace(/status !== ["']closed["']/g, 'status !== "rejected"');
      content = content.replace(closedBlockMatch[0], closedBlockMatch[0] + '\n\n  ' + rejectedBlock);
    }
  }

  content = content.replace(/const renderIncidents = \((showOnlyClosed = false|showOnlyClosed)\) => \{[\s\S]*?return \(/s, (match) => {
    return `const renderIncidents = (type = "active") => {
    let displayReports;
    let title;
    let description;
    
    if (type === "closed") {
      displayReports = closedReports;
      title = "Closed Incidents";
      description = "View history of officially closed emergency reports.";
    } else if (type === "rejected") {
      displayReports = rejectedReports;
      title = "Rejected Reports";
      description = "View history of rejected emergency reports.";
    } else {
      displayReports = filteredReports;
      title = "Incident Management";
      description = "Monitor every report, update status, assign responders, and export history.";
    }
    return (`;
  });
  
  content = content.replace(/\{showOnlyClosed \? ["']Closed Incidents["'] : ["']Incident Management["']\}/g, '{title}');
  content = content.replace(/\{showOnlyClosed\s*\?\s*["'][^"']+["']\s*:\s*["'][^"']+["']\s*\}/g, '{description}');

  content = content.replace(/if \(activeNav === ["']closed-incidents["']\) return renderIncidents\(true\);/g, 'if (activeNav === "closed-incidents") return renderIncidents("closed");\n    if (activeNav === "rejected-incidents") return renderIncidents("rejected");');

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}
