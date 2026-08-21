const fs = require('fs');

function createRejectedReports(agency) {
  const sourceFile = `c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/AGENCY/${agency}/IncidentHistory.jsx`;
  const destFile = `c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/AGENCY/${agency}/RejectedReports.jsx`;

  let content = fs.readFileSync(sourceFile, 'utf8');

  // Replace component name
  content = content.replace(/export default function IncidentHistory/g, 'export default function RejectedReports');

  // Replace filter logic
  content = content.replace(
    /const resolved = reports\.filter\(r => \["resolved", "closed", "cancelled", "responded"\]\.includes\(\(r\.status \|\| ""\)\.toLowerCase\(\)\)\);/g,
    'const resolved = reports.filter(r => (r.status || "").toLowerCase() === "rejected");'
  );

  // Replace PDF title
  content = content.replace(/Incident History Report/g, 'Rejected Reports');
  content = content.replace(/"Incident History"/g, '"Rejected Reports"');
  content = content.replace(/>Incident History</g, '>Rejected Reports<');
  content = content.replace(/Download History/g, 'Download Rejected Reports');

  fs.writeFileSync(destFile, content);
  console.log(`Created RejectedReports.jsx for ${agency}`);
}

createRejectedReports('CDRRMO');
createRejectedReports('PNP');
