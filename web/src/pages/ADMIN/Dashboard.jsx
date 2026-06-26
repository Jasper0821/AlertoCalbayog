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
import {
  DashboardIcon as LayoutDashboard,
  ReportIcon as AlertTriangle,
  AnalyticsIcon as BarChart2,
  UsersIcon as Users,
  AuditIcon as ClipboardList,
  SettingsIcon as Settings,
  BellIcon as Bell,
  SearchIcon as Search,
  LogoutIcon as LogOut,
  MenuIcon as Menu
} from "./icons.jsx";
import api from "../../api/axios.js";
import socket from "../../api/socket.js";
import { getValidCalbayogBarangay } from "../../utils/barangays.js";
import { clearDashboardNavigationState } from "../../utils/dashboardSession.js";

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
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "incidents", label: "Incidents", icon: AlertTriangle },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "users", label: "Users", icon: Users },
  { id: "audit", label: "Audit Trail", icon: ClipboardList },
  { id: "settings", label: "Settings", icon: Settings },
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
  let locationStr = "Unspecified";
  if (report.location?.barangay) {
    locationStr = report.location.barangay;
  } else if (typeof report.location === "string" && report.location.trim()) {
    locationStr = report.location.trim();
  } else if (report.location?.name) {
    locationStr = report.location.name;
  }
  return getValidCalbayogBarangay(locationStr);
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
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-[0.98]"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      Export
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(() => localStorage.getItem("adminActiveNav") || "overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reports, setReports] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("adminReports")) || [];
    } catch {
      return [];
    }
  });
  const [users, setUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("adminUsers")) || [];
    } catch {
      return [];
    }
  });
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("adminNotifications")) || [];
    } catch {
      return [];
    }
  });
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem("adminSessionId");
    if (!sid) {
      sid = `admin-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("adminSessionId", sid);
    }
    return sid;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingReportId, setSavingReportId] = useState("");
  // Audit Trail state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTab, setAuditTab] = useState(() => localStorage.getItem("adminAuditTab") || "status"); // "status" | "user_activity" | "password_security"
  const [auditSearch, setAuditSearch] = useState("");
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [auditDateTo, setAuditDateTo] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditDetailEntry, setAuditDetailEntry] = useState(null);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const fetchReports = async () => {
    const response = await api.get("/emergency");
    const data = Array.isArray(response.data) ? response.data : [];
    setReports(data);
    localStorage.setItem("adminReports", JSON.stringify(data));
  };

  const fetchUsers = async () => {
    const response = await api.get("/users");
    const data = Array.isArray(response.data) ? response.data : [];
    setUsers(data);
    localStorage.setItem("adminUsers", JSON.stringify(data));
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications/me");
      const data = Array.isArray(response.data.notifications)
        ? response.data.notifications
        : response.data || [];
      const next = data.slice(0, 20).map((item) => ({
        id: item._id || item.id || `${Date.now()}`,
        title: item.title || "Notification",
        message: item.message || "You have a new notification.",
        createdAt: item.createdAt || new Date().toISOString(),
        read: item.read || false,
        type: item.type || "system_event",
        category: item.category || "system",
        metadata: item.metadata || {},
      }));
      setNotifications(next);
      localStorage.setItem("adminNotifications", JSON.stringify(next));
    } catch (err) {
      // preserve cached notifications if API load fails
    }
  };

  const fetchAuditLogs = async ({ tab, search, dateFrom, dateTo, page } = {}) => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      const activeTab = tab ?? auditTab;
      if (activeTab === "status") {
        // status tab reads from incident actionLog (existing auditEntries) — no API call needed
        setAuditLoading(false);
        return;
      }
      if (activeTab === "user_activity") params.set("category", "user_activity");
      if (activeTab === "password_security") params.set("category", "password_security");
      if (search ?? auditSearch) params.set("search", search ?? auditSearch);
      if (dateFrom ?? auditDateFrom) params.set("startDate", dateFrom ?? auditDateFrom);
      if (dateTo ?? auditDateTo) params.set("endDate", dateTo ?? auditDateTo);
      params.set("page", page ?? auditPage);
      params.set("limit", "20");
      const res = await api.get(`/audit?${params.toString()}`);
      setAuditLogs(res.data.logs || []);
      setAuditTotal(res.data.total || 0);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([fetchReports(), fetchUsers(), fetchNotifications()]);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load admin data");
      }
    };
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem("adminActiveNav", activeNav);
  }, [activeNav]);

  useEffect(() => {
    localStorage.setItem("adminAuditTab", auditTab);
  }, [auditTab]);

  useEffect(() => {
    localStorage.setItem("adminReports", JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem("adminUsers", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("adminNotifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (activeNav === "audit" && auditTab !== "status") {
      fetchAuditLogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav, auditTab, auditPage]);

  useEffect(() => {
    const connectSocket = async () => {
      socket.connect();
      socket.emit("identify", {
        userId: storedUser.id,
        role: "admin",
        sessionId,
      });

      socket.on("notification", (notification) => {
        setNotifications((prev) => {
          const next = [
            {
              id: notification._id || `${Date.now()}`,
              title: notification.title || "Notification",
              message: notification.message || "You have a new notification.",
              createdAt: notification.createdAt || new Date().toISOString(),
              read: notification.read || false,
              type: notification.type || "system_event",
              category: notification.category || "system",
              metadata: notification.metadata || {},
            },
            ...prev,
          ].slice(0, 20);
          localStorage.setItem("adminNotifications", JSON.stringify(next));
          return next;
        });
      });

      const upsertReport = (report) => {
        setReports((prev) => prev.some((item) => item._id === report._id)
          ? prev.map((item) => item._id === report._id ? report : item)
          : [report, ...prev]
        );
      };

      socket.on("newEmergencyAlert", (report) => {
        upsertReport(report);
      });

      socket.on("reportStatusChanged", (report) => {
        upsertReport(report);
      });
    };

    connectSocket();

    return () => {
      socket.off("notification");
      socket.off("newEmergencyAlert");
      socket.off("reportStatusChanged");
      socket.disconnect();
    };
  }, [sessionId, storedUser.id]);

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
      const bgy = getBarangay(report);
      if (bgy) addCount(barangayMap, bgy);
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
        const mergedUser = {
          ...savedUser,
          visiblePassword: payload.password || savedUser.visiblePassword || "",
        };

        setUsers((prev) => editingUserId
          ? prev.map((user) => user._id === mergedUser._id ? mergedUser : user)
          : [mergedUser, ...prev]
        );
      } else {
        await fetchUsers();
      }

      setUserForm(emptyUserForm);
      setEditingUserId(null);
      setIsUserModalOpen(false);
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
    setIsUserModalOpen(true);
  };

  const openAddUserModal = () => {
    setEditingUserId(null);
    setUserForm(emptyUserForm);
    setIsUserModalOpen(true);
    setError("");
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserForm(emptyUserForm);
    setIsUserModalOpen(false);
    setError("");
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

  const clearAdminCache = () => {
    [
      "adminActiveNav",
      "adminReports",
      "adminUsers",
      "adminNotifications",
      "adminAuditTab",
      "adminSessionId",
    ].forEach((key) => localStorage.removeItem(key));
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
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    clearDashboardNavigationState();
    clearAdminCache();
    navigate("/login");
  };

  const statCards = [
    { label: "Total Incidents", value: stats.total, sub: "All submitted reports", bg: "bg-emerald-50", text: "text-emerald-500", icon: LayoutDashboard },
    { label: "Pending", value: stats.pending, sub: "Needs verification", bg: "bg-teal-50", text: "text-teal-500", icon: AlertTriangle },
    { label: "Verified", value: stats.verified, sub: "Validated reports", bg: "bg-blue-50", text: "text-blue-500", icon: ClipboardList },
    { label: "Resolved", value: stats.resolved, sub: "Closed response loop", bg: "bg-indigo-50", text: "text-indigo-500", icon: Settings },
  ];

  const renderStatCards = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${stat.bg} ${stat.text}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-3xl font-black tracking-tight text-slate-900">{stat.value}</p>
              </div>
              <p className="mt-0.5 text-[10px] font-bold text-slate-400">{stat.sub}</p>
            </div>
          </div>
        );
      })}
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
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between py-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Hello {storedUser.fullName || "Admin"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
            Maintain your situational awareness to achieve a resilient community environment.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-slate-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            Today, {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}
          </div>
          <CsvExportButton reports={filteredReports} />
        </div>
      </section>

      {renderStatCards()}

      {!analyticsData.hasData ? (
        <EmptyAnalytics />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
            <AnalyticsCard title="Incident Trending" subtitle="Reports created during the latest six-month window">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.trend} margin={{ top: 12, right: 18, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="incidents" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>

            <AnalyticsCard title="Agency Categories" subtitle="Emergency type volume across all agencies">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.categories} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {analyticsData.categories.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill || "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.6fr_1.4fr]">
            <AnalyticsCard title="Incident Analysis" subtitle="Current operational state of all reports">
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

            <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm shadow-slate-200/50">
              <div className="border-b border-slate-100 px-5 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-black text-slate-900">Incident Scorecard</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">Recent reports and assignments.</p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input placeholder="Search..." className="w-32 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-600/10" />
                  </div>
                  <button onClick={() => setActiveNav("incidents")} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-600">
                    View All
                  </button>
                </div>
              </div>
              {renderIncidentTable(filteredReports.slice(0, 5), true)}
            </section>
          </div>
        </>
      )}
    </div>
  );

  const renderIncidentTable = (items, compact = false) => (
    <div className="overflow-x-auto">
      <table className="w-full table-auto text-left">
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
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                    {statusInfo.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    {report.assignedResponder ? (
                      <span className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700">
                        {report.assignedResponder.fullName}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Unassigned
                      </span>
                    )}
                  </div>
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
    <section className="rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/50">
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
          <select value={agencyFilter} onChange={(event) => setAgencyFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none shadow-md transition hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-600/10">
            <option value="all">All agencies</option>
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900">User Directory</h2>
          <p className="text-xs text-slate-500">Manage residents, responders, staff, and administrators.</p>
        </div>
        <button type="button" onClick={openAddUserModal} className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]">
          Add User
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Agency</th>
                <th className="px-4 py-3">Password</th>
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
                  <td className="px-4 py-3 break-all text-xs font-medium text-slate-700">{user.visiblePassword || "—"}</td>
                  <td className="px-4 py-3">{user.phoneNumber || "N/A"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
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

      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">{editingUserId ? "Edit User" : "Add User"}</h2>
                <p className="mt-1 text-sm text-slate-500">Create or update dashboard user accounts.</p>
              </div>
              <button type="button" onClick={resetUserForm} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 active:scale-[0.98]">
                Close
              </button>
            </div>

            <form onSubmit={saveUser} className="mt-5 grid gap-3">
              <input value={userForm.fullName} onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })} placeholder="Full name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10" />
              <input value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} placeholder="Email" type="email" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10" />
              <input value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} placeholder={editingUserId ? "New password (optional)" : "Password"} type="password" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value, agency: event.target.value === "resident" ? "NONE" : userForm.agency })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10">
                  <option value="resident">Resident</option>
                  <option value="responder">Responder</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <select value={userForm.agency} onChange={(event) => setUserForm({ ...userForm, agency: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10">
                  <option value="NONE">No agency</option>
                  <option value="CDRRMO">CDRRMO</option>
                  <option value="PNP">PNP</option>
                </select>
              </div>
              <input value={userForm.phoneNumber} onChange={(event) => setUserForm({ ...userForm, phoneNumber: event.target.value })} placeholder="Phone number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10" />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button disabled={isSavingUser} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-80">
                  {isSavingUser ? "Saving..." : editingUserId ? "Save Changes" : "Create User"}
                </button>
                <button type="button" onClick={resetUserForm} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]">
                  Cancel
                </button>
              </div>
              {error && <p className="text-sm font-bold text-red-600">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/50">
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

  const renderAudit = () => {
    const AUDIT_ACTION_LABELS = {
      login_success: "Login Successful",
      login_failed: "Login Failed",
      otp_sent: "OTP Code Sent",
      otp_verified: "OTP Verified",
      otp_failed: "OTP Verification Failed",
      password_reset: "Password Reset",
      password_changed: "Password Changed",
    };

    const AUDIT_ACTION_STYLES = {
      login_success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
      login_failed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
      otp_sent: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
      otp_verified: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
      otp_failed: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
      password_reset: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
      password_changed: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
    };

    const exportCsv = (rows, filename) => {
      const csv = rows.map((row) => row.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    };

    // ── STATUS TAB ─────────────────────────────────────────────────────────────
    const auditEntries = reports.flatMap((report, reportIndex) =>
      (report.actionLog || []).map((entry) => ({
        ...entry,
        incidentId: getIncidentId(report, reportIndex),
        reportType: report.emergencyType,
        agency: (report.notifiedAgencies || []).join(", "),
        location: getLocation(report),
        reportCreatedAt: report.createdAt,
        currentStatus: report.status,
      }))
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const filteredAuditEntries = auditEntries.filter((e) => {
      const q = auditSearch.toLowerCase();
      if (!q) return true;
      return [e.incidentId, e.reportType, e.agency, e.location, e.actorName, e.message, e.action].join(" ").toLowerCase().includes(q);
    }).filter((e) => {
      if (!auditDateFrom && !auditDateTo) return true;
      const d = new Date(e.createdAt);
      if (auditDateFrom && d < new Date(auditDateFrom)) return false;
      if (auditDateTo) { const end = new Date(auditDateTo); end.setHours(23,59,59); if (d > end) return false; }
      return true;
    });

    const AUDIT_PAGE_SIZE = 20;
    const statusPageCount = Math.ceil(filteredAuditEntries.length / AUDIT_PAGE_SIZE);
    const paginatedEntries = filteredAuditEntries.slice((auditPage - 1) * AUDIT_PAGE_SIZE, auditPage * AUDIT_PAGE_SIZE);

    // ── USER ACTIVITY + PASSWORD SECURITY tabs ─────────────────────────────────
    const filteredAuditLogs = auditLogs.filter((e) => {
      const q = auditSearch.toLowerCase();
      if (!q) return true;
      return [e.actorName, e.actorEmail, e.actorRole, e.action, e.details].join(" ").toLowerCase().includes(q);
    });

    const logPageCount = Math.ceil(auditTotal / 20);

    const pwdLogs = auditTab === "password_security" ? filteredAuditLogs : [];
    const actLogs = auditTab === "user_activity" ? filteredAuditLogs : [];

    const handleAuditSearch = () => {
      setAuditPage(1);
      fetchAuditLogs({ page: 1 });
    };

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Audit Trail</h2>
            <p className="mt-0.5 text-sm text-slate-500">Monitor, transparency, and accountability. All records are read-only.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (auditTab === "status") {
                  exportCsv(
                    [["Incident ID", "Type", "Agency", "Location", "Action", "Actor", "Role", "Status", "Timestamp"],
                    ...filteredAuditEntries.map((e) => [e.incidentId, e.reportType || "", e.agency || "", e.location || "", e.message || e.action, e.actorName || "System", e.actorRole || "", e.toStatus || "", new Date(e.createdAt).toLocaleString()])],
                    `audit-status-${new Date().toISOString().slice(0,10)}.csv`
                  );
                } else {
                  exportCsv(
                    [["Date/Time", "Name", "Email", "Role", "Action", "Details", "OTP Code", "Source", "IP"],
                    ...filteredAuditLogs.map((e) => [new Date(e.createdAt).toLocaleString(), e.actorName, e.actorEmail, e.actorRole, AUDIT_ACTION_LABELS[e.action] || e.action, e.details, e.otpCode || "", e.source || "", e.ipAddress || ""])],
                    `audit-${auditTab}-${new Date().toISOString().slice(0,10)}.csv`
                  );
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
          {[
            { id: "status", label: "Status" },
            { id: "user_activity", label: "User Activity" },
            { id: "password_security", label: "Password Security" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setAuditTab(tab.id); setAuditPage(1); setAuditSearch(""); }}
              className={`rounded-lg px-5 py-2 text-sm font-bold transition-all ${auditTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuditSearch()}
              placeholder={auditTab === "status" ? "Search incident, agency, actor..." : "Search name, email, action..."}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
          <input type="date" value={auditDateFrom} onChange={(e) => setAuditDateFrom(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" value={auditDateTo} onChange={(e) => setAuditDateTo(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
          <button onClick={handleAuditSearch} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700">
            Filter
          </button>
          <button onClick={() => { setAuditSearch(""); setAuditDateFrom(""); setAuditDateTo(""); setAuditPage(1); }} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50">
            Clear
          </button>
        </div>

        {/* ── STATUS TAB ───────────────────────────────────────────────────── */}
        {auditTab === "status" && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/50">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-black text-slate-900">Incident Status Log</h3>
              <p className="mt-0.5 text-xs text-slate-500">Status updates recorded per incident. View-only.</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
              <table className="w-full table-auto text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-3 py-2">Incident</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Agency</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actor</th>
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedEntries.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">No status log entries found.</td></tr>
                  ) : paginatedEntries.map((entry, idx) => {
                    const fromInfo = getStatusInfo(entry.fromStatus);
                    const toInfo = getStatusInfo(entry.toStatus);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2 font-mono text-xs font-bold text-slate-900">{entry.incidentId}</td>
                        <td className="px-3 py-2">
                          <span className="capitalize text-sm font-semibold text-slate-700">{entry.reportType || "—"}</span>
                        </td>
                        <td className="px-3 py-2 text-xs font-bold text-slate-600">{entry.agency || "—"}</td>
                        <td className="px-3 py-2 max-w-[140px]"><p className="truncate text-xs text-slate-600">{entry.location || "—"}</p></td>
                        <td className="px-3 py-2">
                          {entry.fromStatus && entry.toStatus ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${fromInfo.bg} ${fromInfo.text}`}>{entry.fromStatus}</span>
                              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                              <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${toInfo.bg} ${toInfo.text}`}>{entry.toStatus}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">{entry.action}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-xs font-bold text-slate-700">{entry.actorName || "System"}</p>
                          <p className="text-[10px] font-medium capitalize text-slate-400">{entry.actorRole || ""}</p>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => setAuditDetailEntry(entry)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50">
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {statusPageCount > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <p className="text-xs text-slate-500">Showing {Math.min((auditPage - 1) * AUDIT_PAGE_SIZE + 1, filteredAuditEntries.length)}–{Math.min(auditPage * AUDIT_PAGE_SIZE, filteredAuditEntries.length)} of {filteredAuditEntries.length}</p>
                <div className="flex gap-1">
                  {Array.from({ length: statusPageCount }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setAuditPage(p)} className={`h-7 w-7 rounded text-xs font-bold ${auditPage === p ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{p}</button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── USER ACTIVITY TAB ───────────────────────────────────────────────── */}
        {auditTab === "user_activity" && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/50">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-black text-slate-900">User Account Activity</h3>
              <p className="mt-0.5 text-xs text-slate-500">Login attempts, profile updates, account changes. View-only.</p>
            </div>
            {auditLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading activity logs...</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
                <table className="w-full table-auto text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-4 py-3">IP</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {actLogs.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">No user activity logs found.</td></tr>
                    ) : actLogs.map((log, idx) => {
                      const style = AUDIT_ACTION_STYLES[log.action] || { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-800">{log.actorName || "—"}</td>
                          <td className="px-4 py-3 max-w-[140px] truncate text-xs text-slate-600">{log.actorEmail || "—"}</td>
                          <td className="px-4 py-3 max-w-[90px] truncate text-xs font-bold capitalize text-slate-500">{log.actorRole || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${style.bg} ${style.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                              {AUDIT_ACTION_LABELS[log.action] || log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[160px] truncate text-xs text-slate-600">{log.details || "—"}</td>
                          <td className="px-4 py-3 max-w-[110px] truncate text-xs font-mono text-slate-400">{log.ipAddress || "—"}</td>
                          <td className="px-5 py-3">
                            <button onClick={() => setAuditDetailEntry(log)} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50">
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {logPageCount > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <p className="text-xs text-slate-500">Page {auditPage} of {logPageCount} — {auditTotal} total records</p>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(logPageCount, 8) }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setAuditPage(p)} className={`h-7 w-7 rounded text-xs font-bold ${auditPage === p ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{p}</button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── PASSWORD SECURITY TAB ────────────────────────────────────────────── */}
        {auditTab === "password_security" && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/50">
            <div className="border-b border-slate-100 px-5 py-4 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Password Security Activity</h3>
                <p className="mt-0.5 text-xs text-slate-500">OTP requests, verifications, and password resets. Read-only security log.</p>
              </div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-600 border border-red-100">Sensitive</span>
            </div>
            {auditLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading security logs...</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
                <table className="w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[160px]" />
                    <col className="w-[120px]" />
                    <col className="w-[170px]" />
                    <col className="w-[90px]" />
                    <col className="w-[110px]" />
                    <col className="w-[120px]" />
                    <col className="w-[220px]" />
                    <col className="w-[80px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">OTP</th>
                      <th className="px-3 py-2">Details</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pwdLogs.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-400">No password security events recorded.</td></tr>
                    ) : pwdLogs.map((log, idx) => {
                      const style = AUDIT_ACTION_STYLES[log.action] || { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-800 max-w-[120px] truncate">{log.actorName || "—"}</td>
                          <td className="px-4 py-3 max-w-[150px] truncate text-xs text-blue-600 font-medium">{log.actorEmail || "—"}</td>
                          <td className="px-4 py-3 max-w-[90px] truncate text-xs font-bold capitalize text-slate-500">{log.actorRole || "—"}</td>
                          <td className="px-4 py-3 max-w-[130px]">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${style.bg} ${style.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                              {AUDIT_ACTION_LABELS[log.action] || log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[110px] truncate text-xs">
                            {log.otpCode ? (
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-800 tracking-[0.08em]">{log.otpCode}</span>
                            ) : (
                              <span className="text-[11px] text-slate-300">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-[220px] truncate text-xs text-slate-600">{log.details || "—"}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => setAuditDetailEntry(log)} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50">
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {logPageCount > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <p className="text-xs text-slate-500">Page {auditPage} of {logPageCount} — {auditTotal} total records</p>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(logPageCount, 8) }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setAuditPage(p)} className={`h-7 w-7 rounded text-xs font-bold ${auditPage === p ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{p}</button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Detail Modal */}
        {auditDetailEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4" onClick={() => setAuditDetailEntry(null)}>
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h3 className="text-sm font-black text-slate-900">Log Entry Details</h3>
                <button onClick={() => setAuditDetailEntry(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="divide-y divide-slate-50 px-6 py-4 space-y-0">
                {[
                  ["Timestamp", auditDetailEntry.createdAt ? new Date(auditDetailEntry.createdAt).toLocaleString() : "—"],
                  ["Actor", auditDetailEntry.actorName || "System"],
                  ["Email", auditDetailEntry.actorEmail || "—"],
                  ["Role", auditDetailEntry.actorRole || "—"],
                  ["Action", AUDIT_ACTION_LABELS[auditDetailEntry.action] || auditDetailEntry.action || "—"],
                  ["Incident ID", auditDetailEntry.incidentId || "—"],
                  ["From Status", auditDetailEntry.fromStatus || "—"],
                  ["To Status", auditDetailEntry.toStatus || "—"],
                  ["OTP Code", auditDetailEntry.otpCode || "—"],
                  ["Source", auditDetailEntry.source || "web"],
                  ["User Agent", auditDetailEntry.userAgent || "—"],
                  ["OTP Verified At", auditDetailEntry.otpVerifiedAt ? new Date(auditDetailEntry.otpVerifiedAt).toLocaleString() : "—"],
                  ["IP Address", auditDetailEntry.ipAddress || "—"],
                  ["Details", auditDetailEntry.details || auditDetailEntry.message || "—"],
                ].map(([label, value]) => value !== "—" && (
                  <div key={label} className="flex justify-between gap-4 py-2.5">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 shrink-0">{label}</span>
                    <span className="text-xs font-semibold text-slate-700 text-right">{value}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 px-6 py-4">
                <button onClick={() => setAuditDetailEntry(null)} className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const roleCounts = ["admin", "staff", "responder", "resident"].map((role) => ({
      role,
      count: users.filter((user) => user.role === role).length,
    }));
    const roleConfig = {
      admin: { color: "bg-blue-600", lightBg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "🛡️", desc: "Full system authority including user management, incident verification, and system configuration." },
      staff: { color: "bg-emerald-600", lightBg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "📋", desc: "Handles validation and monitoring of assigned agency incident reports." },
      responder: { color: "bg-orange-500", lightBg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: "🚨", desc: "Field units responsible for incident response and real-time status updates." },
      resident: { color: "bg-yellow-500", lightBg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: "👤", desc: "Community users who submit incident reports and receive updates." },
    };
    const workflow = [
      { label: "Pending", body: "Newly submitted reports awaiting verification and validation.", color: "bg-orange-500", ring: "ring-orange-100", num: "01" },
      { label: "Verified", body: "Confirmed incidents approved for assignment and dispatch.", color: "bg-blue-500", ring: "ring-blue-100", num: "02" },
      { label: "Active", body: "Currently being handled by assigned responders with live updates enabled.", color: "bg-emerald-500", ring: "ring-emerald-100", num: "03" },
      { label: "Resolved", body: "Incident successfully completed and archived in system logs.", color: "bg-slate-700", ring: "ring-slate-200", num: "04" },
    ];
    const systemCards = [
      { label: "API Base URL", value: apiBase, sub: "Used by authenticated admin requests", icon: "🔗" },
      { label: "Socket Room", value: "admin", sub: "Real-time incident and status updates", icon: "📡" },
      { label: "Signed-in Admin", value: storedUser.fullName || "Admin", sub: storedUser.email || "Current browser session", icon: "👤" },
      { label: "Tracked Records", value: `${reports.length} incidents · ${users.length} users`, sub: "Loaded into this dashboard session", icon: "📊" },
    ];
    const realtimeFeatures = [
      { text: "Admin dashboard is connected to Socket Room: admin", icon: "🔌" },
      { text: "Incident updates are broadcast instantly across all active users", icon: "📢" },
      { text: "Agency dashboards receive only relevant assigned incident data", icon: "🏢" },
      { text: "Status changes propagate in real time without refresh delays", icon: "⚡" },
      { text: "System ensures continuous live monitoring and coordination", icon: "🔄" },
    ];
    const shortcuts = [
      { label: "View Active Incidents", desc: "Monitor and manage all current reports", icon: "📍", action: () => setActiveNav("incidents") },
      { label: "User Management Console", desc: "Create, edit, and manage user accounts", icon: "👤", action: () => setActiveNav("users") },
      { label: "Audit Trail & Logs", desc: "Review system activity and change history", icon: "📜", action: () => setActiveNav("audit") },
      { label: "Export Incident Reports", desc: "Download complete CSV report archive", icon: "📤", action: () => {} },
      { label: "System Health Diagnostics", desc: "Check connectivity and service status", icon: "🧪", action: () => {} },
    ];

    return (
      <div style={{ fontFamily: "'Inter', 'Manrope', system-ui, sans-serif" }} className="space-y-6">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-red-500">Admin Settings</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900" style={{ letterSpacing: "-0.02em" }}>
                System Control & Configuration
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] font-normal leading-relaxed text-slate-500">
                Manage system access, incident workflows, and real-time monitoring configuration.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={refreshAdminData}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                </svg>
                {isRefreshing ? "Refreshing…" : "Refresh Data"}
              </button>
              <CsvExportButton reports={reports} />
            </div>
          </div>
        </section>

        {/* ── System Info Cards ────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {systemCards.map((card) => (
            <div key={card.label} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
                <span className="text-lg">{card.icon}</span>
              </div>
              <p className="mt-3 text-[15px] font-semibold text-slate-900 break-words leading-snug">{card.value}</p>
              <p className="mt-1.5 text-[13px] font-normal leading-relaxed text-slate-500">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Access Control + Workflow ────────────────────────────────── */}
        <div className="grid gap-5 xl:grid-cols-2">
          {/* Access Control */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">👥</span>
                  <h3 className="text-[15px] font-bold text-slate-900">Access Control Overview</h3>
                </div>
                <p className="mt-1.5 text-[13px] font-normal leading-relaxed text-slate-500">Role distribution summary</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Role Based
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {roleCounts.map((item) => {
                const cfg = roleConfig[item.role];
                return (
                  <div key={item.role} className={`rounded-xl border ${cfg.border} ${cfg.lightBg} p-4 transition-all hover:shadow-sm`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.color} text-white text-sm`}>
                        {item.count}
                      </div>
                      <p className="text-[13px] font-semibold capitalize text-slate-700">{item.role === "responder" ? "Responders" : item.role === "resident" ? "Residents" : item.role === "admin" ? "Admin" : "Staff"}</p>
                    </div>
                    <p className="mt-2.5 text-[12px] font-normal leading-relaxed text-slate-500">{cfg.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Incident Workflow Pipeline */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚦</span>
              <h3 className="text-[15px] font-bold text-slate-900">Incident Workflow Pipeline</h3>
            </div>
            <p className="mt-1.5 text-[13px] font-normal leading-relaxed text-slate-500">
              Official status path used by the admin and agency dashboards.
            </p>

            <div className="mt-6 space-y-0">
              {workflow.map((step, index) => (
                <div key={step.label} className="relative flex gap-4">
                  {/* Stepper line + dot */}
                  <div className="flex flex-col items-center">
                    <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full ${step.color} text-[12px] font-bold text-white ring-4 ${step.ring}`}>
                      {step.num}
                    </div>
                    {index < workflow.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-200" />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`pb-6 ${index === workflow.length - 1 ? "pb-0" : ""}`}>
                    <p className="text-[14px] font-semibold text-slate-900 mt-1.5">{step.label}</p>
                    <p className="mt-1 text-[13px] font-normal leading-relaxed text-slate-500">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <span className="mt-0.5 text-sm">📡</span>
              <p className="text-[12px] font-medium leading-relaxed text-slate-500">
                All workflow stages are synchronized in real time across Admin and Agency dashboards.
              </p>
            </div>
          </section>
        </div>

        {/* ── Real-Time System Behavior ─────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-900 px-6 py-5">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">⚡</span>
              <h3 className="text-[15px] font-bold text-white">Real-Time System Behavior</h3>
            </div>
            <p className="mt-1.5 text-[13px] font-normal leading-relaxed text-slate-400">
              Live monitoring and synchronization across all connected dashboards.
            </p>
          </div>
          <div className="divide-y divide-slate-100 px-6">
            {realtimeFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 py-3.5">
                <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-sm border border-slate-200">{feature.icon}</span>
                <p className="text-[13px] font-medium leading-snug text-slate-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Maintenance Shortcuts ─────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🛠️</span>
            <h3 className="text-[15px] font-bold text-slate-900">Maintenance Shortcuts</h3>
          </div>
          <p className="text-[13px] font-normal leading-relaxed text-slate-500 mb-5">
            Quick administrative tools for system control.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="group flex items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm active:scale-[0.99]"
              >
                <span className="mt-0.5 shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-base group-hover:bg-slate-200 transition-colors">{item.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800 group-hover:text-slate-900">{item.label}</p>
                  <p className="mt-1 text-[12px] font-normal leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── System Summary ───────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🧭</span>
            <h3 className="text-[15px] font-bold text-slate-900">System Summary</h3>
          </div>
          <p className="max-w-3xl text-[14px] font-normal leading-relaxed text-slate-500">
            A centralized emergency incident management dashboard designed for real-time reporting and response coordination,
            multi-role operational control, transparent monitoring and auditing, and fast decision-making during critical events.
          </p>
          <p className="mt-3 text-[12px] font-medium text-slate-400">
            Built for public safety efficiency, reliability, and real-time situational awareness.
          </p>
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
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {isSidebarOpen && (
        <button className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu" />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-[#052e16] text-white border-r border-emerald-900 transition-all duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0 shadow-xl lg:shadow-none"}`}>
        <div className="flex h-20 shrink-0 items-center gap-4 px-5 border-b border-emerald-800/50">
          <img src="/logo.png" alt="Alerto Calbayog" className="h-10 w-10 shrink-0 object-contain" />
          <div className="flex flex-col whitespace-nowrap">
            <p className="text-base font-black tracking-tight text-white">Alerto Calbayog</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/80">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden p-3 mt-2">
          <p className="px-3 mb-3 text-[10px] font-black uppercase tracking-widest text-emerald-400/80">Menu</p>
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`relative flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left text-sm font-bold transition-all duration-200 ${isActive ? "bg-emerald-900 text-white shadow-sm shadow-emerald-900/50" : "text-emerald-100/70 hover:bg-emerald-900/50 hover:text-white"}`}
              >
                {isActive && <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-emerald-400" />}
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-emerald-400/70"}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-emerald-800/50">
          <button onClick={logout} className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left text-sm font-bold text-emerald-100/70 transition-colors hover:bg-red-500/10 hover:text-red-400 group">
            <LogOut className="h-5 w-5 shrink-0 text-emerald-400/70 group-hover:text-red-400" />
            <span className="whitespace-nowrap">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between gap-4 bg-white px-4 lg:px-8 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="shrink-0 rounded-lg p-2 lg:hidden hover:bg-slate-50" aria-label="Open menu">
              <Menu className="h-5 w-5 text-slate-700" />
            </button>
            <h1 className="text-xl font-black text-slate-900 hidden sm:block">
              {NAV.find((item) => item.id === activeNav)?.label || "Dashboard"} Overview
            </h1>
          </div>

          <div className="flex flex-1 items-center justify-end gap-6">
            <div className="hidden max-w-sm flex-1 sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-lg bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-500/20 border border-slate-100"
                />
              </div>
            </div>
            
            <div className="flex shrink-0 items-center gap-5">
              <button onClick={() => setActiveNav("notifications")} className="relative rounded-lg bg-slate-50 p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 border border-slate-100">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-50" />
                )}
              </button>
              <div className="flex items-center gap-3 border-l border-slate-100 pl-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                  {storedUser.fullName?.charAt(0) || "A"}
                </div>
                <div className="hidden flex-col sm:flex">
                  <p className="text-sm font-black text-slate-900">{storedUser.fullName || "Robert Burner"}</p>
                  <p className="text-[10px] font-bold text-slate-500">{storedUser.email || "robert.burner@gmail.com"}</p>
                </div>
              </div>
            </div>
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
