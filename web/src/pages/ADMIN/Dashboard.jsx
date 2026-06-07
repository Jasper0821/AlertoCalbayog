import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../api/axios.js";
import socket from "../../api/socket.js";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLES = {
  pending: { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Pending" },
  verified: { dot: "bg-teal-500", text: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200", label: "Verified" },
  responding: { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", label: "Responding" },
  active: { dot: "bg-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", label: "Active" },
  resolved: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Resolved" },
  responded: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Responded" },
  closed: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", label: "Closed" },
};

const TYPE_LABELS = {
  fire: "Fire",
  flood: "Flood",
  emergency: "Emergency",
  crime: "Crime",
  medical: "Medical",
  others: "Others",
};

const THEME = {
  primary: "#0f172a",
  accent: "#dc2626",
  slate: "#475569",
  amber: "#f59e0b",
  teal: "#0d9488",
  blue: "#2563eb",
  indigo: "#4f46e5",
  emerald: "#059669",
};

const STATUS_COLORS = {
  Pending: THEME.amber,
  Verified: THEME.teal,
  "Acknowledged / Responding": THEME.blue,
  Resolved: THEME.emerald,
  Closed: "#64748b",
};

const CATEGORY_COLORS = {
  Fire: "#dc2626",
  Flood: "#2563eb",
  Emergency: "#4f46e5",
  Crime: "#7c3aed",
  Medical: "#059669",
  Others: "#64748b",
};

const PIE_COLORS = ["#f59e0b", "#0d9488", "#2563eb", "#059669", "#64748b", "#4f46e5"];

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "incidents", label: "Incidents" },
  { id: "analytics", label: "Analytics" },
  { id: "users", label: "Users" },
  { id: "notifications", label: "Notifications" },
  { id: "audit", label: "Audit Trail" },
  { id: "settings", label: "Settings" },
];

const emptyUserForm = {
  fullName: "",
  email: "",
  password: "",
  role: "resident",
  agency: "NONE",
  phoneNumber: "",
};

function getIncidentId(report, index) {
  if (report.incidentId) return report.incidentId;
  const year = report.createdAt ? new Date(report.createdAt).getFullYear() : new Date().getFullYear();
  return `INC-${year}-${String(index + 1).padStart(4, "0")}`;
}

function getLocation(report) {
  if (typeof report.location === "string") return report.location;
  return report.location?.name || [report.location?.barangay, report.location?.street, report.location?.purok].filter(Boolean).join(", ") || "Unknown location";
}

function getStatusInfo(status) {
  return STATUS_STYLES[(status || "pending").toLowerCase()] || STATUS_STYLES.pending;
}

function normalizeStatus(status) {
  const safeStatus = (status || "pending").toLowerCase();
  if (safeStatus === "pending") return "Pending";
  if (safeStatus === "verified") return "Verified";
  if (["responding", "active"].includes(safeStatus)) return "Acknowledged / Responding";
  if (["resolved", "responded"].includes(safeStatus)) return "Resolved";
  if (safeStatus === "closed") return "Closed";
  return "Pending";
}

function getBarangay(report) {
  if (report.location?.barangay) return report.location.barangay;
  if (typeof report.location === "string" && report.location.trim()) return report.location.trim();
  if (report.location?.name) {
    const barangayMatch = report.location.name.match(/(?:brgy\.?|barangay)\s*([^,]+)/i);
    if (barangayMatch?.[1]) return barangayMatch[1].trim();
  }
  return "Unspecified";
}

function addCount(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function mapToChartData(map, colorMap = {}) {
  return Array.from(map.entries()).map(([name, value]) => ({
    name,
    value,
    fill: colorMap[name] || THEME.slate,
  }));
}

function getMonthKey(date) {
  return new Intl.DateTimeFormat("en", { month: "short" }).format(date);
}

function buildMonthlyTrend(reports) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      name: getMonthKey(date),
      incidents: 0,
    };
  });
  const monthMap = new Map(months.map((item) => [item.key, item]));

  reports.forEach((report) => {
    if (!report.createdAt) return;
    const date = new Date(report.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (monthMap.has(key)) {
      monthMap.get(key).incidents += 1;
    }
  });

  return months.map(({ name, incidents }) => ({ name, incidents }));
}

function getFirstResponseDate(report) {
  const entries = Array.isArray(report.actionLog) ? report.actionLog : [];
  const responseEntry = entries
    .filter((entry) => {
      const toStatus = (entry.toStatus || "").toLowerCase();
      return entry.action === "responder_assignment" || ["verified", "responding", "active", "resolved", "responded"].includes(toStatus);
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

  return responseEntry?.createdAt ? new Date(responseEntry.createdAt) : null;
}

function formatMinutes(minutes) {
  if (!Number.isFinite(minutes)) return "Not available";
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-black text-slate-900">{label || payload[0].name}</p>
      <p className="mt-1 font-semibold text-slate-600">{payload[0].value} incidents</p>
    </div>
  );
}

function EmptyAnalytics() {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
      <div>
        <p className="text-sm font-black text-slate-700">No analytics data available yet.</p>
        <p className="mt-1 text-xs font-medium text-slate-500">Incident charts will appear when reports are submitted through the system.</p>
      </div>
    </div>
  );
}

function AnalyticsCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        {subtitle && <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function CsvExportButton({ reports }) {
  const exportCsv = () => {
    const rows = [
      ["Incident ID", "Type", "Reporter", "Location", "Status", "Assigned Agency", "Assigned Responder", "Created At"],
      ...reports.map((report, index) => [
        getIncidentId(report, index),
        report.emergencyType || "",
        report.userId?.fullName || "Unknown",
        getLocation(report),
        report.status || "pending",
        report.assignedAgency || "",
        report.assignedResponder?.fullName || "",
        report.createdAt || "",
      ]),
    ];

    const csv = rows.map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alerto-incidents-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportCsv}
      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
    >
      Export CSV
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [error, setError] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingReportId, setSavingReportId] = useState("");

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const fetchReports = async () => {
    const response = await api.get("/emergency");
    setReports(Array.isArray(response.data) ? response.data : []);
  };

  const fetchUsers = async () => {
    const response = await api.get("/users");
    setUsers(Array.isArray(response.data) ? response.data : []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([fetchReports(), fetchUsers()]);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load admin data");
      }
    };
    load();
  }, []);

  useEffect(() => {
    socket.connect();
    socket.emit("joinRoom", "admin");

    const upsertReport = (report) => {
      setReports((prev) => prev.some((item) => item._id === report._id)
        ? prev.map((item) => item._id === report._id ? report : item)
        : [report, ...prev]
      );
    };

    socket.on("newEmergencyAlert", (report) => {
      upsertReport(report);
      setNotifications((prev) => [{
        id: report._id || Date.now(),
        title: "New incident received",
        message: `${TYPE_LABELS[report.emergencyType] || "Incident"} at ${getLocation(report)}`,
        createdAt: new Date().toISOString(),
      }, ...prev].slice(0, 20));
    });

    socket.on("reportStatusChanged", (report) => {
      upsertReport(report);
      setNotifications((prev) => [{
        id: `${report._id}-${Date.now()}`,
        title: "Incident updated",
        message: `${getIncidentId(report, 0)} is now ${report.status}`,
        createdAt: new Date().toISOString(),
      }, ...prev].slice(0, 20));
    });

    return () => {
      socket.emit("leaveRoom", "admin");
      socket.off("newEmergencyAlert");
      socket.off("reportStatusChanged");
      socket.disconnect();
    };
  }, []);

  const responders = useMemo(() => users.filter((user) => user.role === "responder"), [users]);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports.filter((report, index) => {
      const status = (report.status || "pending").toLowerCase();
      const incidentId = getIncidentId(report, index).toLowerCase();
      const haystack = [
        incidentId,
        report.emergencyType,
        report.userId?.fullName,
        report.assignedResponder?.fullName,
        getLocation(report),
      ].join(" ").toLowerCase();

      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (agencyFilter !== "all" && !(report.notifiedAgencies || []).includes(agencyFilter)) return false;
      if (q && !haystack.includes(q)) return false;
      return true;
    });
  }, [agencyFilter, reports, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const open = reports.filter((report) => !["resolved", "responded", "closed"].includes((report.status || "").toLowerCase())).length;
    const verified = reports.filter((report) => (report.status || "").toLowerCase() === "verified").length;
    const responding = reports.filter((report) => ["responding", "active"].includes((report.status || "").toLowerCase())).length;
    const resolved = reports.filter((report) => ["resolved", "responded", "closed"].includes((report.status || "").toLowerCase())).length;

    const responseMinutes = reports.map((report) => {
      if (!report.createdAt) return null;
      const createdAt = new Date(report.createdAt);
      const firstResponseAt = getFirstResponseDate(report);
      if (!firstResponseAt || Number.isNaN(createdAt.getTime()) || Number.isNaN(firstResponseAt.getTime())) return null;
      const minutes = (firstResponseAt - createdAt) / 60000;
      return minutes >= 0 ? minutes : null;
    }).filter((value) => value !== null);
    const avgResponseMinutes = responseMinutes.length
      ? responseMinutes.reduce((sum, value) => sum + value, 0) / responseMinutes.length
      : null;

    return {
      total: reports.length,
      pending: reports.filter((report) => (report.status || "").toLowerCase() === "pending").length,
      verified,
      responding,
      active: verified + responding,
      resolved,
      open,
      users: users.length,
      responders: responders.length,
      avgResponse: formatMinutes(avgResponseMinutes),
      avgResponseRaw: avgResponseMinutes,
    };
  }, [reports, responders.length, users.length]);

  const analyticsData = useMemo(() => {
    const categoryMap = new Map();
    const statusMap = new Map();
    const barangayMap = new Map();

    reports.forEach((report) => {
      const type = TYPE_LABELS[(report.emergencyType || "others").toLowerCase()] || "Others";
      addCount(categoryMap, type);
      addCount(statusMap, normalizeStatus(report.status));
      addCount(barangayMap, getBarangay(report));
    });

    return {
      hasData: reports.length > 0,
      categories: mapToChartData(categoryMap, CATEGORY_COLORS).sort((a, b) => b.value - a.value),
      statuses: mapToChartData(statusMap, STATUS_COLORS),
      barangays: mapToChartData(barangayMap).sort((a, b) => b.value - a.value).slice(0, 8),
      trend: buildMonthlyTrend(reports),
    };
  }, [reports]);

  const auditEntries = useMemo(() => reports.flatMap((report, reportIndex) =>
    (report.actionLog || []).map((entry) => ({
      ...entry,
      incidentId: getIncidentId(report, reportIndex),
      reportType: report.emergencyType,
    }))
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [reports]);

  const updateReportStatus = async (reportId, status) => {
    setSavingReportId(reportId);
    setError("");
    try {
      const response = await api.put(`/reports/${reportId}/status`, { status });
      const updatedReport = response.data?.report;
      if (updatedReport?._id) {
        setReports((prev) => prev.map((report) => report._id === updatedReport._id ? updatedReport : report));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update incident status");
    } finally {
      setSavingReportId("");
    }
  };

  const assignResponder = async (reportId, responderId) => {
    if (!responderId) return;
    setSavingReportId(reportId);
    setError("");
    try {
      const response = await api.put(`/reports/${reportId}/assign`, { responderId });
      const updatedReport = response.data?.report;
      if (updatedReport?._id) {
        setReports((prev) => prev.map((report) => report._id === updatedReport._id ? updatedReport : report));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assign responder");
    } finally {
      setSavingReportId("");
    }
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setIsSavingUser(true);
    setError("");

    try {
      const payload = { ...userForm };
      if (editingUserId && !payload.password) {
        delete payload.password;
      }

      const response = editingUserId
        ? await api.put(`/users/${editingUserId}`, payload)
        : await api.post("/users", payload);

      const savedUser = response.data?.user;
      if (savedUser?._id) {
        setUsers((prev) => editingUserId
          ? prev.map((user) => user._id === savedUser._id ? savedUser : user)
          : [savedUser, ...prev]
        );
      } else {
        await fetchUsers();
      }

      setUserForm(emptyUserForm);
      setEditingUserId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save user");
    } finally {
      setIsSavingUser(false);
    }
  };

  const editUser = (user) => {
    setEditingUserId(user._id);
    setUserForm({
      fullName: user.fullName || "",
      email: user.email || "",
      password: "",
      role: user.role || "resident",
      agency: user.agency || "NONE",
      phoneNumber: user.phoneNumber || "",
    });
    setActiveNav("users");
  };

  const deleteUser = async (userId) => {
    const shouldDelete = window.confirm("Remove this user account? This action cannot be undone.");
    if (!shouldDelete) return;

    setError("");
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete user");
    }
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserForm(emptyUserForm);
  };

  const refreshAdminData = async () => {
    setIsRefreshing(true);
    setError("");
    try {
      await Promise.all([fetchReports(), fetchUsers()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to refresh admin data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const statCards = [
    { label: "Total Incidents", value: stats.total, sub: "All submitted reports", color: "text-slate-950", rail: "bg-slate-900" },
    { label: "Pending", value: stats.pending, sub: "Needs verification", color: "text-amber-700", rail: "bg-amber-500" },
    { label: "Verified", value: stats.verified, sub: "Validated reports", color: "text-teal-700", rail: "bg-teal-500" },
    { label: "Acknowledged", value: stats.responding, sub: "Responding or active", color: "text-blue-700", rail: "bg-blue-500" },
    { label: "Resolved", value: stats.resolved, sub: "Closed response loop", color: "text-emerald-700", rail: "bg-emerald-500" },
    { label: "Avg Response", value: stats.avgResponse, sub: stats.avgResponseRaw === null ? "Based on action logs" : "First response action", color: "text-slate-950", rail: "bg-red-600" },
  ];

  const renderStatCards = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {statCards.map((stat) => (
        <div key={stat.label} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className={`absolute inset-x-0 top-0 h-1 ${stat.rail}`} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
          <p className={`mt-3 text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{stat.sub}</p>
        </div>
      ))}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950">Incident Analytics</h2>
          <p className="text-sm font-medium text-slate-500">Live reporting intelligence from current incident records.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-500">
          Database/API data
        </div>
      </div>

      {renderStatCards()}

      {!analyticsData.hasData ? (
        <EmptyAnalytics />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
            <AnalyticsCard title="Monthly Incident Trend" subtitle="Reports created during the latest six-month window">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.trend} margin={{ top: 12, right: 18, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="incidents" stroke={THEME.accent} strokeWidth={3} dot={{ r: 4, fill: THEME.accent }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>

            <AnalyticsCard title="Incidents by Status" subtitle="Current operational state of all reports">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.statuses}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      {analyticsData.statuses.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.fill || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <AnalyticsCard title="Incidents by Category" subtitle="Emergency type volume across all agencies">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.categories} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {analyticsData.categories.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>

            <AnalyticsCard title="Incidents by Barangay / Location" subtitle="Top areas from geocoded report locations">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.barangays} layout="vertical" margin={{ top: 8, right: 18, left: 28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                    <YAxis type="category" dataKey="name" width={92} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" fill={THEME.primary} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
          </div>
        </>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Admin Command Center</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Incident Operations Dashboard</h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
              Monitor live reports, review operational load, and coordinate status updates from one official response view.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center sm:min-w-[280px]">
            <div>
              <p className="text-2xl font-black text-slate-950">{stats.open}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Open</p>
            </div>
            <div>
              <p className="text-2xl font-black text-red-600">{notifications.length}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Alerts</p>
            </div>
          </div>
        </div>
      </section>

      {renderAnalytics()}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-black text-slate-900">Priority Incident Control</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Recent reports can still be updated and assigned from this dashboard view.</p>
          </div>
          {renderIncidentTable(filteredReports.slice(0, 6), true)}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <h2 className="text-sm font-black text-slate-900">Live Notifications</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">Realtime admin alerts during this session.</p>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">No live notifications yet.</p>
            ) : notifications.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:border-slate-200 hover:bg-white">
                <p className="text-xs font-black text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{item.message}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderIncidentTable = (items, compact = false) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <th className="px-4 py-3">Incident</th>
            <th className="px-4 py-3">Reporter</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Responder</th>
            <th className="px-4 py-3">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-4 py-10 text-center text-sm font-semibold text-slate-400">No incidents found.</td>
            </tr>
          ) : items.map((report, index) => {
            const status = (report.status || "pending").toLowerCase();
            const statusInfo = getStatusInfo(status);
            const availableResponders = responders.filter((responder) =>
              (report.notifiedAgencies || []).includes(responder.agency)
            );

            return (
              <tr key={report._id || index} className="text-sm text-slate-700 hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <p className="font-mono text-xs font-black text-slate-900">{getIncidentId(report, index)}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{TYPE_LABELS[report.emergencyType] || "Incident"}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-800">{report.userId?.fullName || "Unknown"}</p>
                  <p className="text-xs text-slate-400">{report.userId?.phoneNumber || "No contact"}</p>
                </td>
                <td className="max-w-[260px] px-4 py-3">
                  <p className="truncate text-xs font-semibold text-slate-600" title={getLocation(report)}>{getLocation(report)}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{(report.notifiedAgencies || []).join(", ")}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                    <select
                      value={status === "responding" ? "active" : status}
                      disabled={savingReportId === report._id}
                      onChange={(event) => updateReportStatus(report._id, event.target.value)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-black outline-none transition focus:ring-2 focus:ring-red-600/15 ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text}`}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={report.assignedResponder?._id || ""}
                    disabled={savingReportId === report._id || availableResponders.length === 0}
                    onChange={(event) => assignResponder(report._id, event.target.value)}
                    className="w-full min-w-[180px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">{availableResponders.length ? "Assign responder" : "No responder available"}</option>
                    {availableResponders.map((responder) => (
                      <option key={responder._id} value={responder._id}>
                        {responder.fullName} - {responder.agency}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-bold text-slate-700">
                    {report.createdAt ? new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                  </p>
                  {!compact && (
                    <p className="text-[10px] text-slate-400">
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ""}
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderIncidents = () => (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900">Incident Management</h2>
          <p className="text-xs text-slate-500">Monitor every report, update status, assign responders, and export history.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none transition hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-600/10">
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={agencyFilter} onChange={(event) => setAgencyFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none transition hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-600/10">
            <option value="all">All agencies</option>
            <option value="BFP">BFP</option>
            <option value="CDRRMO">CDRRMO</option>
            <option value="PNP">PNP</option>
          </select>
          <CsvExportButton reports={filteredReports} />
        </div>
      </div>
      {renderIncidentTable(filteredReports)}
    </section>
  );

  const renderUsers = () => (
    <div className="grid gap-5 xl:grid-cols-[0.45fr_0.55fr]">
      <form onSubmit={saveUser} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-black text-slate-900">{editingUserId ? "Edit User" : "Add User"}</h2>
        <div className="mt-4 grid gap-3">
          <input value={userForm.fullName} onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })} placeholder="Full name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10" />
          <input value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} placeholder="Email" type="email" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10" />
          <input value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} placeholder={editingUserId ? "New password (optional)" : "Password"} type="password" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10" />
          <div className="grid grid-cols-2 gap-3">
            <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value, agency: event.target.value === "resident" ? "NONE" : userForm.agency })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10">
              <option value="resident">Resident</option>
              <option value="responder">Responder</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <select value={userForm.agency} onChange={(event) => setUserForm({ ...userForm, agency: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10">
              <option value="NONE">No agency</option>
              <option value="BFP">BFP</option>
              <option value="CDRRMO">CDRRMO</option>
              <option value="PNP">PNP</option>
            </select>
          </div>
          <input value={userForm.phoneNumber} onChange={(event) => setUserForm({ ...userForm, phoneNumber: event.target.value })} placeholder="Phone number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10" />
        </div>
        <div className="mt-4 flex gap-2">
          <button disabled={isSavingUser} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-80">
            {isSavingUser ? "Saving..." : editingUserId ? "Save Changes" : "Create User"}
          </button>
          {editingUserId && (
            <button type="button" onClick={resetUserForm} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]">
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-black text-slate-900">User Directory</h2>
          <p className="text-xs text-slate-500">Manage residents, responders, staff, and administrators.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Agency</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user._id} className="text-sm text-slate-700">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{user.fullName}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3">{user.agency || "NONE"}</td>
                  <td className="px-4 py-3">{user.phoneNumber || "N/A"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => editUser(user)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]">Edit</button>
                      <button onClick={() => deleteUser(user._id)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 transition hover:border-red-300 hover:bg-red-100 active:scale-[0.98]">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderNotifications = () => (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black text-slate-900">Notification Center</h2>
      <p className="mt-1 text-xs text-slate-500">Resident and responder notifications are sent automatically when incidents are verified, activated, resolved, or assigned.</p>
      <div className="mt-5 space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">No notifications captured in this session.</div>
        ) : notifications.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-900">{item.title}</p>
            <p className="mt-1 text-sm text-slate-600">{item.message}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  );

  const renderAudit = () => (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-black text-slate-900">Action Audit Trail</h2>
        <p className="text-xs text-slate-500">Status changes and responder assignments are logged per incident.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {auditEntries.length === 0 ? (
          <p className="p-6 text-center text-sm font-semibold text-slate-400">No logged actions yet.</p>
        ) : auditEntries.map((entry, index) => (
          <div key={`${entry.incidentId}-${entry.createdAt}-${index}`} className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[160px_1fr_180px]">
            <p className="font-mono text-xs font-black text-slate-900">{entry.incidentId}</p>
            <div>
              <p className="font-bold text-slate-800">{entry.message || entry.action}</p>
              <p className="text-xs text-slate-500">By {entry.actorName || "System"} ({entry.actorRole || "n/a"})</p>
            </div>
            <p className="text-xs font-semibold text-slate-400 md:text-right">{new Date(entry.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  );

  const renderSettings = () => {
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const roleCounts = ["admin", "staff", "responder", "resident"].map((role) => ({
      role,
      count: users.filter((user) => user.role === role).length,
    }));
    const workflow = [
      { label: "Pending", body: "New reports awaiting verification", color: "bg-amber-500" },
      { label: "Verified", body: "Validated incidents ready for action", color: "bg-teal-500" },
      { label: "Active", body: "Responder is acknowledged or en route", color: "bg-blue-500" },
      { label: "Resolved", body: "Response cycle is completed", color: "bg-emerald-500" },
    ];
    const systemCards = [
      { label: "API Base URL", value: apiBase, sub: "Used by authenticated admin requests" },
      { label: "Socket Room", value: "admin", sub: "Realtime incident and status updates" },
      { label: "Signed-in Admin", value: storedUser.fullName || "Admin", sub: storedUser.email || "Current browser session" },
      { label: "Tracked Records", value: `${reports.length} incidents / ${users.length} users`, sub: "Loaded into this dashboard session" },
    ];

    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Admin Settings</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">System Control & Configuration</h2>
              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Review access rules, realtime connections, incident workflow, and dashboard maintenance actions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={refreshAdminData}
                disabled={isRefreshing}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isRefreshing ? "Refreshing..." : "Refresh Data"}
              </button>
              <CsvExportButton reports={reports} />
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {systemCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{card.label}</p>
              <p className="mt-2 break-words text-sm font-black text-slate-950">{card.value}</p>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Access Control</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Current user distribution and operational permissions.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Role Based
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {roleCounts.map((item) => (
                <div key={item.role} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-2xl font-black text-slate-950">{item.count}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.role}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              {[
                ["Admin", "Manage users, incidents, assignments, exports, and dashboard-wide monitoring."],
                ["Staff", "Monitor and update reports routed to their assigned agency."],
                ["Responder", "Receive assignments and update response progress for routed incidents."],
                ["Resident", "Submit reports and receive incident status notifications."],
              ].map(([role, scope]) => (
                <div key={role} className="grid gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[120px_1fr]">
                  <p className="font-black text-slate-900">{role}</p>
                  <p className="font-medium leading-6 text-slate-600">{scope}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <h3 className="text-sm font-black text-slate-900">Incident Workflow</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">Official status path used by the admin and agency dashboards.</p>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {workflow.map((step, index) => (
                <div key={step.label} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className={`mb-3 h-2 w-12 rounded-full ${step.color}`} />
                  <p className="text-sm font-black text-slate-950">{step.label}</p>
                  <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{step.body}</p>
                  <span className="absolute right-3 top-3 text-[10px] font-black text-slate-300">{String(index + 1).padStart(2, "0")}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-950 p-4 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Realtime Behavior</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                The admin dashboard joins the admin socket room and listens for new reports plus status changes. Agency dashboards receive the same updates through their agency rooms.
              </p>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Maintenance Shortcuts</h3>
              <p className="mt-1 text-xs font-medium text-slate-500">Fast actions for common administrator checks.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveNav("incidents")}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                Open Incidents
              </button>
              <button
                type="button"
                onClick={() => setActiveNav("users")}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                Open Users
              </button>
              <button
                type="button"
                onClick={() => setActiveNav("audit")}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                View Audit Trail
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderContent = () => {
    if (activeNav === "overview") return renderOverview();
    if (activeNav === "incidents") return renderIncidents();
    if (activeNav === "analytics") return renderAnalytics();
    if (activeNav === "users") return renderUsers();
    if (activeNav === "notifications") return renderNotifications();
    if (activeNav === "audit") return renderAudit();
    return renderSettings();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      {isSidebarOpen && (
        <button className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu" />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <img src="/logo.png" alt="Alerto Calbayog" className="h-9 w-9 object-contain" />
          <div>
            <p className="text-sm font-black">Alerto Calbayog</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${activeNav === item.id ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="rounded-lg bg-white/10 p-3">
            <p className="text-xs font-black">{storedUser.fullName || "Admin"}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Full access</p>
          </div>
          <button onClick={logout} className="mt-2 w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-slate-300 transition hover:bg-red-500/20 hover:text-red-200">
            Logout
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
          <button onClick={() => setIsSidebarOpen(true)} className="rounded-lg border border-slate-200 p-2 lg:hidden" aria-label="Open menu">
            <span className="block h-0.5 w-5 bg-slate-700" />
            <span className="mt-1 block h-0.5 w-5 bg-slate-700" />
            <span className="mt-1 block h-0.5 w-5 bg-slate-700" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-900">{NAV.find((item) => item.id === activeNav)?.label}</p>
            <p className="text-xs text-slate-500">Manage incidents, responders, residents, notifications, and system settings.</p>
          </div>
          <div className="hidden w-full max-w-sm sm:block">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search incidents, reporter, location..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 lg:p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
          {renderContent()}
        </section>
      </main>
    </div>
  );
}
