/**
 * Rule-based report generator for the analytics pages.
 *
 * Turns the raw incident list into a structured report (metrics, tables, findings and
 * recommendations) for a chosen period, compared against the period just before it.
 * Everything is computed in the browser from data the page already has — no AI and no
 * extra API calls — so the same inputs always produce the same report.
 */
import { cleanBarangay, getIncidentId, normalizeIncidentStatus } from "./incidentFormatters.js";
import { getValidCalbayogBarangay } from "./barangays.js";

const DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const REPORT_TYPES = [
  { id: "executive", label: "Executive Summary", description: "Overall volume, key findings and recommended actions." },
  { id: "hotspots", label: "Barangay Hotspots", description: "Where incidents concentrate and which areas are rising." },
  { id: "response", label: "Response Performance", description: "Response times, resolution rate and open backlog." },
  { id: "patterns", label: "Time Patterns", description: "Busiest days and hours to guide staffing." },
];

export const REPORT_PERIODS = [
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "thisMonth", label: "This month" },
  { id: "lastMonth", label: "Last month" },
  { id: "last90", label: "Last 90 days" },
  { id: "thisYear", label: "This year" },
  { id: "all", label: "All time" },
];

const TYPE_LABELS = {
  fire: "Fire",
  flood: "Flood",
  crime: "Crime",
  medical: "Medical",
  accident: "Accident",
  emergency: "Others",
  others: "Others",
};

// Wording that makes recommendations fit the agency reading the report.
const AGENCY_ACTIONS = {
  admin: { unit: "responding agencies", patrol: "coordinate agency deployment", prevent: "run a joint awareness campaign" },
  CDRRMO: { unit: "CDRRMO teams", patrol: "pre-position rescue teams", prevent: "hold a preparedness and evacuation drill" },
  PNP: { unit: "PNP units", patrol: "increase police visibility and patrols", prevent: "run a crime-prevention briefing with barangay officials" },
  BFP: { unit: "BFP units", patrol: "pre-position a fire truck or standby crew", prevent: "conduct fire-safety inspections" },
};

/* ── Small helpers ─────────────────────────────────────── */

export function getFirstResponseDate(report) {
  const entries = Array.isArray(report?.actionLog) ? report.actionLog : [];
  const responseEntry = entries
    .filter((entry) => {
      const toStatus = (entry.toStatus || "").toLowerCase();
      return entry.action === "responder_assignment" || ["verified", "responding", "active", "resolved", "responded"].includes(toStatus);
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

  return responseEntry?.createdAt ? new Date(responseEntry.createdAt) : null;
}

export function formatMinutes(minutes) {
  if (!Number.isFinite(minutes)) return "Not available";
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 60 * 48) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }
  return `${Math.round(minutes / 60 / 24)} days`;
}

function reportDate(report) {
  const d = new Date(report?.createdAt || report?.date || "");
  return Number.isNaN(d.getTime()) ? null : d;
}

function typeLabel(report) {
  const raw = (report?.emergencyType || report?.incidentType || report?.type || "others").toLowerCase();
  return TYPE_LABELS[raw] || raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** The barangay only — never a full street address — so areas group correctly. */
function barangayOf(report) {
  const loc = report?.location;
  const direct = cleanBarangay(typeof loc === "object" ? loc?.barangay : "");
  if (direct && !["unknown", "unspecified", "district"].includes(direct.toLowerCase())) return direct;
  const text = typeof loc === "string" ? loc : loc?.name || loc?.street || "";
  return getValidCalbayogBarangay(text) || "Unspecified";
}

function responseMinutes(report) {
  const created = reportDate(report);
  const responded = getFirstResponseDate(report);
  if (!created || !responded || Number.isNaN(responded.getTime())) return null;
  const minutes = (responded - created) / 60000;
  return minutes >= 0 ? minutes : null;
}

function countBy(items, keyFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

function sortedEntries(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function pct(part, whole) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

function average(values) {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** "+40%", "-12%", "new" or "no change" — comparing this period with the previous one. */
function changeLabel(current, previous) {
  if (!previous) return current ? "new" : "—";
  const diff = Math.round(((current - previous) / previous) * 100);
  if (diff === 0) return "no change";
  return `${diff > 0 ? "+" : ""}${diff}%`;
}

function formatDate(d) {
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function hourBlockLabel(startHour) {
  const fmt = (h) => {
    const hour = h % 24;
    const suffix = hour < 12 ? "AM" : "PM";
    return `${hour % 12 === 0 ? 12 : hour % 12} ${suffix}`;
  };
  return `${fmt(startHour)} – ${fmt(startHour + 3)}`;
}

/* ── Periods ───────────────────────────────────────────── */

export function resolvePeriod(periodId, now = new Date()) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfToday = new Date(startOfDay(now).getTime() + DAY);
  const label = REPORT_PERIODS.find((p) => p.id === periodId)?.label || "All time";

  const rolling = (days) => {
    const start = new Date(endOfToday.getTime() - days * DAY);
    return { start, end: endOfToday, prevStart: new Date(start.getTime() - days * DAY), prevEnd: start };
  };

  let range;
  switch (periodId) {
    case "last7": range = rolling(7); break;
    case "last30": range = rolling(30); break;
    case "last90": range = rolling(90); break;
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      // Compare like with like: the same number of elapsed days last month.
      const prevEnd = new Date(Math.min(prevStart.getTime() + (endOfToday - start), start.getTime()));
      range = { start, end: endOfToday, prevStart, prevEnd };
      break;
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      range = { start, end, prevStart: new Date(now.getFullYear(), now.getMonth() - 2, 1), prevEnd: start };
      break;
    }
    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      const prevStart = new Date(now.getFullYear() - 1, 0, 1);
      range = { start, end: endOfToday, prevStart, prevEnd: new Date(prevStart.getTime() + (endOfToday - start)) };
      break;
    }
    default:
      range = { start: null, end: null, prevStart: null, prevEnd: null };
  }

  const rangeText = range.start
    ? `${formatDate(range.start)} – ${formatDate(new Date(range.end.getTime() - 1))}`
    : "All recorded incidents";
  return { ...range, id: periodId, label, rangeText, comparable: Boolean(range.start) };
}

function inRange(report, start, end) {
  if (!start) return true;
  const d = reportDate(report);
  return Boolean(d) && d >= start && d < end;
}

/* ── Statistics shared by every report type ─────────────── */

function summarize(reports, now) {
  const statuses = reports.map((r) => normalizeIncidentStatus(r.status));
  const rejected = statuses.filter((s) => s === "rejected").length;
  const valid = reports.filter((_, i) => statuses[i] !== "rejected");
  const validStatuses = statuses.filter((s) => s !== "rejected");
  const resolved = validStatuses.filter((s) => s === "resolved").length;
  const open = valid.filter((_, i) => validStatuses[i] !== "resolved");
  const responses = valid.map(responseMinutes).filter((m) => m !== null);
  const openAges = open.map((r) => {
    const d = reportDate(r);
    return d ? (now - d) / 60000 : null;
  });

  return {
    total: reports.length,
    valid,
    rejected,
    resolved,
    open,
    openAges,
    resolutionRate: pct(resolved, valid.length),
    avgResponse: average(responses),
    medianResponse: median(responses),
    responsesCounted: responses.length,
    within15: responses.filter((m) => m <= 15).length,
    byType: countBy(valid, typeLabel),
    byBarangay: countBy(valid, barangayOf),
    staleOpen: openAges.filter((m) => m !== null && m > 24 * 60).length,
  };
}

/* ── Findings & recommendations ────────────────────────── */

function volumeFinding(cur, prev, period) {
  if (!period.comparable) return `${plural(cur.total, "incident")} recorded in total.`;
  if (!prev.total) return `${plural(cur.total, "incident")} reported, with none in the previous period to compare against.`;
  const diff = cur.total - prev.total;
  if (diff === 0) return `Incident volume held steady at ${cur.total}, the same as the previous period.`;
  const dir = diff > 0 ? "rose" : "fell";
  return `Incident volume ${dir} ${Math.abs(Math.round((diff / prev.total) * 100))}% (${prev.total} → ${cur.total}) compared with the previous period.`;
}

function risingTypes(cur, prev) {
  return sortedEntries(cur.byType)
    .map(([type, count]) => ({ type, count, prev: prev.byType.get(type) || 0 }))
    .filter((t) => t.count >= 3 && t.count > t.prev && (t.prev === 0 || (t.count - t.prev) / t.prev >= 0.25));
}

/** The single busiest bucket, or null when there is a tie (no clear peak to report). */
function clearPeak(map) {
  const [top, second] = sortedEntries(map);
  return top && (!second || top[1] > second[1]) ? top : null;
}

/** Top barangay worth naming: a clear leader with more than a one-off incident. */
function hotspotLeader(named) {
  const [top, second] = named;
  return top && top[1] >= 2 && (!second || top[1] > second[1]) ? top : null;
}

function peakHourBlock(reports) {
  const top = clearPeak(countBy(reports.map(reportDate).filter(Boolean), (d) => Math.floor(d.getHours() / 3) * 3));
  return top ? { start: Number(top[0]), count: top[1] } : null;
}

function peakWeekday(reports) {
  const top = clearPeak(countBy(reports.map(reportDate).filter(Boolean), (d) => d.getDay()));
  return top ? { day: WEEKDAYS[top[0]], count: top[1] } : null;
}

// Which topics each report type talks about. The executive summary covers everything;
// the focused reports only keep findings and actions relevant to their subject.
const REPORT_TOPICS = {
  executive: ["volume", "type", "location", "response", "time", "quality"],
  hotspots: ["volume", "location", "quality"],
  response: ["volume", "response"],
  patterns: ["volume", "time"],
};

function buildFindings(cur, prev, period, valid) {
  const findings = [{ topic: "volume", text: volumeFinding(cur, prev, period) }];
  const add = (topic, text) => findings.push({ topic, text });

  const [topType] = sortedEntries(cur.byType);
  if (topType && cur.valid.length) {
    add("type", `${topType[0]} incidents were the most common, at ${pct(topType[1], cur.valid.length)}% of valid reports (${topType[1]} of ${cur.valid.length}).`);
  }
  if (period.comparable) {
    risingTypes(cur, prev).slice(0, 2).forEach((t) => {
      add("type", t.prev
        ? `${t.type} incidents are rising: ${t.prev} → ${t.count} (${changeLabel(t.count, t.prev)}).`
        : `${t.type} incidents appeared this period (${t.count}) after none in the previous period.`);
    });
  }

  // Location
  const named = sortedEntries(cur.byBarangay).filter(([name]) => name !== "Unspecified");
  const leader = hotspotLeader(named);
  if (leader) {
    const [name, count] = leader;
    const repeat = period.comparable && sortedEntries(prev.byBarangay).filter(([n]) => n !== "Unspecified")[0]?.[0] === name;
    const [mainType] = sortedEntries(countBy(valid.filter((r) => barangayOf(r) === name), typeLabel));
    add("location", `Brgy. ${name} had the most incidents (${count}, ${pct(count, cur.valid.length)}% of the total), mostly ${mainType[0].toLowerCase()}${repeat ? ", and was also the top area in the previous period" : ""}.`);
  } else if (named.length > 1) {
    add("location", "No single barangay stands out — incidents are spread evenly across the areas below.");
  }
  if (named.length > 3) {
    add("location", `Incidents came from ${plural(named.length, "barangay")}; the top three account for ${pct(named.slice(0, 3).reduce((s, [, c]) => s + c, 0), cur.valid.length)}% of them.`);
  }
  const unspecified = cur.byBarangay.get("Unspecified") || 0;
  if (pct(unspecified, cur.valid.length) >= 20) {
    add("location", `${pct(unspecified, cur.valid.length)}% of incidents (${unspecified}) have no barangay recorded, so hotspot figures may understate some areas.`);
  }

  // Response
  if (cur.valid.length) {
    add("response", `${cur.resolutionRate}% of valid incidents are resolved; ${plural(cur.open.length, "incident")} remain open${cur.staleOpen ? `, ${cur.staleOpen} of them for more than 24 hours` : ""}.`);
  }
  if (cur.avgResponse !== null) {
    let line = `Average time to first response was ${formatMinutes(cur.avgResponse)} (median ${formatMinutes(cur.medianResponse)})`;
    if (period.comparable && prev.avgResponse !== null) {
      line += `, ${cur.avgResponse < prev.avgResponse ? "faster" : "slower"} than ${formatMinutes(prev.avgResponse)} in the previous period`;
    }
    add("response", `${line}.`);
    add("response", `${pct(cur.within15, cur.responsesCounted)}% of responses happened within 15 minutes of the report.`);
  }
  const unanswered = cur.valid.length - cur.responsesCounted;
  if (cur.valid.length && pct(unanswered, cur.valid.length) >= 20) {
    add("response", `${plural(unanswered, "incident")} have no recorded response yet.`);
  }

  // Time
  const peak = peakHourBlock(valid);
  if (peak && valid.length >= 5) {
    add("time", `Reports peak between ${hourBlockLabel(peak.start)} (${pct(peak.count, valid.length)}% of incidents).`);
  }
  const day = peakWeekday(valid);
  if (day && valid.length >= 7) {
    add("time", `${day.day} is the busiest day of the week (${pct(day.count, valid.length)}% of incidents).`);
  }
  const dated = valid.map(reportDate).filter(Boolean);
  if (dated.length >= 5) {
    const night = dated.filter((d) => d.getHours() >= 18 || d.getHours() < 6).length;
    add("time", `${pct(night, dated.length)}% of incidents were reported at night (6 PM – 6 AM).`);
  }

  // Report quality
  const rejectedShare = pct(cur.rejected, cur.total);
  if (cur.rejected && rejectedShare >= 15) {
    add("quality", `${rejectedShare}% of reports (${cur.rejected}) were rejected as invalid or duplicate.`);
  }

  return findings;
}

function buildRecommendations(cur, prev, period, valid, scope) {
  const act = AGENCY_ACTIONS[scope] || AGENCY_ACTIONS.admin;
  const recs = [];
  const add = (topic, text) => recs.push({ topic, text });

  if (!cur.valid.length) {
    return [{ topic: "volume", text: "No valid incidents in this period — keep monitoring and re-run the report once new reports arrive." }];
  }

  const named = sortedEntries(cur.byBarangay).filter(([name]) => name !== "Unspecified");
  if (hotspotLeader(named) && pct(named[0][1], cur.valid.length) >= 20) {
    // Name a second barangay only when it is a real hotspot too, not a one-off.
    const focus = named.slice(0, 2).filter(([, count], i) => i === 0 || (count >= 2 && pct(count, cur.valid.length) >= 15)).map(([n]) => `Brgy. ${n}`);
    add("location", `Focus on ${focus.join(" and ")}: ${act.patrol} and ${act.prevent} there.`);
  }
  if (period.comparable) {
    const emerging = named.filter(([name, count]) => count >= 2 && !prev.byBarangay.get(name)).map(([n]) => `Brgy. ${n}`);
    if (emerging.length) add("location", `Watch ${emerging.slice(0, 3).join(", ")}, which had no incidents in the previous period.`);
  }
  if (pct(cur.byBarangay.get("Unspecified") || 0, cur.valid.length) >= 20) {
    add("location", "Ask responders to confirm the barangay when handling an incident so hotspot reports stay accurate.");
  }

  if (cur.staleOpen) {
    add("response", `Review the ${plural(cur.staleOpen, "incident")} open for more than 24 hours and either close them or escalate.`);
  }
  if (cur.avgResponse !== null && cur.avgResponse > 15) {
    add("response", `Average first response is ${formatMinutes(cur.avgResponse)}. Aim for under 15 minutes by acknowledging new reports as soon as they arrive.`);
  }
  if (cur.avgResponse !== null && period.comparable && prev.avgResponse !== null && cur.avgResponse > prev.avgResponse * 1.25) {
    add("response", `Response times slowed compared with the previous period — check whether ${act.unit} were understaffed or tied up on long incidents.`);
  }

  if (period.comparable) {
    const [rising] = risingTypes(cur, prev);
    if (rising) add("type", `Prepare for more ${rising.type.toLowerCase()} incidents: brief ${act.unit} on the trend and check equipment readiness.`);
  }

  const peak = peakHourBlock(valid);
  if (peak && valid.length >= 5 && pct(peak.count, valid.length) >= 25) {
    add("time", `Make sure ${act.unit} are fully staffed between ${hourBlockLabel(peak.start)}, when most reports come in.`);
  }
  const day = peakWeekday(valid);
  if (day && valid.length >= 7 && pct(day.count, valid.length) >= 25) {
    add("time", `Avoid scheduling leave or training on ${day.day}s, the busiest day of the week.`);
  }

  if (pct(cur.rejected, cur.total) >= 15) {
    add("quality", "Many reports were rejected — remind residents through barangay channels how to report emergencies correctly.");
  }

  return recs;
}

/* ── Report sections per type ──────────────────────────── */

function typeTable(cur, prev, period) {
  return {
    columns: period.comparable ? ["Incident type", "Count", "Share", "vs previous"] : ["Incident type", "Count", "Share"],
    rows: sortedEntries(cur.byType).map(([type, count]) => {
      const row = [type, String(count), `${pct(count, cur.valid.length)}%`];
      if (period.comparable) row.push(changeLabel(count, prev.byType.get(type) || 0));
      return row;
    }),
  };
}

function barangayTable(cur, prev, period, valid, limit) {
  const mainType = (name) => {
    const [top] = sortedEntries(countBy(valid.filter((r) => barangayOf(r) === name), typeLabel));
    return top ? top[0] : "—";
  };
  return {
    columns: period.comparable ? ["Barangay", "Incidents", "Share", "Main type", "vs previous"] : ["Barangay", "Incidents", "Share", "Main type"],
    rows: sortedEntries(cur.byBarangay).slice(0, limit).map(([name, count]) => {
      const row = [name, String(count), `${pct(count, cur.valid.length)}%`, mainType(name)];
      if (period.comparable) row.push(changeLabel(count, prev.byBarangay.get(name) || 0));
      return row;
    }),
  };
}

function executiveSections(cur, prev, period, valid) {
  return [
    { heading: "Incidents by type", table: typeTable(cur, prev, period) },
    { heading: "Top barangays", table: barangayTable(cur, prev, period, valid, 5) },
  ];
}

function hotspotSections(cur, prev, period, valid) {
  const named = sortedEntries(cur.byBarangay).filter(([name]) => name !== "Unspecified");
  const sections = [{ heading: "Barangay ranking", table: barangayTable(cur, prev, period, valid, 10) }];

  if (period.comparable) {
    const emerging = named.filter(([name, count]) => count >= 2 && !(prev.byBarangay.get(name)));
    if (emerging.length) {
      sections.push({
        heading: "Emerging hotspots",
        bullets: emerging.slice(0, 5).map(([name, count]) => `Brgy. ${name}: ${count} incidents this period, none in the previous period.`),
      });
    }
  }
  return sections;
}

function responseSections(cur, _prev, _period, valid, now) {
  const types = sortedEntries(cur.byType).map(([type]) => {
    const ofType = valid.filter((r) => typeLabel(r) === type);
    const times = ofType.map(responseMinutes).filter((m) => m !== null);
    const resolved = ofType.filter((r) => normalizeIncidentStatus(r.status) === "resolved").length;
    return [type, String(ofType.length), formatMinutes(average(times)), `${pct(resolved, ofType.length)}%`];
  });

  const oldestOpen = cur.open
    .map((r) => ({ r, d: reportDate(r) }))
    .filter((x) => x.d)
    .sort((a, b) => a.d - b.d)
    .slice(0, 5)
    .map(({ r, d }, i) => [getIncidentId(r, i), typeLabel(r), barangayOf(r), formatMinutes((now - d) / 60000)]);

  const sections = [
    { heading: "Performance by incident type", table: { columns: ["Incident type", "Incidents", "Avg. response", "Resolved"], rows: types } },
  ];
  sections.push(oldestOpen.length
    ? { heading: "Longest-open incidents", table: { columns: ["Incident ID", "Type", "Barangay", "Open for"], rows: oldestOpen } }
    : { heading: "Open backlog", paragraphs: ["There are no open incidents in this period."] });
  return sections;
}

function patternSections(_cur, _prev, _period, valid) {
  const dated = valid.map(reportDate).filter(Boolean);
  const byDay = countBy(dated, (d) => d.getDay());
  const byBlock = countBy(dated, (d) => Math.floor(d.getHours() / 3) * 3);
  const byDate = sortedEntries(countBy(dated, (d) => formatDate(d)));
  const peakDay = peakWeekday(valid);

  const sections = [];
  if (byDate[0] && byDate[0][1] >= 2) {
    sections.push({
      heading: "Busiest periods",
      paragraphs: [
        `The busiest single day was ${byDate[0][0]} with ${plural(byDate[0][1], "incident")}.${peakDay ? ` Across the period, ${peakDay.day} is the busiest day of the week.` : ""}`,
      ],
    });
  }
  sections.push({
    heading: "By day of week",
    table: {
      columns: ["Day", "Incidents", "Share"],
      rows: WEEKDAYS.map((day, i) => [day, String(byDay.get(i) || 0), `${pct(byDay.get(i) || 0, dated.length)}%`]),
    },
  });
  sections.push({
    heading: "By time of day",
    table: {
      columns: ["Time window", "Incidents", "Share"],
      rows: [0, 3, 6, 9, 12, 15, 18, 21].map((h) => [hourBlockLabel(h), String(byBlock.get(h) || 0), `${pct(byBlock.get(h) || 0, dated.length)}%`]),
    },
  });
  return sections;
}

const SECTION_BUILDERS = {
  executive: executiveSections,
  hotspots: hotspotSections,
  response: responseSections,
  patterns: patternSections,
};

/* ── Public entry point ────────────────────────────────── */

/**
 * @param {object} options
 * @param {Array}  options.reports    Incidents visible to this page.
 * @param {string} options.type       One of REPORT_TYPES ids.
 * @param {string} options.periodId   One of REPORT_PERIODS ids.
 * @param {string} options.scope      "admin" | "CDRRMO" | "PNP" | "BFP" — tailors the wording.
 * @param {string} options.scopeLabel Shown in the report heading, e.g. "Citywide".
 */
export function generateReport({ reports = [], type = "executive", periodId = "last30", scope = "admin", scopeLabel = "Citywide", now = new Date() }) {
  const safe = Array.isArray(reports) ? reports : [];
  const period = resolvePeriod(periodId, now);
  const current = safe.filter((r) => inRange(r, period.start, period.end));
  const previous = period.comparable ? safe.filter((r) => inRange(r, period.prevStart, period.prevEnd)) : [];

  const cur = summarize(current, now);
  const prev = summarize(previous, now);
  const meta = REPORT_TYPES.find((t) => t.id === type) || REPORT_TYPES[0];
  const topics = REPORT_TOPICS[meta.id];
  const relevant = (items) => items.filter((item) => topics.includes(item.topic)).map((item) => item.text);
  const findings = cur.total ? relevant(buildFindings(cur, prev, period, cur.valid)) : [];
  const recommendations = relevant(buildRecommendations(cur, prev, period, cur.valid, scope));

  const metrics = [
    { label: "Total reports", value: String(cur.total), hint: !period.comparable ? "All time" : prev.total ? `${changeLabel(cur.total, prev.total)} vs previous` : "None in previous period" },
    { label: "Resolved", value: `${cur.resolutionRate}%`, hint: `${cur.resolved} of ${cur.valid.length} valid` },
    { label: "Open", value: String(cur.open.length), hint: cur.staleOpen ? `${cur.staleOpen} over 24h` : "None over 24h" },
    { label: "Avg. response", value: formatMinutes(cur.avgResponse), hint: cur.medianResponse !== null ? `Median ${formatMinutes(cur.medianResponse)}` : "No response data" },
  ];

  return {
    title: `${meta.label} Report`,
    scopeLabel,
    periodLabel: period.label,
    rangeText: period.rangeText,
    generatedAt: now,
    empty: cur.total === 0,
    metrics,
    findings: findings.length ? findings : [`No incidents were reported in this period (${period.label.toLowerCase()}).`],
    sections: cur.valid.length ? SECTION_BUILDERS[meta.id](cur, prev, period, cur.valid, now) : [],
    recommendations: recommendations.length
      ? recommendations
      : ["No urgent issues detected for this report. Maintain current operations and continue routine monitoring."],
  };
}

/* ── Export helpers ────────────────────────────────────── */

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Plain-text version for copying into an email or chat. */
export function reportToText(report) {
  const lines = [
    `ALERTO CALBAYOG — ${report.title.toUpperCase()}`,
    `${report.scopeLabel} · ${report.periodLabel} (${report.rangeText})`,
    `Generated ${report.generatedAt.toLocaleString("en-PH")}`,
    "",
    ...report.metrics.map((m) => `${m.label}: ${m.value} (${m.hint})`),
    "",
    "KEY FINDINGS",
    ...report.findings.map((f) => `• ${f}`),
  ];
  report.sections.forEach((s) => {
    lines.push("", s.heading.toUpperCase());
    (s.paragraphs || []).forEach((p) => lines.push(p));
    (s.bullets || []).forEach((b) => lines.push(`• ${b}`));
    if (s.table) {
      lines.push(s.table.columns.join(" | "));
      s.table.rows.forEach((r) => lines.push(r.join(" | ")));
    }
  });
  lines.push("", "RECOMMENDATIONS", ...report.recommendations.map((r, i) => `${i + 1}. ${r}`));
  return lines.join("\n");
}

/** Opens the report in a print window (Save as PDF), matching the other exports. */
export function printReport(report) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups for this site to download the PDF report.");
    return;
  }

  const e = escapeHtml;
  const sectionHtml = report.sections.map((s) => `
    <h2>${e(s.heading)}</h2>
    ${(s.paragraphs || []).map((p) => `<p>${e(p)}</p>`).join("")}
    ${s.bullets?.length ? `<ul>${s.bullets.map((b) => `<li>${e(b)}</li>`).join("")}</ul>` : ""}
    ${s.table ? `<table><thead><tr>${s.table.columns.map((c) => `<th>${e(c)}</th>`).join("")}</tr></thead>
      <tbody>${s.table.rows.map((r) => `<tr>${r.map((c) => `<td>${e(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : ""}
  `).join("");

  printWindow.document.write(`
    <html>
    <head>
      <title>Alerto Calbayog - ${e(report.title)}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; padding: 30px; margin: 0; }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0a1e3f; padding-bottom: 15px; margin-bottom: 24px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo { height: 50px; width: auto; }
        .header-title h1 { font-size: 22px; font-weight: bold; color: #0a1e3f; margin: 0; }
        .header-title p { font-size: 12px; color: #64748b; margin: 5px 0 0 0; }
        .report-info { font-size: 11px; color: #64748b; text-align: right; }
        .report-info p { margin: 2px 0; }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
        .metric { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; }
        .metric .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; }
        .metric .value { font-size: 20px; font-weight: bold; color: #0a1e3f; margin: 4px 0 2px; }
        .metric .hint { font-size: 10px; color: #94a3b8; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #0a1e3f; margin: 22px 0 8px; }
        p, li { font-size: 12px; line-height: 1.55; }
        ul, ol { margin: 0; padding-left: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th { background-color: #f1f5f9; color: #475569; font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left; }
        td { padding: 8px 10px; font-size: 11px; border: 1px solid #cbd5e1; }
        tr:nth-child(even) td { background-color: #f8fafc; }
        .recs { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px 10px 30px; }
        .footer { margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 10px; color: #94a3b8; text-align: center; }
        @media print { body { padding: 0; } h2, table { break-inside: avoid; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <img src="/logo.png" alt="Alerto Calbayog" class="logo" />
          <div class="header-title">
            <h1>ALERTO CALBAYOG</h1>
            <p>${e(report.title)} — ${e(report.scopeLabel)}</p>
          </div>
        </div>
        <div class="report-info">
          <p><strong>Period:</strong> ${e(report.periodLabel)}</p>
          <p>${e(report.rangeText)}</p>
          <p><strong>Generated:</strong> ${e(report.generatedAt.toLocaleString("en-PH"))}</p>
        </div>
      </div>

      <div class="metrics">
        ${report.metrics.map((m) => `<div class="metric"><div class="label">${e(m.label)}</div><div class="value">${e(m.value)}</div><div class="hint">${e(m.hint)}</div></div>`).join("")}
      </div>

      <h2>Key findings</h2>
      <ul>${report.findings.map((f) => `<li>${e(f)}</li>`).join("")}</ul>

      ${sectionHtml}

      <h2>Recommendations</h2>
      <ol class="recs">${report.recommendations.map((r) => `<li>${e(r)}</li>`).join("")}</ol>

      <div class="footer">
        Alerto Calbayog © ${new Date().getFullYear()} — Generated automatically from incident records. Figures reflect data available at the time of generation.
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
