const fs = require('fs');
const files = [
  'c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/ADMIN/Dashboard.jsx',
  'c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/AGENCY/PNP/Dashboard.jsx',
  'c:/Users/Jay Comendador/AlertoCalbayog/web/src/pages/AGENCY/CDRRMO/Dashboard.jsx'
];

const xCircleStr = `
const XCircle = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "h-5 w-5"}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);
`;

for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace('import { XCircle } from "lucide-react";\n', xCircleStr);
  fs.writeFileSync(file, content);
  console.log('Fixed ' + file);
}
