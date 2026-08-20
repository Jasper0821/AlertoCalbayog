import ClosedIncidentsPage from "../PNP/ClosedIncidents.jsx";

export default function ClosedIncidents({ reports = [] }) {
  return <ClosedIncidentsPage reports={reports} agencyName="CDRRMO" />;
}
