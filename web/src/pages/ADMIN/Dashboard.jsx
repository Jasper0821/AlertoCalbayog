
const XCircle = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "h-5 w-5"}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
);
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  ArchiveIcon,
  AuditIcon as ClipboardList,
  SettingsIcon as Settings,
  BellIcon as Bell,
  SearchIcon as Search,
  LogoutIcon as LogOut,
  MenuIcon as Menu,
  ResponderIcon
} from "./icons.jsx";
import api from "../../api/axios.js";
import socket from "../../api/socket.js";
import Swal from "sweetalert2";
import { getValidCalbayogBarangay } from "../../utils/barangays.js";
import { formatLocationForTable } from "../../utils/incidentFormatters.js";
import { clearDashboardNavigationState } from "../../utils/dashboardSession.js";
import AdminQueuingSystem from "./AdminQueuingSystem.jsx";

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (_) {
    try {
      ["adminNotifications", "adminUsers", "adminReports", "adminAuditTab"].forEach((k) => {
        if (k !== key) {
          localStorage.removeItem(k);
        }
      });
      let dataToSet = value;
      if (typeof value === "string" && value.startsWith("[")) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 5) {
            dataToSet = JSON.stringify(parsed.slice(0, 5));
          }
        } catch (e) {}
      }
      localStorage.setItem(key, dataToSet);
    } catch (e) {
      // Silently catch to prevent crashing React component render tree
    }
  }
};

const STATUS_STYLES = {
  pending: { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Pending" },
  verified: { dot: "bg-teal-500", text: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200", label: "Verified" },
  responding: { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", label: "Responding" },
  active: { dot: "bg-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", label: "Active" },
  resolved: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Resolved" },
  responded: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Responded" },
  closed: { dot: "bg-slate-600", text: "text-slate-700", bg: "bg-slate-200", border: "border-slate-400", label: "Closed" },
  rejected: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "Rejected" },
};

const TYPE_LABELS = {
  fire: "Fire",
  flood: "Flood",
  emergency: "Others",
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
  Crime: "#7c3aed",
  Medical: "#059669",
  Others: "#64748b",
};

const PIE_COLORS = ["#f59e0b", "#0d9488", "#2563eb", "#059669", "#64748b", "#4f46e5"];

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "queuing", label: "Queuing System", icon: Menu },
  { id: "closed-incidents", label: "Closed Cases", icon: ArchiveIcon },
  { id: "rejected-incidents", label: "Rejected Reports", icon: XCircle },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "users", label: "User Management", icon: Users },
  { id: "responder-approvals", label: "Responder Approvals", icon: ResponderIcon },
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
  return formatLocationForTable(report?.location, report);
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
  // Use the barangay field directly from the DB report
  if (report?.location?.barangay) {
    const bgy = report.location.barangay.trim();
    if (bgy && bgy.toLowerCase() !== "unknown" && bgy.toLowerCase() !== "unspecified" && bgy.toLowerCase() !== "district") return bgy;
  }
  // Fall back to location name string
  if (typeof report?.location === "string" && report.location.trim()) {
    const cleaned = report.location.replace(/,?\s*brgy\.?\s*district,?/gi, "").replace(/,?\s*district,?/gi, "").trim();
    if (cleaned) return cleaned;
  }
  if (report?.location?.name) {
    const cleaned = report.location.name.replace(/,?\s*brgy\.?\s*district,?/gi, "").replace(/,?\s*district,?/gi, "").trim();
    if (cleaned) return cleaned;
  }
  // Fall back to street if that's all we have
  if (report?.location?.street) {
    return report.location.street.trim();
  }
  return null;
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
      <div className="mb-4 shrink-0">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        {subtitle && <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(() => localStorage.getItem("adminActiveNav") || "overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("system-info");
  const [activeCategories, setActiveCategories] = useState({
    fire: true,
    flood: true,
    crime: true,
    medical: true,
    others: true
  });
  const [notificationsConfig, setNotificationsConfig] = useState({
    soundAlerts: true,
    desktopNotif: true,
    smsAlerts: false,
    residentPush: true,
    radius: "5"
  });
  const [locationConfig, setLocationConfig] = useState({
    refreshRate: 10,
    lat: "12.0674",
    lng: "124.5946",
    provider: "osm",
    zoom: 13
  });
  const [securityConfig, setSecurityConfig] = useState({
    complexPassword: true,
    sessionTimeout: 60
  });
  const [backupConfig, setBackupConfig] = useState({
    interval: "weekly",
    retention: "12"
  });
  const [serverBackups, setServerBackups] = useState([]);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [deletedReports, setDeletedReports] = useState([]);
  const [isFetchingDeleted, setIsFetchingDeleted] = useState(false);
  // Analytics and incident lists are populated from the database API only.
  // Do not seed these with browser-cached reports, which can be stale.
  const [reports, setReports] = useState([]);
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
      safeSetItem("adminSessionId", sid);
    }
    return sid;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [userCategoryFilter, setUserCategoryFilter] = useState("all");
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [agencyCategories, setAgencyCategories] = useState(["BFP", "CDRRMO", "PNP"]);
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState("");
  const [isSavingAgency, setIsSavingAgency] = useState(false);
  const [error, setError] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingReportId, setSavingReportId] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  // Audit Trail state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTab, setAuditTab] = useState("user_activity"); // "status" | "user_activity" | "password_security"
  const [auditSearch, setAuditSearch] = useState("");
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [auditDateTo, setAuditDateTo] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditDetailEntry, setAuditDetailEntry] = useState(null);
  // Closed incidents filters
  const [closedAgencyFilter, setClosedAgencyFilter] = useState("all");
  const [closedTypeFilter, setClosedTypeFilter] = useState("all");
  const [closedDateFilter, setClosedDateFilter] = useState("");
  // Rejected reports filters
  const [rejectedDateFilter, setRejectedDateFilter] = useState("");

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
  };

  const fetchUsers = async () => {
    const response = await api.get("/users");
    const data = Array.isArray(response.data) ? response.data : [];
    setUsers(data);
    safeSetItem("adminUsers", JSON.stringify(data));
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications/me");
      const data = Array.isArray(response.data.notifications)
        ? response.data.notifications
        : response.data || [];
      const next = data.slice(0, 20).map((item) => ({
        id: item._id || item.id || `${Date.now()}`,
        _id: item._id || null,
        title: item.title || "Notification",
        message: item.message || "You have a new notification.",
        createdAt: item.createdAt || new Date().toISOString(),
        read: item.read || false,
        type: item.type || "system_event",
        category: item.category || "system",
        metadata: item.metadata || {},
      }));
      setNotifications(next);
      safeSetItem("adminNotifications", JSON.stringify(next));
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
      params.set("limit", "1000");
      const res = await api.get(`/audit?${params.toString()}`);
      setAuditLogs(res.data.logs || []);
      setAuditTotal(res.data.total || 0);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  // Session timeout timer ref so we can clear it on re-save
  const sessionTimerRef = useRef(null);
  const sessionWarnRef = useRef(null);

  const scheduleSessionTimeout = (minutes) => {
    // Clear any existing timers
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (sessionWarnRef.current) clearTimeout(sessionWarnRef.current);
    if (!minutes || minutes <= 0) return;

    const totalMs = minutes * 60 * 1000;
    const warnMs = totalMs - 2 * 60 * 1000; // warn 2 min before

    if (warnMs > 0) {
      sessionWarnRef.current = setTimeout(() => {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "warning",
          title: "Session expiring in 2 minutes",
          text: "You will be automatically logged out soon due to inactivity timeout.",
          showConfirmButton: false,
          timer: 10000,
          timerProgressBar: true,
        });
      }, warnMs);
    }

    sessionTimerRef.current = setTimeout(() => {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Your session has timed out for security. You will be logged out now.",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "OK",
        allowOutsideClick: false,
      }).then(() => {
        localStorage.clear();
        navigate("/login");
      });
    }, totalMs);
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get("/settings");
      if (response.data) {
        if (response.data.backupConfig) setBackupConfig(response.data.backupConfig);
        if (response.data.locationConfig) setLocationConfig(response.data.locationConfig);
        if (response.data.securityConfig) {
          setSecurityConfig(response.data.securityConfig);
          // Apply session timeout from DB value
          scheduleSessionTimeout(response.data.securityConfig.sessionTimeout);
        }
        if (response.data.notificationsConfig) setNotificationsConfig(response.data.notificationsConfig);
        if (response.data.activeCategories) setActiveCategories(response.data.activeCategories);
        if (Array.isArray(response.data.customAgencies)) setAgencyCategories(response.data.customAgencies);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "Could not load system settings",
        text: "Using default values. Check your connection.",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
    }
  };

  const saveSettings = async (key, value) => {
    try {
      await api.post("/settings", { key, value });
      // If saving securityConfig, re-schedule the session timer with new value
      if (key === "securityConfig" && value.sessionTimeout) {
        scheduleSessionTimeout(value.sessionTimeout);
      }
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Settings saved successfully",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to save settings",
        text: err.response?.data?.message || err.message,
      });
    }
  };

  const fetchServerBackups = async () => {
    try {
      const response = await api.get("/backup/list");
      setServerBackups(response.data);
    } catch (err) {
      console.error("Failed to load server backups:", err);
    }
  };

  const handleRestoreUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);

        if (!backupData.version || !backupData.collections) {
          throw new Error("Invalid backup file format. Missing collections or version metadata.");
        }

        Swal.fire({
          title: "Restore Database",
          html: "<div class='text-left text-xs space-y-2'><p class='font-semibold text-red-600'>WARNING: This will wipe all current incidents, messages, tracking logs, and users (except your active admin account) and replace them with the backup data!</p><p>Are you sure you want to proceed?</p></div>",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc2626",
          confirmButtonText: "Yes, restore now",
          cancelButtonText: "Cancel"
        }).then(async (result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: "Restoring database...",
              html: "Wiping existing schemas and importing backup documents. Please wait...",
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });

            try {
              const response = await api.post("/backup/restore/upload", { backupData });

              Swal.fire({
                title: "Restore Successful",
                text: response.data.message || "Database successfully restored.",
                icon: "success",
                confirmButtonColor: "#dc2626"
              }).then(() => {
                window.location.reload();
              });
            } catch (err) {
              Swal.fire({
                title: "Restore Failed",
                text: err.response?.data?.message || err.message,
                icon: "error",
                confirmButtonColor: "#dc2626"
              });
            }
          }
        });

      } catch (err) {
        Swal.fire({
          title: "Invalid Backup File",
          text: err.message,
          icon: "error",
          confirmButtonColor: "#dc2626"
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRestoreFromFile = (filename) => {
    Swal.fire({
      title: "Restore from Server Backup",
      html: `<div class='text-left text-xs space-y-2'><p class='font-semibold text-red-600'>WARNING: This will overwrite your current database with the backup file <strong>${filename}</strong>!</p><p>Are you sure you want to proceed?</p></div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, restore now",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Restoring database...",
          html: `Importing data from ${filename}. Please wait...`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          const response = await api.post(`/backup/restore/file/${filename}`);

          Swal.fire({
            title: "Restore Successful",
            text: response.data.message || "Database successfully restored.",
            icon: "success",
            confirmButtonColor: "#dc2626"
          }).then(() => {
            window.location.reload();
          });
        } catch (err) {
          Swal.fire({
            title: "Restore Failed",
            text: err.response?.data?.message || err.message,
            icon: "error",
            confirmButtonColor: "#dc2626"
          });
        }
      }
    });
  };

  const handleDownloadServerBackup = async (filename) => {
    try {
      const response = await api.get(`/backup/download/${filename}`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      Swal.fire({
        title: "Download Failed",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#dc2626"
      });
    }
  };

  const handleDeleteServerBackup = (filename) => {
    Swal.fire({
      title: "Delete Backup File",
      text: `Are you sure you want to permanently delete the backup file "${filename}" from the server?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/backup/${filename}`);
          await fetchServerBackups();
          Swal.fire({
            title: "Deleted",
            text: "Backup file deleted successfully from server.",
            icon: "success",
            confirmButtonColor: "#dc2626"
          });
        } catch (err) {
          Swal.fire({
            title: "Delete Failed",
            text: err.response?.data?.message || err.message,
            icon: "error",
            confirmButtonColor: "#dc2626"
          });
        }
      }
    });
  };

  const handleBackup = async () => {
    Swal.fire({
      title: "Creating Backup...",
      text: "Generating JSON archive and saving to server...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await api.get("/backup/export");
      const backupData = response.data;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `alerto_backup_manual_${timestamp}.json`;

      const url = window.URL.createObjectURL(new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      await fetchServerBackups();

      Swal.fire({
        title: "Backup Created",
        text: "Database backup created and downloaded successfully.",
        icon: "success",
        confirmButtonColor: "#dc2626"
      });
    } catch (err) {
      Swal.fire({
        title: "Backup Failed",
        text: err.response?.data?.message || err.message,
        icon: "error",
        confirmButtonColor: "#dc2626"
      });
    }
  };

  useEffect(() => {
    if (activeSettingsTab === "backup-data") {
      fetchServerBackups();
    }
  }, [activeSettingsTab]);

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([fetchReports(), fetchUsers(), fetchNotifications(), fetchSettings()]);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load admin data");
      }
    };
    load();
  }, []);

  useEffect(() => {
    safeSetItem("adminActiveNav", activeNav);
  }, [activeNav]);

  useEffect(() => {
    safeSetItem("adminAuditTab", auditTab);
  }, [auditTab]);

  useEffect(() => {
    safeSetItem("adminUsers", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    safeSetItem("adminNotifications", JSON.stringify(notifications));
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
              _id: notification._id || null,
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
          safeSetItem("adminNotifications", JSON.stringify(next));
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

        // --- Sound alert (respects notificationsConfig.soundAlerts) ---
        if (notificationsConfig.soundAlerts) {
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.15);
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.30);
            gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.6);
          } catch (_) { /* AudioContext unavailable */ }
        }

        // --- Desktop push notification (respects notificationsConfig.desktopNotif) ---
        if (notificationsConfig.desktopNotif && "Notification" in window) {
          const sendDesktopNotif = () => {
            new Notification("🚨 New Emergency Alert", {
              body: `${(report.emergencyType || "Incident").toUpperCase()} reported at ${report.location?.name || report.location?.barangay || "unknown location"}.`,
              icon: "/logo.png",
              tag: report._id || "emergency",
            });
          };
          if (Notification.permission === "granted") {
            sendDesktopNotif();
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((perm) => {
              if (perm === "granted") sendDesktopNotif();
            });
          }
        }
      });

      socket.on("reportStatusChanged", (report) => {
        upsertReport(report);
      });

      socket.on("reportDeleted", ({ id }) => {
        setReports((prev) => prev.filter((report) => report._id !== id));
      });
    };

    connectSocket();

    return () => {
      socket.off("notification");
      socket.off("newEmergencyAlert");
      socket.off("reportStatusChanged");
      socket.off("reportDeleted");
      socket.disconnect();
      // Clean up session timeout timers
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (sessionWarnRef.current) clearTimeout(sessionWarnRef.current);
    };
  }, [sessionId, storedUser.id]);

  const responders = useMemo(() => users.filter((user) => user.role === "responder"), [users]);

  const filteredUsers = useMemo(() => {
    // Only show responders in User Management if they are explicitly approved
    const activeUsers = users.filter(
      (u) => u.role !== "responder" || u.status === "approved"
    );
    return userCategoryFilter === "all"
      ? activeUsers
      : activeUsers.filter((user) => (user.role || "resident").toLowerCase() === userCategoryFilter);
  }, [userCategoryFilter, users]);

  // Calculate available years from closed reports
  const closedYearOptions = useMemo(() => {
    const years = new Set(reports
      .filter(r => (r.status || "").toLowerCase() === "closed")
      .map(r => new Date(r.createdAt).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [reports]);

  const rejectedYearOptions = useMemo(() => {
    const years = new Set(reports
      .filter(r => (r.status || "").toLowerCase() === "rejected")
      .map(r => new Date(r.createdAt).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [reports]);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports.filter((report, index) => {
      const status = (report.status || "pending").toLowerCase();
      if (!["pending", "verified", "responding", "active", "ongoing", "en_route", "dispatching"].includes(status)) return false;
      const incidentId = getIncidentId(report, index).toLowerCase();
      const haystack = [
        incidentId,
        report.emergencyType,
        report.userId?.fullName,
        report.assignedResponder?.fullName,
        getLocation(report),
      ].join(" ").toLowerCase();

      if (agencyFilter !== "all" && !(report.notifiedAgencies || []).includes(agencyFilter)) return false;
      if (q && !haystack.includes(q)) return false;
      return true;
    });
  }, [agencyFilter, reports, searchQuery]);

  const closedReports = useMemo(() => {
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

      if (status !== "closed") return false;
      if (closedAgencyFilter !== "all" && !(report.notifiedAgencies || []).includes(closedAgencyFilter)) return false;
      if (closedTypeFilter !== "all" && (report.emergencyType || "").toLowerCase() !== closedTypeFilter) return false;
      
      // Apply single date filter
      if (closedDateFilter) {
        const reportDate = new Date(report.createdAt);
        const selectedDate = new Date(closedDateFilter);
        const selectedDateStart = new Date(selectedDate);
        const selectedDateEnd = new Date(selectedDate);
        selectedDateStart.setHours(0, 0, 0, 0);
        selectedDateEnd.setHours(23, 59, 59, 999);
        if (reportDate < selectedDateStart || reportDate > selectedDateEnd) return false;
      }
      
      if (q && !haystack.includes(q)) return false;
      return true;
    });
  }, [closedAgencyFilter, closedTypeFilter, closedDateFilter, reports, searchQuery]);

  const rejectedReports = useMemo(() => {
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

      if (status !== "rejected") return false;
      if (agencyFilter !== "all" && !(report.notifiedAgencies || []).includes(agencyFilter)) return false;
      
      // Apply single date filter
      if (rejectedDateFilter) {
        const reportDate = new Date(report.createdAt);
        const selectedDate = new Date(rejectedDateFilter);
        const selectedDateStart = new Date(selectedDate);
        const selectedDateEnd = new Date(selectedDate);
        selectedDateStart.setHours(0, 0, 0, 0);
        selectedDateEnd.setHours(23, 59, 59, 999);
        if (reportDate < selectedDateStart || reportDate > selectedDateEnd) return false;
      }
      
      if (q && !haystack.includes(q)) return false;
      return true;
    });
  }, [agencyFilter, rejectedDateFilter, reports, searchQuery]);


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
      barangays: mapToChartData(barangayMap).sort((a, b) => b.value - a.value),
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

  const fetchDeletedReports = async () => {
    setIsFetchingDeleted(true);
    try {
      const response = await api.get("/emergency/deleted");
      setDeletedReports(response.data || []);
    } catch (err) {
      console.error("Failed to load deleted reports:", err);
    } finally {
      setIsFetchingDeleted(false);
    }
  };

  const handleRestoreReport = async (reportId) => {
    try {
      const response = await api.post(`/emergency/${reportId}/restore`);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: response.data.message || "Report restored successfully",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      setDeletedReports((prev) => prev.filter((r) => r._id !== reportId));
      const restoredReport = response.data.report;
      setReports((prev) => prev.some((r) => r._id === restoredReport._id)
        ? prev.map((r) => r._id === restoredReport._id ? restoredReport : r)
        : [restoredReport, ...prev]
      );
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to restore report",
        text: err.response?.data?.message || err.message,
      });
    }
  };

  const exportDeletedReportsCSV = () => {
    if (deletedReports.length === 0) return;
    const headers = [
      "Incident ID", "Emergency Type", "Reporter Name", "Reporter Phone",
      "Reporter Email", "Location Name", "Barangay", "Street",
      "Latitude", "Longitude", "Status Before Delete", "Notified Agencies",
      "Assigned Responder", "Report Date", "Deleted Date",
    ];
    const escape = (val) => {
      if (val == null) return "";
      const s = String(val).replace(/"/g, '""');
      return (s.includes(",") || s.includes('"') || s.includes("\n")) ? `"${s}"` : s;
    };
    const rows = deletedReports.map((r, i) => [
      escape(getIncidentId(r, i)),
      escape(r.emergencyType || ""),
      escape(r.userId?.fullName || "Unknown"),
      escape(r.userId?.phoneNumber || ""),
      escape(r.userId?.email || ""),
      escape(r.location?.name || ""),
      escape(r.location?.barangay || ""),
      escape(r.location?.street || ""),
      escape(r.location?.latitude ?? ""),
      escape(r.location?.longitude ?? ""),
      escape(r.status || ""),
      escape((r.notifiedAgencies || []).join("; ")),
      escape(r.assignedResponder?.fullName || "Unassigned"),
      escape(r.createdAt ? new Date(r.createdAt).toLocaleString() : ""),
      escape(r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ""),
    ].join(","));
    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alerto_deleted_reports_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportUsersCSV = (usersList) => {
    if (!usersList || usersList.length === 0) return;
    const headers = [
      "User ID", "Full Name", "Email Address", "Phone Number",
      "Role/Category", "Agency", "Status", "Created Date"
    ];
    const escape = (val) => {
      if (val == null) return "";
      const s = String(val).replace(/"/g, '""');
      return (s.includes(",") || s.includes('"') || s.includes("\n")) ? `"${s}"` : s;
    };
    const rows = usersList.map((user) => [
      escape(user._id || ""),
      escape(user.fullName || ""),
      escape(user.email || ""),
      escape(user.phoneNumber || ""),
      escape(user.role || "resident"),
      escape(user.agency || "N/A"),
      escape(user.status || "active"),
      escape(user.createdAt ? new Date(user.createdAt).toLocaleString() : "")
    ].join(","));
    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alerto_users_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportReportsCSV = (reportsList) => {
    const rows = [
      ["Incident ID", "Emergency Type", "Agency Type", "Reporter", "Location", "Status", "Assigned Responder", "Created At"],
      ...reportsList.map((report, index) => [
        getIncidentId(report, index),
        TYPE_LABELS[report.emergencyType] || report.emergencyType || "Incident",
        report.assignedAgency && report.assignedAgency !== "NONE" ? report.assignedAgency : (report.notifiedAgencies || []).join("; "),
        report.userId?.fullName || "Unknown",
        getLocation(report),
        report.status || "pending",
        report.assignedResponder?.fullName || "Unassigned",
        report.createdAt || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alerto-incidents-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openExportDialog = async () => {
    const result = await Swal.fire({
      title: "Export data",
      text: "Choose the data you want to export.",
      input: "select",
      inputOptions: {
        incidents: "Incident Reports",
        users: "Users",
      },
      inputValue: "incidents",
      showCancelButton: true,
      confirmButtonText: "Export",
      confirmButtonColor: "#059669",
      inputValidator: (value) => !value && "Select data to export",
    });
    if (!result.isConfirmed) return;
    if (result.value === "users") exportUsersCSV(users);
    else exportReportsCSV(reports);
  };

  const deleteReport = async (reportId) => {
    const shouldDelete = window.confirm(
      "⚠️ Delete this incident report?\n\nThis report will be moved to the Trash Bin and can be restored later."
    );
    if (!shouldDelete) return;
    setError("");
    try {
      await api.delete(`/emergency/${reportId}`);
      setReports((prev) => prev.filter((report) => report._id !== reportId));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete report");
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    setSavingReportId(reportId);
    setError("");
    try {
      let response;
      try {
        response = await api.put(`/emergency/${reportId}`, { status: newStatus });
      } catch {
        response = await api.put(`/reports/${reportId}/status`, { status: newStatus });
      }
      const updatedReport = response.data?.report || response.data;
      if (updatedReport?._id) {
        setReports((prev) => prev.map((r) => (r._id === updatedReport._id ? updatedReport : r)));
      }
      await fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update report status");
    } finally {
      setSavingReportId("");
    }
  };

  const closeReport = async (reportId) => {
    const shouldClose = window.confirm(
      "Close this incident?\n\nThis will mark the incident as officially closed. The reporter will be notified."
    );
    if (!shouldClose) return;
    await updateReportStatus(reportId, "closed");
  };

  const exportClosedReportsPDF = (reports) => {
    if (!reports || reports.length === 0) {
      alert("No closed incidents to export.");
      return;
    }

    const printWindow = window.open("", "_blank");
    
    // Build incident rows
    const rowsHtml = reports.map((r, i) => {
      const type = (r.emergencyType || "others").toUpperCase();
      const status = (r.status || "pending").toUpperCase();
      const incId = getIncidentId(r, i);
      const loc = getLocation(r) || "Unknown";
      const date = r.createdAt ? new Date(r.createdAt) : new Date();
      const dateStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const reporter = r.userId?.fullName || "Unknown";
      const agency = (r.assignedAgency && r.assignedAgency !== "NONE") 
        ? r.assignedAgency 
        : (r.notifiedAgencies || []).join(", ") || "Unassigned";
      
      return `
        <tr>
          <td>${incId}</td>
          <td>${type}</td>
          <td>${loc}</td>
          <td>${agency}</td>
          <td>${reporter}</td>
          <td>${dateStr}</td>
          <td>${status}</td>
        </tr>
      `;
    }).join("");

    const htmlContent = `
      <html>
      <head>
        <title>Alerto Calbayog - Closed Cases</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #334155;
            padding: 30px;
            margin: 0;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0a1e3f;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo {
            height: 50px;
            width: auto;
          }
          .header-title h1 {
            font-size: 24px;
            font-weight: bold;
            color: #0a1e3f;
            margin: 0;
          }
          .header-title p {
            font-size: 12px;
            color: #64748b;
            margin: 5px 0 0 0;
          }
          .report-info {
            font-size: 11px;
            color: #64748b;
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            text-align: left;
          }
          td {
            padding: 10px 12px;
            font-size: 11px;
            border: 1px solid #cbd5e1;
            color: #334155;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .summary {
            font-size: 12px;
            font-weight: bold;
            color: #0a1e3f;
            margin-bottom: 40px;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 15px;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <img src="/logo.png" alt="Alerto Calbayog" class="logo" />
            <div class="header-title">
              <h1>ALERTO CALBAYOG</h1>
              <p>Closed Cases</p>
            </div>
          </div>
          <div class="report-info">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Closed Incidents:</strong> ${reports.length}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Incident ID</th>
              <th>Type</th>
              <th>Location</th>
              <th>Agency</th>
              <th>Reporter</th>
              <th>Date & Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align:center">No incident records found.</td></tr>'}
          </tbody>
        </table>

        <div class="summary">
          Report summary: Compiled ${reports.length} closed incident records.
        </div>

        <div class="footer">
          Alerto Calbayog © ${new Date().getFullYear()} — Confidential Admin Report. All rights reserved.
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportRejectedReportsPDF = (reports) => {
    if (!reports || reports.length === 0) {
      alert("No rejected incidents to export.");
      return;
    }

    const printWindow = window.open("", "_blank");
    
    // Build incident rows
    const rowsHtml = reports.map((r, i) => {
      const type = (r.emergencyType || "others").toUpperCase();
      const status = (r.status || "pending").toUpperCase();
      const incId = getIncidentId(r, i);
      const loc = getLocation(r) || "Unknown";
      const date = r.createdAt ? new Date(r.createdAt) : new Date();
      const dateStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const reporter = r.userId?.fullName || "Unknown";
      const agency = (r.assignedAgency && r.assignedAgency !== "NONE") 
        ? r.assignedAgency 
        : (r.notifiedAgencies || []).join(", ") || "Unassigned";
      
      return `
        <tr>
          <td>${incId}</td>
          <td>${type}</td>
          <td>${loc}</td>
          <td>${agency}</td>
          <td>${reporter}</td>
          <td>${dateStr}</td>
          <td>${status}</td>
        </tr>
      `;
    }).join("");

    const htmlContent = `
      <html>
      <head>
        <title>Alerto Calbayog - Rejected Reports</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #334155;
            padding: 30px;
            margin: 0;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0a1e3f;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo {
            height: 50px;
            width: auto;
          }
          .header-title h1 {
            font-size: 24px;
            font-weight: bold;
            color: #0a1e3f;
            margin: 0;
          }
          .header-title p {
            font-size: 12px;
            color: #64748b;
            margin: 5px 0 0 0;
          }
          .report-info {
            font-size: 11px;
            color: #64748b;
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            text-align: left;
          }
          td {
            padding: 10px 12px;
            font-size: 11px;
            border: 1px solid #cbd5e1;
            color: #334155;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .summary {
            font-size: 12px;
            font-weight: bold;
            color: #0a1e3f;
            margin-bottom: 40px;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 15px;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <img src="/logo.png" alt="Alerto Calbayog" class="logo" />
            <div class="header-title">
              <h1>ALERTO CALBAYOG</h1>
              <p>Rejected Reports</p>
            </div>
          </div>
          <div class="report-info">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Rejected Reports:</strong> ${reports.length}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Incident ID</th>
              <th>Type</th>
              <th>Location</th>
              <th>Agency</th>
              <th>Reporter</th>
              <th>Date & Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align:center">No incident records found.</td></tr>'}
          </tbody>
        </table>

        <div class="summary">
          Report summary: Compiled ${reports.length} rejected incident records.
        </div>

        <div class="footer">
          Alerto Calbayog © ${new Date().getFullYear()} — Confidential Admin Report. All rights reserved.
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
    setIsUserModalOpen(true);
  };

  const openAddUserModal = (role = "resident") => {
    setEditingUserId(null);
    setUserForm({ ...emptyUserForm, role });
    setIsUserModalOpen(true);
    setError("");
  };

  const addAgencyCategory = async (event) => {
    event.preventDefault();
    const agencyName = newAgencyName.trim();
    if (!agencyName) return;

    if (agencyCategories.some((agency) => agency.toLowerCase() === agencyName.toLowerCase())) {
      setError("This agency category already exists.");
      return;
    }

    const updatedAgencies = [...agencyCategories, agencyName];
    setIsSavingAgency(true);
    setError("");
    try {
      await api.post("/settings", { key: "customAgencies", value: updatedAgencies });
      setAgencyCategories(updatedAgencies);
      setNewAgencyName("");
      setIsAgencyModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add agency category");
    } finally {
      setIsSavingAgency(false);
    }
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

  const setNotificationReadState = async (notification, read) => {
    setError("");
    const notificationId = notification._id || notification.id;
    const isSavedNotification = /^[a-f\d]{24}$/i.test(notificationId || "");
    // Update the UI immediately. Older cached/socket-only notifications may not
    // have a MongoDB id, so they cannot be sent to the API yet.
    setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read } : item));
    if (!isSavedNotification) return;
    try {
      const response = await api.put(`/notifications/${notificationId}/${read ? "read" : "unread"}`);
      const updated = response.data;
      setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: updated.read } : item));
    } catch (err) {
      // Keep the modal usable for notifications received from an older server
      // instance (for example, before the unread API route is restarted).
      // The local notification state is already updated above.
      console.warn("Notification sync failed:", err.response?.data?.message || err.message);
    }
  };

  const markAllNotificationsRead = async () => {
    setError("");
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      // Preserve the current modal state without showing a page-level error.
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      console.warn("Notification bulk sync failed:", err.response?.data?.message || err.message);
    }
  };

  const handleResponderApproval = async (userId, action) => {
    setError("");
    try {
      if (action === "approved") {
        // Approve: update status to approved → user can now log in and appears in User Management
        const response = await api.put(`/users/${userId}`, { status: "approved" });
        const updatedUser = response.data?.user;
        if (updatedUser?._id) {
          setUsers((prev) =>
            prev.map((u) => u._id === updatedUser._id ? { ...u, status: "approved" } : u)
          );
        } else {
          await fetchUsers();
        }
        void Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Responder approved",
          text: response.data?.emailMessage || "The responder can now log in.",
          showConfirmButton: false,
          timer: 3500,
          timerProgressBar: true,
          customClass: { popup: "!w-[330px] !p-3 !text-sm" },
        });
      } else if (action === "declined") {
        // Decline: permanently delete the user — removed from queue and never in User Management
        await api.delete(`/users/${userId}`);
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      }
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${action} this account. Please try again.`);
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
    { label: "Total Users", value: stats.users, sub: "All registered accounts", bg: "bg-blue-50", text: "text-blue-500", icon: Users },
    { label: "Responders", value: stats.responders, sub: "Agency responder accounts", bg: "bg-indigo-50", text: "text-indigo-500", icon: Users },
  ];

  const renderStatCards = () => (
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm shadow-slate-200/50">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.text}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-lg font-black tracking-tight text-slate-900">{stat.value}</p>
              <p className="text-[9px] font-bold text-slate-400">{stat.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderAnalytics = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {!analyticsData.hasData ? (
        <EmptyAnalytics />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 space-y-3">
          {/* Row 1: Line chart + Status Pie */}
          <div className="grid gap-3 xl:grid-cols-[1.3fr_0.7fr]">
            <AnalyticsCard title="Monthly Incident Trend" subtitle="Reports created during the latest six-month window">
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
                  <LineChart data={analyticsData.trend} margin={{ top: 8, right: 18, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="incidents" stroke={THEME.accent} strokeWidth={3} dot={{ r: 4, fill: THEME.accent }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>

            <AnalyticsCard title="Incidents by Status" subtitle="Current operational state of all reports">
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
                  <PieChart>
                    <Pie
                      data={analyticsData.statuses}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="40%"
                      outerRadius="70%"
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

          {/* Row 2: Category Bar + Barangay Bar */}
          <div className="grid gap-3 xl:grid-cols-2">
            <AnalyticsCard title="Incidents by Category" subtitle="Emergency type volume across all agencies">
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
                  <BarChart data={analyticsData.categories} margin={{ top: 8, right: 16, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} />
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

            <AnalyticsCard title="Top Barangays by Reports" subtitle="Barangays with the highest incident volume">
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
                  <BarChart
                    data={analyticsData.barangays.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} />
                    <YAxis type="category" dataKey="name" width={88} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" fill="#0f766e" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
          </div>
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="flex flex-col gap-2 h-full">
      <div className="grid grid-cols-4 gap-2 shrink-0">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.text}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 truncate">{stat.label}</p>
                <p className="text-base font-black leading-none text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {!analyticsData.hasData ? (
        <EmptyAnalytics />
      ) : (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          {/* Top Half: Charts */}
          <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
            {/* Pie */}
            <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm min-h-0 flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Incident Analysis</p>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
                  <PieChart>
                    <Pie data={analyticsData.statuses} dataKey="value" nameKey="name" innerRadius={24} outerRadius={40} paddingAngle={3}>
                      {analyticsData.statuses.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.fill || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={6} formatter={(value) => <span className="text-[8px] font-bold text-slate-600">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm min-h-0 flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">By Category</p>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
                  <BarChart data={analyticsData.categories} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 8, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 8, fontWeight: 700 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {analyticsData.categories.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill || "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trend line */}
            <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm min-h-0 flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Incident Trend</p>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 100, height: 100 }}>
                  <LineChart data={analyticsData.trend} margin={{ top: 4, right: 8, left: -26, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9, fontWeight: 700 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="incidents" stroke="#10b981" strokeWidth={2} dot={{ r: 2.5, fill: "#10b981" }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Half: Scorecard */}
          <section className="flex-1 min-h-0 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col">
            <div className="border-b border-slate-100 px-3 py-2 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-[10px] font-black text-slate-900">Incident Scorecard</h2>
                <p className="text-[8px] text-slate-400">Latest reports</p>
              </div>
              <button onClick={() => setActiveNav("incidents")} className="rounded-lg bg-emerald-500 px-2 py-1 text-[9px] font-bold text-white transition hover:bg-emerald-600">
                View All
              </button>
            </div>
            <div className="overflow-auto flex-1">
              {renderIncidentTable(filteredReports.slice(0, 2), true)}
            </div>
          </section>
        </div>
      )}
    </div>
  );

  const renderIncidentTable = (items, compact = false) => (
    <div className="overflow-x-auto">
      <table className="w-full table-auto text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <th className="px-4 py-3">Incident</th>
            <th className="px-4 py-3">Agency Type</th>
            <th className="px-4 py-3">Reporter</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Time</th>
            {!compact && <th className="px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(!items || items.length === 0) ? (
            <tr>
              <td colSpan="7" className="px-4 py-10 text-center text-sm font-semibold text-slate-400">No incidents found.</td>
            </tr>
          ) : items.map((report, index) => {
            if (!report) return null;
            const status = (report.status || "pending").toLowerCase();
            const statusInfo = getStatusInfo(status);
            const availableResponders = responders.filter((responder) =>
              (report.notifiedAgencies || []).includes(responder.agency)
            );

            return (
              <tr key={report._id || index} className="text-sm text-slate-700 hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <p className="font-mono text-xs font-black text-slate-900">{getIncidentId(report, index)}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">Emergency: {TYPE_LABELS[report.emergencyType] || "Incident"}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-bold text-slate-700">
                    {report.assignedAgency && report.assignedAgency !== "NONE"
                      ? report.assignedAgency
                      : (report.notifiedAgencies || []).join(", ") || "Unassigned"}
                  </p>
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
                  <p className="text-xs font-bold text-slate-700">
                    {report.createdAt ? new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                  </p>
                  {!compact && (
                    <p className="text-[10px] text-slate-400">
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ""}
                    </p>
                  )}
                </td>
                {renderIncidentActions(report, index, compact)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Action buttons rendered outside the table row to avoid colSpan issues
  const renderIncidentActions = (report, index, compact) => {
    if (compact) return null;
    const status = (report.status || "").toLowerCase();
    const isResolved = ["resolved", "responded"].includes(status);
    const isClosed = ["closed", "cancelled"].includes(status);
    const isSaving = savingReportId === report._id;
    return (
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedReport({ report, index })}
            title="View incident details"
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-black text-blue-700 transition hover:bg-blue-100 active:scale-[0.98]"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12S5.25 6.75 12 6.75 21.75 12 21.75 12 18.75 17.25 12 17.25 2.25 12 2.25 12Z" /><circle cx="12" cy="12" r="2.25" /></svg>
            View
          </button>
          {isResolved && !isClosed && (
            <button
              id={`close-report-${report._id}`}
              disabled={isSaving}
              onClick={() => closeReport(report._id)}
              title="Close this resolved incident"
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {isSaving ? "Closing..." : "Close"}
            </button>
          )}
          <button
            id={`delete-report-${report._id}`}
            onClick={() => deleteReport(report._id)}
            title="Delete this report (mistake/dummy)"
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-black text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete
          </button>
        </div>
      </td>
    );
  };

  const renderIncidents = (type = "active") => {
    let displayReports;
    let title;
    let description;
    const isRejected = type === "rejected";

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
    return (
      <section className={`flex flex-col h-full rounded-xl border shadow-md shadow-slate-200/50 ${isRejected ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-white"}`}>
        <div className={`flex-none flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between ${isRejected ? "border-red-100 bg-red-50/70" : "border-slate-100"}`}>
          <div>
            <h2 className="text-sm font-black text-slate-900">
              {title}
            </h2>
            <p className="text-xs text-slate-500">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {type === "closed" ? (
              <>
                <select
                  value={closedAgencyFilter}
                  onChange={(event) => setClosedAgencyFilter(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none shadow-md transition hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-600/10"
                >
                  <option value="all">All Agencies</option>
                  <option value="CDRRMO">CDRRMO</option>
                  <option value="PNP">PNP</option>
                  <option value="BFP">BFP</option>
                </select>

                <select
                  value={closedTypeFilter}
                  onChange={(event) => setClosedTypeFilter(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none shadow-md transition hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-600/10"
                >
                  <option value="all">All Types</option>
                  <option value="fire">Fire</option>
                  <option value="flood">Flood</option>
                  <option value="crime">Crime</option>
                  <option value="medical">Medical</option>
                  <option value="emergency">Others</option>
                </select>

                <input
                  type="date"
                  value={closedDateFilter}
                  onChange={(event) => setClosedDateFilter(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none shadow-md transition hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-600/10"
                  title="Filter closed cases by selected date"
                />

                <button
                  type="button"
                  onClick={() => exportClosedReportsPDF(displayReports)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 3v11m0 0l4-4m-4 4l-4-4M5 21h14" />
                  </svg>
                  Export PDF
                </button>
              </>
            ) : isRejected ? (
              <>
                <select value={agencyFilter} onChange={(event) => setAgencyFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none shadow-md transition hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-600/10">
                  <option value="all">All agencies</option>
                  <option value="CDRRMO">CDRRMO</option>
                  <option value="PNP">PNP</option>
                  <option value="BFP">BFP</option>
                </select>

                <input
                  type="date"
                  value={rejectedDateFilter}
                  onChange={(event) => setRejectedDateFilter(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none shadow-md transition hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-600/10"
                  title="Filter rejected reports by selected date"
                />

                <button
                  type="button"
                  onClick={() => exportRejectedReportsPDF(displayReports)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 3v11m0 0l4-4m-4 4l-4-4M5 21h14" />
                  </svg>
                  Export PDF
                </button>
              </>
            ) : (
              <select value={agencyFilter} onChange={(event) => setAgencyFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none shadow-md transition hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-600/10">
                <option value="all">All agencies</option>
                <option value="CDRRMO">CDRRMO</option>
                <option value="PNP">PNP</option>
                <option value="BFP">BFP</option>
              </select>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {renderIncidentTable(displayReports)}
        </div>
      </section>
    );
  };

  const renderUsers = (category = "all") => {
    const isAgencyDirectory = category === "all" && userCategoryFilter === "agency";
    const isUserDirectory = category === "all" && userCategoryFilter === "resident";
    const directoryUsers = isAgencyDirectory
      ? []
      : category === "all"
      ? filteredUsers
      : users.filter((user) => (user.role || "resident").toLowerCase() === category);
    const directoryTitle = isAgencyDirectory ? "Agency Management"
      : isUserDirectory || category === "resident" ? "User Directory"
      : category === "responder" ? "Responder Directory"
        : "User Management";
    const directoryDescription = isAgencyDirectory ? "Add and manage agencies available when creating responder accounts."
      : isUserDirectory || category === "resident"
      ? "Manage user accounts that submit emergency reports and receive updates."
      : category === "responder"
        ? "Manage responder accounts assigned to emergency agencies."
        : "Manage users, responders, and administrators.";

    return (
      <div className="flex flex-col gap-4 h-full">
        <div className="flex-none flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">{directoryTitle}</h2>
            <p className="text-xs text-slate-500">{directoryDescription}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {category === "all" && (
              <select
                value={userCategoryFilter}
                onChange={(event) => setUserCategoryFilter(event.target.value)}
                aria-label="Filter users by category"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none transition hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-600/10"
              >
                <option value="all">All categories</option>
                <option value="resident">Users</option>
                <option value="responder">Responders</option>
              </select>
            )}
            {isAgencyDirectory && (
              <button
                type="button"
                onClick={() => { setError(""); setNewAgencyName(""); setIsAgencyModalOpen(true); }}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                Add Agency
              </button>
            )}
            {category === "all" && !isAgencyDirectory && (
              <button type="button" onClick={openAddUserModal} className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]">
                Add User
              </button>
            )}
          </div>
        </div>

        {isAgencyDirectory ? (
          <section className="flex-1 min-h-0 flex flex-col rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/50">
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full table-auto text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-4 py-3">Agency</th>
                    <th className="px-4 py-3">Responder Accounts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agencyCategories.map((agency) => (
                    <tr key={agency} className="text-sm text-slate-700">
                      <td className="px-4 py-3 font-bold text-slate-900">{agency}</td>
                      <td className="px-4 py-3">{users.filter((user) => user.role === "responder" && user.agency === agency).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
        <section className="flex-1 min-h-0 flex flex-col rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/50">
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3">Name</th>
                  {!isUserDirectory && <th className="px-4 py-3">Category</th>}
                  {!isUserDirectory && <th className="px-4 py-3">Agency</th>}
                  <th className="px-4 py-3">Password</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Registered</th>
                  {category === "all" && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {directoryUsers.map((user) => (
                  <tr key={user._id} className="text-sm text-slate-700">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{user.fullName}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </td>
                    {!isUserDirectory && <td className="px-4 py-3 capitalize">
                      {user.role === "resident" ? "User" : user.role || "User"}
                      {user.role === "responder" && (
                        <span className={`ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium border ${user.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : user.status === "declined"
                              ? "bg-red-50 text-red-700 border-red-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                          {user.status || "pending"}
                        </span>
                      )}
                    </td>}
                    {!isUserDirectory && <td className="px-4 py-3">{user.agency || "NONE"}</td>}
                    <td className="px-4 py-3 break-all text-xs font-medium text-slate-700">{user.visiblePassword || "—"}</td>
                    <td className="px-4 py-3">{user.phoneNumber || "N/A"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
                        : "—"}
                    </td>
                    {category === "all" && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setSelectedUserInfo(user)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 active:scale-[0.98]">View Info</button>
                          <button onClick={() => editUser(user)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]">Edit</button>
                          <button onClick={() => deleteUser(user._id)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 transition hover:border-red-300 hover:bg-red-100 active:scale-[0.98]">Remove</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {directoryUsers.length === 0 && (
                  <tr>
                    <td colSpan={isUserDirectory ? 5 : category === "all" ? 7 : 6} className="px-4 py-8 text-center text-sm text-slate-400">No {isUserDirectory || category === "all" ? "users in this category" : `${category}s`} found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

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
                  <select
                    value={userForm.role}
                    onChange={(event) => {
                      const newRole = event.target.value;
                      const isNoAgency = newRole === "resident" || newRole === "admin";
                      setUserForm({
                        ...userForm,
                        role: newRole,
                        agency: isNoAgency ? "NONE" : userForm.agency
                      });
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10"
                  >
                    <option value="resident">User</option>
                    <option value="responder">Responder</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select
                    value={userForm.agency}
                    onChange={(event) => setUserForm({ ...userForm, agency: event.target.value })}
                    disabled={userForm.role !== "responder"}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-70"
                  >
                    <option value="NONE" disabled>
                      Select agency
                    </option>
                    {agencyCategories.map((agency) => (
                      <option key={agency} value={agency}>{agency}</option>
                    ))}
                  </select>
                </div>
                <input value={userForm.phoneNumber} onChange={(event) => setUserForm({ ...userForm, phoneNumber: event.target.value })} placeholder="Phone number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10" />
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    disabled={isSavingUser || (userForm.role === "responder" && userForm.agency === "NONE")}
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-80"
                  >
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
        {selectedUserInfo && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 py-6" onMouseDown={() => setSelectedUserInfo(null)}>
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between bg-slate-900 px-6 py-5 text-white">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">User information</p>
                  <h2 className="mt-1 text-lg font-black">{selectedUserInfo.fullName || "Unknown user"}</h2>
                </div>
                <button type="button" onClick={() => setSelectedUserInfo(null)} className="rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close user information">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <dl className="grid gap-x-6 gap-y-4 p-6 sm:grid-cols-2">
                {[
                  ["Email", selectedUserInfo.email || "Not provided"],
                  ["Contact number", selectedUserInfo.phoneNumber || "Not provided"],
                  ["Category", selectedUserInfo.role === "resident" ? "User" : selectedUserInfo.role || "User"],
                  ["Status", selectedUserInfo.status || "Active"],
                  ["Agency", selectedUserInfo.agency && selectedUserInfo.agency !== "NONE" ? selectedUserInfo.agency : "Not assigned"],
                  ["Registered", selectedUserInfo.createdAt ? new Date(selectedUserInfo.createdAt).toLocaleString("en-PH") : "Not available"],
                  ["IP address", selectedUserInfo.lastIpAddress || selectedUserInfo.last_ip_address || "Not available"],
                  ...(selectedUserInfo.employeeId ? [["Employee ID", selectedUserInfo.employeeId]] : []),
                  ...(selectedUserInfo.rank ? [["Rank", selectedUserInfo.rank]] : []),
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</dt>
                    <dd className="mt-1 break-words text-sm font-bold text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-right">
                <button type="button" onClick={() => setSelectedUserInfo(null)} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-700">Close</button>
              </div>
            </div>
          </div>
        )}
        {isAgencyModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 py-6" onMouseDown={() => setIsAgencyModalOpen(false)}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Add Agency Category</h2>
                  <p className="mt-1 text-sm text-slate-500">Create an agency option for responder accounts.</p>
                </div>
                <button type="button" onClick={() => setIsAgencyModalOpen(false)} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close add agency dialog">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <form onSubmit={addAgencyCategory} className="mt-5">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500" htmlFor="new-agency-name">Agency name</label>
                <input
                  id="new-agency-name"
                  autoFocus
                  value={newAgencyName}
                  onChange={(event) => setNewAgencyName(event.target.value)}
                  placeholder="e.g. City Health Office"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/10"
                />
                {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAgencyModalOpen(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50">Cancel</button>
                  <button disabled={isSavingAgency || !newAgencyName.trim()} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                    {isSavingAgency ? "Adding..." : "Add Agency"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNotifications = () => {
    const unreadCount = notifications.filter((item) => !item.read).length;
    const getNotificationStyle = (item) => {
      if (item.category === "incident") return { icon: "!", color: "bg-red-50 text-red-600 border-red-100" };
      if (item.category === "user_management") return { icon: "U", color: "bg-blue-50 text-blue-600 border-blue-100" };
      return { icon: "i", color: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    };
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={() => setIsNotificationsModalOpen(false)}>
        <section className="flex max-h-[calc(100dvh-3rem)] w-full max-w-2xl min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex flex-none flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Notifications</h2>
                  <p className="mt-0.5 text-xs text-slate-500">System activity and emergency updates for administrators.</p>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${unreadCount ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-500"}`}>{unreadCount} unread</span>
              {unreadCount > 0 && <button type="button" onClick={markAllNotificationsRead} className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50">Mark all as read</button>}
              <button type="button" onClick={() => setIsNotificationsModalOpen(false)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close notifications">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6">
            {notifications.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 text-center">
                <Bell className="h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-400">New system and incident updates will appear here.</p>
              </div>
            ) : <div className="mx-auto max-w-2xl space-y-3">
              {notifications.map((item) => {
                const style = getNotificationStyle(item);
                return <article key={item.id} className={`group flex gap-4 rounded-xl border p-4 transition ${item.read ? "border-slate-200 bg-white" : "border-emerald-200 bg-emerald-50/40 shadow-sm"}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black ${style.color}`}>{style.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                      </div>
                      {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" title="Unread" />}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                      <button type="button" onClick={() => setNotificationReadState(item, !item.read)} className="text-xs font-bold text-emerald-700 transition hover:text-emerald-900">
                        {item.read ? "Mark unread" : "Mark as read"}
                      </button>
                    </div>
                  </div>
                </article>;
              })}
            </div>}
          </div>
        </section>
      </div>
    );
  };

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
      if (auditDateTo) { const end = new Date(auditDateTo); end.setHours(23, 59, 59); if (d > end) return false; }
      return true;
    });

    const AUDIT_PAGE_SIZE = 20;
    const statusPageCount = Math.ceil(filteredAuditEntries.length / AUDIT_PAGE_SIZE);
    const paginatedEntries = filteredAuditEntries;

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

    const exportAuditLogs = () => {
      const rows = auditTab === "status"
        ? filteredAuditEntries.map((entry) => ({
          user: entry.actorName || "System",
          action: entry.action || `${entry.fromStatus || ""} → ${entry.toStatus || ""}`,
          timestamp: entry.createdAt || "",
          ipAddress: entry.ipAddress || "",
          type: "status",
        }))
        : filteredAuditLogs.map((log) => ({
          user: log.actorEmail || log.actorName || "—",
          action: log.details || AUDIT_ACTION_LABELS[log.action] || log.action || "—",
          timestamp: log.createdAt || "",
          ipAddress: log.ipAddress || "—",
          type: AUDIT_ACTION_LABELS[log.action] || log.action || "activity",
        }));
      if (!rows.length) {
        alert("No audit logs to export.");
        return;
      }

      const escapeHtml = (value) => String(value ?? "—")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
      const auditTitle = auditTab === "status" ? "Incident Status Log" : auditTab === "password_security" ? "Password Security Log" : "User Activity Log";
      const rowsHtml = rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.user)}</td>
          <td>${escapeHtml(row.action)}</td>
          <td>${escapeHtml(row.timestamp ? new Date(row.timestamp).toLocaleString() : "—")}</td>
          <td>${escapeHtml(row.ipAddress)}</td>
          <td>${escapeHtml(row.type)}</td>
        </tr>
      `).join("");
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <html><head><title>Alerto Calbayog - ${auditTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #334155; padding: 30px; margin: 0; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #7f1d1d; padding-bottom: 15px; margin-bottom: 28px; }
          .brand { display: flex; align-items: center; gap: 12px; } .logo { width: 48px; height: 48px; object-fit: contain; }
          h1 { margin: 0; font-size: 22px; color: #7f1d1d; } .subtitle, .report-info { margin: 4px 0 0; color: #64748b; font-size: 12px; }
          .report-info { text-align: right; } table { width: 100%; border-collapse: collapse; } th { background: #fef2f2; color: #7f1d1d; font-size: 11px; text-transform: uppercase; padding: 10px; border: 1px solid #fca5a5; text-align: left; } td { padding: 10px; font-size: 11px; border: 1px solid #cbd5e1; vertical-align: top; } tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 42px; border-top: 1px dashed #cbd5e1; padding-top: 14px; color: #94a3b8; font-size: 10px; text-align: center; } @media print { body { padding: 0; } }
        </style></head><body>
          <div class="header"><div class="brand"><img src="/logo.png" class="logo" /><div><h1>ALERTO CALBAYOG</h1><p class="subtitle">${auditTitle}</p></div></div><div class="report-info"><strong>Generated:</strong> ${new Date().toLocaleString()}<br/><strong>Total Records:</strong> ${rows.length}</div></div>
          <table><thead><tr><th>User</th><th>Action</th><th>Timestamp</th><th>IP Address</th><th>Type</th></tr></thead><tbody>${rowsHtml}</tbody></table>
          <div class="footer">Alerto Calbayog © ${new Date().getFullYear()} — Confidential Admin Report. All rights reserved.</div>
          <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
        </body></html>
      `);
      printWindow.document.close();
    };

    return (
      <div className="flex flex-col gap-4 h-full overflow-auto p-1">
        {/* Header */}
        <div className="flex-none flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Audit Logs</h2>
            <p className="mt-0.5 text-sm text-slate-500">Complete administrator activity history</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-none flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
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
        <div className="flex-none flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuditSearch()}
              placeholder={auditTab === "status" ? "Search incident, agency, actor..." : "Search name, email, action..."}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          <input
            type="date"
            value={auditDateFrom}
            onChange={(e) => {
              setAuditDateFrom(e.target.value);
              setAuditPage(1);
              fetchAuditLogs({ tab: auditTab, search: auditSearch, dateFrom: e.target.value, dateTo: "", page: 1 });
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none shadow-md transition hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-600/10"
            title="Filter audit logs by date"
          />

          <button
            type="button"
            onClick={() => {
              setAuditDateFrom("");
              setAuditDateTo("");
              setAuditPage(1);
              fetchAuditLogs({ tab: auditTab, search: auditSearch, dateFrom: "", dateTo: "", page: 1 });
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-200 active:scale-[0.98]"
          >
            Clear
          </button>

          <button onClick={exportAuditLogs} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-red-700">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 21h14" /></svg> Export PDF
          </button>
        </div>

        {/* ── STATUS TAB ───────────────────────────────────────────────────── */}
        {auditTab === "status" && (
          <section className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
            <div className="flex flex-none items-start border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Incident Status Log</h3>
                <p className="mt-0.5 text-xs text-slate-500">Status updates recorded per incident. View-only.</p>
              </div>
            </div>
            <div className="overflow-auto flex-1 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
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
                    <th className="px-3 py-2 text-right">Details</th>
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
                              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
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
                        <td className="px-3 py-2 text-right">
                          <button type="button" onClick={() => setAuditDetailEntry(entry)} className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black text-slate-700 transition hover:bg-slate-100">View</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── USER ACTIVITY TAB ───────────────────────────────────────────────── */}
        {auditTab === "user_activity" && (
          <section className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/50">
            <div className="flex flex-none items-start border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">User Account Activity</h3>
                <p className="mt-0.5 text-xs text-slate-500">Login attempts, profile updates, and account changes.</p>
              </div>
            </div>
            {auditLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-400 flex-1 min-h-0">Loading activity logs...</div>
            ) : (
              <div className="overflow-auto flex-1">
                <table className="w-full table-auto text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">IP Address</th>
                      <th className="px-4 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {actLogs.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">No user activity logs found.</td></tr>
                    ) : actLogs.map((log, idx) => {
                      const style = AUDIT_ACTION_STYLES[log.action] || { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
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
                          <td className="px-4 py-3 max-w-[160px] truncate text-xs text-slate-600">{AUDIT_ACTION_LABELS[log.action] || log.action || "—"}</td>
                          <td className="px-4 py-3 max-w-[110px] truncate text-xs font-mono text-slate-400">{log.ipAddress || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <button type="button" onClick={() => setAuditDetailEntry(log)} className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black text-slate-700 transition hover:bg-slate-100">View</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── PASSWORD SECURITY TAB ────────────────────────────────────────────── */}
        {auditTab === "password_security" && (
          <section className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/50">
            <div className="flex-none border-b border-slate-100 px-5 py-4 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Password Security Activity</h3>
                <p className="mt-0.5 text-xs text-slate-500">OTP requests, verifications, and password resets. Read-only security log.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-600 border border-red-100">Sensitive</span>
              </div>
            </div>
            {auditLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-400 flex-1 min-h-0">Loading security logs...</div>
            ) : (
              <div className="overflow-x-auto flex-1 rounded-xl border border-slate-200 bg-slate-50">
                <table className="w-full min-w-[720px] table-auto text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">OTP</th>
                      <th className="px-3 py-2 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pwdLogs.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No password security events recorded.</td></tr>
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
                          <td className="px-4 py-3 text-right">
                            <button type="button" onClick={() => setAuditDetailEntry(log)} className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black text-slate-700 transition hover:bg-slate-100">View</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Detail Modal */}
        {auditDetailEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setAuditDetailEntry(null)}>
            <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-black text-slate-900">Log Entry Details</h3>
                <button onClick={() => setAuditDetailEntry(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div className="divide-y divide-slate-50 space-y-0 overflow-y-auto px-4 py-2">
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
                  <div key={label} className="flex justify-between gap-3 py-2">
                    <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
                    <span className="break-words text-right text-xs font-semibold text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 px-4 py-3">
                <button onClick={() => setAuditDetailEntry(null)} className="w-full rounded-lg bg-slate-900 py-2 text-sm font-bold text-white transition hover:bg-slate-700">
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
    const apiBase = import.meta.env.VITE_API_URL || "https://alertocalbayog-2.onrender.com";

    const roleCounts = ["admin", "responder", "resident"].map((role) => ({
      role,
      count: users.filter((user) => user.role === role).length,
    }));

    const roleConfig = {
      admin: { color: "bg-blue-600", lightBg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "🛡️", desc: "Full system authority including user management, incident verification, and system configuration." },
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
      { label: "API Base URL", value: apiBase, sub: "Used by authenticated admin requests" },
      { label: "Socket Room", value: "admin", sub: "Real-time incident and status updates" },
      { label: "Signed-in Admin", value: storedUser.fullName || "Admin", sub: storedUser.email || "Current browser session" },
      { label: "Tracked Records", value: `${reports.length} incidents · ${users.length} users`, sub: "Loaded into this dashboard session" },
    ];

    const realtimeFeatures = [
      { text: "Admin dashboard is connected to Socket Room: admin" },
      { text: "Incident updates are broadcast instantly across all active users" },
      { text: "Agency dashboards receive only relevant assigned incident data" },
      { text: "Status changes propagate in real time without refresh delays" },
      { text: "System ensures continuous live monitoring and coordination" },
    ];

    const settingsNavItems = [
      {
        id: "system-info",
        label: "System Information",
        icon: (
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="9" y1="22" x2="9" y2="16" />
            <line x1="15" y1="22" x2="15" y2="16" />
            <line x1="9" y1="16" x2="15" y2="16" />
            <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M12 6h.01M12 10h.01M8 14h.01M16 14h.01" />
          </svg>
        )
      },
      {
        id: "emergency-config",
        label: "Emergency Configuration",
        icon: (
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        )
      },
      {
        id: "notifications",
        label: "Notification Settings",
        icon: (
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        )
      },
      {
        id: "location-gps",
        label: "Location & GPS Settings",
        icon: (
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        )
      },
      {
        id: "user-access",
        label: "User & Access Control",
        icon: (
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )
      },
      {
        id: "backup-data",
        label: "Backup & Data Management",
        icon: (
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
          </svg>
        )
      }
    ];

    return (
      <div className="-mx-4 -my-3 lg:-mx-6 lg:-my-4 h-[calc(100vh-5rem)] bg-white flex flex-col lg:flex-row" style={{ fontFamily: "'Inter', 'Manrope', system-ui, sans-serif" }}>

        {/* Left Column Settings Navigation - Light themed */}
        <div className="w-full lg:w-72 shrink-0 border-r border-slate-100 flex flex-col">
          <div className="p-5 border-b border-slate-100">
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Settings</p>
            <h2 className="text-sm font-medium text-slate-900 mt-0.5">System Configuration</h2>
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            {settingsNavItems.map((item) => {
              const isActive = activeSettingsTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSettingsTab(item.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 mb-1 text-left text-sm font-medium rounded-xl transition-all ${isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                >
                  <span className={`shrink-0 ${isActive ? "text-red-500" : "text-slate-400"}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Column Settings Detail Area */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white p-6 lg:p-8">

          {/* Tab: System Information */}
          {activeSettingsTab === "system-info" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-900">System Information</h3>
                <p className="text-xs text-slate-500 mt-0.5">Overview of core server variables and real-time state parameters.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {systemCards.map((card) => (
                  <div key={card.label} className="rounded-xl border border-slate-100 bg-slate-50/20 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">{card.label}</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-900 break-all leading-normal">{card.value}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{card.sub}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                  <h4 className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Real-Time State Indicators</h4>
                </div>
                <div className="divide-y divide-slate-100 bg-white">
                  {realtimeFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3.5 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                      <p className="font-medium text-slate-600 leading-relaxed">{feat.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Emergency Configuration */}
          {activeSettingsTab === "emergency-config" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-900">Emergency Configuration</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure active alert workflows, stages, and category status.</p>
              </div>

              {/* Workflow Stepper */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/20 p-4">
                <h4 className="text-xs font-medium text-slate-900 mb-4">Incident Progress Pipeline</h4>
                <div className="space-y-4">
                  {workflow.map((step, index) => (
                    <div key={step.label} className="relative flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full ${step.color} text-[10px] font-medium text-white ring-4 ${step.ring}`}>
                          {step.num}
                        </div>
                        {index < workflow.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs font-medium text-slate-900 mt-1">{step.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories toggle */}
              <div className="rounded-xl border border-slate-100 p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-slate-900">Active Incident Categories</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Toggle categories to temporarily suspend dispatch routing warnings.</p>
                </div>
                <div className="space-y-3">
                  {Object.keys(activeCategories).map((cat) => (
                    <label key={cat} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition cursor-pointer">
                      <span className="text-xs font-medium capitalize text-slate-700">{cat} Dispatch Warning</span>
                      <input
                        type="checkbox"
                        checked={activeCategories[cat]}
                        onChange={(e) => setActiveCategories({ ...activeCategories, [cat]: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => saveSettings("activeCategories", activeCategories)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                >
                  Save Categories Settings
                </button>
              </div>
            </div>
          )}

          {/* Tab: Notification Settings */}
          {activeSettingsTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-900">Notification Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">Control browser alerts, warning sounds, SMS updates and warning broadcast ranges.</p>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 space-y-4">
                <h4 className="text-xs font-medium text-slate-600">Alert Preferences</h4>

                <div className="space-y-3.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-xs font-medium text-slate-700">Warning Siren Sound</p>
                      <p className="text-[10px] text-slate-400">Play loop audio on incoming emergency reports.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationsConfig.soundAlerts}
                      onChange={(e) => setNotificationsConfig({ ...notificationsConfig, soundAlerts: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-xs font-medium text-slate-700">Desktop Push Alert</p>
                      <p className="text-[10px] text-slate-400">Receive system notification prompts in background mode.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationsConfig.desktopNotif}
                      onChange={(e) => setNotificationsConfig({ ...notificationsConfig, desktopNotif: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-xs font-medium text-slate-700">Automated SMS Dispatch alerts</p>
                      <p className="text-[10px] text-slate-400">Dispatch message details instantly to active responder mobiles.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationsConfig.smsAlerts}
                      onChange={(e) => setNotificationsConfig({ ...notificationsConfig, smsAlerts: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-xs font-medium text-slate-700">User Warning Push</p>
                      <p className="text-[10px] text-slate-400">Send community push warnings to users near active hazards.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationsConfig.residentPush}
                      onChange={(e) => setNotificationsConfig({ ...notificationsConfig, residentPush: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-700">Broadcast Radius Limit</p>
                  <p className="text-[10px] text-slate-400">Maximum distance parameters for local warnings.</p>
                </div>
                <select
                  value={notificationsConfig.radius}
                  onChange={(e) => setNotificationsConfig({ ...notificationsConfig, radius: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-red-500 focus:ring-2"
                >
                  <option value="2">2 Kilometers</option>
                  <option value="5">5 Kilometers</option>
                  <option value="10">10 Kilometers</option>
                  <option value="all">Full Calbayog Area</option>
                </select>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => saveSettings("notificationsConfig", notificationsConfig)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          )}

          {/* Tab: Location & GPS Settings */}
          {activeSettingsTab === "location-gps" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-900">Location & GPS Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">Control live map tile configuration, update speed limits and geographic tracking.</p>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-700">GPS Tracker Sync Refresh Rate ({locationConfig.refreshRate}s)</p>
                  <p className="text-[10px] text-slate-400">Frequency rate for active mobile pings location updates.</p>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={locationConfig.refreshRate}
                  onChange={(e) => setLocationConfig({ ...locationConfig, refreshRate: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>5 Seconds (High Sync)</span>
                  <span>60 Seconds (Low CPU)</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 p-4 space-y-3">
                  <p className="text-xs font-medium text-slate-700">Initial Center Latitude</p>
                  <input
                    type="text"
                    value={locationConfig.lat}
                    onChange={(e) => setLocationConfig({ ...locationConfig, lat: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-600/10"
                  />
                </div>

                <div className="rounded-xl border border-slate-100 p-4 space-y-3">
                  <p className="text-xs font-medium text-slate-700">Initial Center Longitude</p>
                  <input
                    type="text"
                    value={locationConfig.lng}
                    onChange={(e) => setLocationConfig({ ...locationConfig, lng: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-600/10"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 space-y-3">
                <p className="text-xs font-medium text-slate-700">Map Tile Provider</p>
                <select
                  value={locationConfig.provider}
                  onChange={(e) => setLocationConfig({ ...locationConfig, provider: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-red-500 focus:ring-2"
                >
                  <option value="osm">OpenStreetMap Standard Tile</option>
                  <option value="carto">CartoDB Positron (Light Mode Map)</option>
                  <option value="satellite">Google Maps Satellite</option>
                </select>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => saveSettings("locationConfig", locationConfig)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                >
                  Save Map Settings
                </button>
              </div>
            </div>
          )}

          {/* Tab: User & Access Control */}
          {activeSettingsTab === "user-access" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-900">User & Access Control</h3>
                <p className="text-xs text-slate-500 mt-0.5">Overview distributions of tracked roles, permissions limits and system passwords policies.</p>
              </div>

              {/* Role distributions cards */}
              <div className="grid gap-3 sm:grid-cols-3">
                {roleCounts.map((item) => {
                  const cfg = roleConfig[item.role];
                  return (
                    <div key={item.role} className={`rounded-xl border ${cfg.border} ${cfg.lightBg} p-4 transition hover:shadow-sm`}>
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${cfg.color} text-white text-xs font-medium`}>
                          {item.count}
                        </div>
                        <span className="text-xs font-medium capitalize text-slate-700">{item.role === "responder" ? "Responders" : item.role === "resident" ? "Users" : "Admins"}</span>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500 leading-normal">{cfg.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-slate-100 p-4 space-y-4">
                <h4 className="text-xs font-medium text-slate-600">Security Policies</h4>

                <div className="space-y-3.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-xs font-medium text-slate-700">Enforce Complex Passwords</p>
                      <p className="text-[10px] text-slate-400">Require uppercase, symbols, and digit numbers on register.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={securityConfig.complexPassword}
                      onChange={(e) => setSecurityConfig({ ...securityConfig, complexPassword: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                  </label>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-medium text-slate-700">Admin Session Timeout (Minutes)</p>
                    <input
                      type="number"
                      value={securityConfig.sessionTimeout}
                      onChange={(e) => setSecurityConfig({ ...securityConfig, sessionTimeout: parseInt(e.target.value) || 30 })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-600/10"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => saveSettings("securityConfig", securityConfig)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                >
                  Save Security Settings
                </button>
              </div>
            </div>
          )}

          {/* Tab: Backup & Data Management */}
          {activeSettingsTab === "backup-data" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-900">Backup & Data Management</h3>
                <p className="text-xs text-slate-500 mt-0.5">Control data extraction, schedules back up archives and download CSV logs reports.</p>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 space-y-3">
                <h4 className="text-xs font-medium text-slate-600">Manual Operations</h4>
                <p className="text-[10px] text-slate-500">Run manual archives to safeguard active databases before major updates.</p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleBackup}
                    className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                  >
                    Trigger Database Backup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetchDeletedReports();
                      setIsTrashModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-100 active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    View Trash Bin
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 space-y-4">
                <h4 className="text-xs font-medium text-slate-600">Auto Schedules Configurations</h4>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-700">Automated Backup Frequency</p>
                    <select
                      value={backupConfig.interval}
                      onChange={(e) => setBackupConfig({ ...backupConfig, interval: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-red-500 focus:ring-2"
                    >
                      <option value="daily">Daily Auto-Backup</option>
                      <option value="weekly">Weekly Auto-Backup</option>
                      <option value="monthly">Monthly Auto-Backup</option>
                      <option value="disabled">Disabled (Manual Only)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-700">Incident Retention Period</p>
                    <select
                      value={backupConfig.retention}
                      onChange={(e) => setBackupConfig({ ...backupConfig, retention: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-red-500 focus:ring-2"
                    >
                      <option value="6">6 Months Retention</option>
                      <option value="12">1 Year Retention</option>
                      <option value="24">2 Years Retention</option>
                      <option value="forever">Forever (No Purge)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => saveSettings("backupConfig", backupConfig)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                  >
                    Save Schedule Settings
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 space-y-4">
                <h4 className="text-xs font-medium text-slate-600">Database Restoration</h4>
                <p className="text-[10px] text-slate-500">Restore database structure and documents from a local JSON backup archive.</p>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-red-500 transition rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2 text-xs font-medium text-slate-700">Click to upload or drag & drop backup JSON file</p>
                  <p className="text-[10px] text-slate-400 mt-1">Accepts alerto_backup_*.json</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 space-y-4">
                <h4 className="text-xs font-medium text-slate-600">Recent Server-side Backups</h4>
                <p className="text-[10px] text-slate-500">Select, download, or restore directly from archives stored on the server.</p>

                {serverBackups.length === 0 ? (
                  <div className="text-center py-6 border border-slate-100 rounded-xl bg-slate-50/50">
                    <p className="text-xs text-slate-400">No server-side backups found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                          <th className="p-3">Filename</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Size</th>
                          <th className="p-3">Created</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {serverBackups.map((bk) => (
                          <tr key={bk.filename} className="hover:bg-slate-50/50 text-slate-700 border-b border-slate-100">
                            <td className="p-3 font-mono text-[10px] truncate max-w-[200px]" title={bk.filename}>
                              {bk.filename}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${bk.type === "Automatic" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-purple-50 text-purple-700 border border-purple-100"
                                }`}>
                                {bk.type}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-slate-500">
                              {(bk.sizeBytes / 1024).toFixed(1)} KB
                            </td>
                            <td className="p-3 text-slate-500">
                              {new Date(bk.createdAt).toLocaleString()}
                            </td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDownloadServerBackup(bk.filename)}
                                className="inline-flex items-center justify-center rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                title="Download File"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRestoreFromFile(bk.filename)}
                                className="inline-flex items-center justify-center rounded p-1 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                title="Restore from this Backup"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteServerBackup(bk.filename)}
                                className="inline-flex items-center justify-center rounded p-1 text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                                title="Delete Backup"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    );
  };

  const renderResponderApprovals = () => {
    const pendingResponders = users.filter(
      (user) => user.role === "responder" && (user.status === "pending" || !user.status)
    );

    return (
      <div className="flex flex-col h-full font-sans">
        <section className="flex-1 min-h-0 flex flex-col rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-medium uppercase tracking-widest text-slate-500">Pending Requests ({pendingResponders.length})</h3>
          </div>
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30 text-[10px] font-medium uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3">Responder</th>
                  <th className="px-4 py-3">Agency</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Date Applied</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingResponders.map((user) => (
                  <tr key={user._id} className="text-sm text-slate-700 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{user.fullName}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-800">
                        {user.agency || "NONE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {user.phoneNumber || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Pending
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleResponderApproval(user._id, "approved")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 active:scale-[0.98]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleResponderApproval(user._id, "declined")}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
                        >
                          Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingResponders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                      No pending approval requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  const renderContent = () => {
    if (activeNav === "overview") return renderOverview();
    if (activeNav === "incidents") return renderIncidents();
    if (activeNav === "queuing") return <AdminQueuingSystem reports={reports} onStatusChange={updateReportStatus} onViewReport={(report, idx) => setSelectedReport({ report, index: idx })} />;
    if (activeNav === "closed-incidents") return renderIncidents("closed");
    if (activeNav === "rejected-incidents") return renderIncidents("rejected");
    if (activeNav === "analytics") return renderAnalytics();
    if (activeNav === "users") return renderUsers();
    if (activeNav === "responder-approvals") return renderResponderApprovals();
    if (activeNav === "audit") return renderAudit();
    return renderSettings();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {isSidebarOpen && (
        <button className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu" />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#052e16] text-white border-r border-emerald-900 transition-all duration-300 md:static md:translate-x-0 overflow-x-hidden group/sidebar ${isSidebarOpen ? "w-64 translate-x-0" : "w-64 md:w-20 md:hover:w-64 -translate-x-full shadow-xl md:shadow-none"}`}>
        <div className="flex h-20 shrink-0 items-center gap-4 px-5 border-b border-emerald-800/50">
          <img src="/logo.png" alt="Alerto Calbayog" className="h-10 w-10 shrink-0 object-contain" />
          <div className={`flex flex-col whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "md:opacity-0 md:group-hover/sidebar:opacity-100 opacity-100"}`}>
            <p className="text-base font-black tracking-tight text-white">Alerto Calbayog</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/80">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden p-3 mt-2">
          <p className={`px-3 mb-3 text-[10px] font-black uppercase tracking-widest text-emerald-400/80 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "md:opacity-0 md:group-hover/sidebar:opacity-100 opacity-100"}`}>Menu</p>
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            const navCount = item.id === "queuing"
              ? reports.filter((report) => (report.status || "").toLowerCase() === "pending").length
              : item.id === "responder-approvals"
                ? users.filter((user) => user.role === "responder" && (user.status === "pending" || !user.status)).length
                : 0;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-all duration-200 ${isActive ? "bg-emerald-900 text-white shadow-sm shadow-emerald-900/50" : "text-emerald-100/70 hover:bg-emerald-900/50 hover:text-white"}`}
              >
                {isActive && <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-emerald-400" />}
                <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-white" : "text-emerald-400/70"}`} />
                <span className={`whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "md:opacity-0 md:group-hover/sidebar:opacity-100 opacity-100"}`}>{item.label}</span>
                {navCount > 0 && (
                  <span className="absolute right-2 top-1/2 min-w-5 -translate-y-1/2 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-black leading-none text-white">
                    {navCount > 99 ? "99+" : navCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-emerald-800/50">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold text-emerald-100/70 transition-colors hover:bg-red-500/10 hover:text-red-400 group">
            <LogOut className="h-[18px] w-[18px] shrink-0 text-emerald-400/70 group-hover:text-red-400" />
            <span className={`whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "md:opacity-0 md:group-hover/sidebar:opacity-100 opacity-100"}`}>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 bg-white px-3 sm:gap-4 sm:px-4 md:h-20 md:px-8 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="shrink-0 rounded-lg p-2 md:hidden hover:bg-slate-50" aria-label="Open menu">
              <Menu className="h-5 w-5 text-slate-700" />
            </button>
            <h1 className="text-xl font-black text-slate-900 hidden sm:block">
              {NAV.find((item) => item.id === activeNav)?.label || "Dashboard"} Overview
            </h1>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-6">
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

            <div className="flex shrink-0 items-center gap-2 sm:gap-5">
              <button onClick={() => { fetchNotifications(); setIsNotificationsModalOpen(true); }} className="relative rounded-lg bg-slate-50 p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 border border-slate-100" aria-label="Open notifications">
                <Bell className="h-5 w-5" />
                {notifications.filter((item) => !item.read).length > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 py-0.5 text-center text-[10px] font-black leading-none text-white ring-2 ring-white">
                    {notifications.filter((item) => !item.read).length > 99 ? "99+" : notifications.filter((item) => !item.read).length}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-3 border-l border-slate-100 pl-2 sm:pl-5">
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

        <section className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-4 md:overflow-hidden md:px-6 md:py-4 flex flex-col min-h-0">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
          <div className="flex-1 min-h-0">{renderContent()}</div>
        </section>
      </main>

      {isNotificationsModalOpen && renderNotifications()}

      {/* Incident Details Modal */}
      {selectedReport && (() => {
        const { report, index } = selectedReport;
        const statusInfo = getStatusInfo(report.status);
        const isRejected = (report.status || "").toLowerCase() === "rejected";
        const rejectionLog = [...(report.actionLog || [])].reverse().find((entry) => entry.toStatus === "rejected");
        const eventDate = isRejected
          ? report.rejectedAt || rejectionLog?.createdAt
          : report.closedAt;
        const detailRows = [
          ["Incident ID", getIncidentId(report, index)],
          ["Emergency Type", TYPE_LABELS[report.emergencyType] || report.emergencyType || "Incident"],
          ["Agency", report.assignedAgency && report.assignedAgency !== "NONE" ? report.assignedAgency : (report.notifiedAgencies || []).join(", ") || "Unassigned"],
          ["Reporter", report.userId?.fullName || "Unknown"],
          ["Contact", report.userId?.phoneNumber || "No contact number"],
          ["Location", getLocation(report)],
          ["Reported", report.createdAt ? new Date(report.createdAt).toLocaleString() : "—"],
          [isRejected ? "Rejected" : "Closed", eventDate ? new Date(eventDate).toLocaleString() : "N/A"],
        ];
        const userEvidenceImages = Array.from(
          new Set([
            ...(Array.isArray(report.proofPhotos) ? report.proofPhotos : []),
            ...(Array.isArray(report.proofImages) ? report.proofImages : []),
            ...(Array.isArray(report.media) ? report.media : []),
            ...(Array.isArray(report.images) ? report.images : []),
            ...(typeof report.imageUrl === "string" && report.imageUrl ? [report.imageUrl] : []),
            ...(typeof report.image === "string" && report.image ? [report.image] : []),
          ].filter(Boolean))
        );
        const responderEvidenceImages = Array.from(
          new Set([
            ...(Array.isArray(report.resolutionEvidence) ? report.resolutionEvidence : []),
            ...(Array.isArray(report.evidenceImages) ? report.evidenceImages : []),
          ].filter(Boolean))
        );
        const renderEvidenceGallery = (images, source) => (
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {source} ({images.length})
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((src, i) => (
                <button
                  key={`${source}-${i}`}
                  type="button"
                  onClick={() => setPreviewImage(src)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition-all hover:ring-2 hover:ring-emerald-500"
                >
                  <img src={src} alt={`${source} ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
        const hasEvidence = userEvidenceImages.length > 0 || responderEvidenceImages.length > 0;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={() => setSelectedReport(null)}>
            <div className="flex h-[calc(100dvh-2rem)] max-h-[39rem] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between bg-slate-900 px-6 py-5 text-white">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Incident details</p>
                  <h2 className="mt-1 font-mono text-sm font-black">{getIncidentId(report, index)}</h2>
                </div>
                <button type="button" onClick={() => setSelectedReport(null)} className="rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close details">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} /> {statusInfo.label}
                </div>
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {detailRows.map(([label, value]) => (
                    <div key={label} className={label === "Location" ? "sm:col-span-2" : ""}>
                      <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-bold text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">{report.description || "No description provided."}</p>
                </div>

                {hasEvidence && (
                  <div className="space-y-5">
                    {userEvidenceImages.length > 0 && renderEvidenceGallery(userEvidenceImages, "Photos from user")}
                    {responderEvidenceImages.length > 0 && renderEvidenceGallery(responderEvidenceImages, "Photos from responder")}
                  </div>
                )}
                {!hasEvidence && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Scene & Proof of Evidence</p>
                    <p className="mt-1 text-sm font-semibold text-amber-800">No evidence was submitted. This may be a false report.</p>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Proof of Evidence Image Preview Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-h-[90vh] max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white font-bold text-sm flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-full border border-white/20"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              Close Preview
            </button>
            <img src={previewImage} alt="Full-size proof of evidence" className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain" />
          </div>
        </div>
      )}

      {isTrashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Recently Deleted Reports (Trash Bin)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Restore soft-deleted incident reports back to the active queue list.</p>
              </div>
              <button onClick={() => setIsTrashModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="overflow-auto flex-1 p-6">
              {isFetchingDeleted ? (
                <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                  Loading deleted reports...
                </div>
              ) : deletedReports.length === 0 ? (
                <div className="text-center py-12 border border-slate-100 rounded-xl bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-700">Trash Bin is empty</p>
                  <p className="text-xs text-slate-400 mt-1">Soft-deleted incident reports will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-3">Incident ID</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Reporter</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Deleted Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deletedReports.map((report, index) => (
                        <tr key={report._id} className="hover:bg-slate-50/50 text-slate-700 border-b border-slate-100">
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {getIncidentId(report, index)}
                          </td>
                          <td className="p-3 capitalize font-semibold text-slate-800">
                            {report.emergencyType}
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{report.userId?.fullName || "Unknown"}</p>
                            <p className="text-[10px] text-slate-400">{report.userId?.phoneNumber || "No contact"}</p>
                          </td>
                          <td className="p-3 truncate max-w-[200px]" title={getLocation(report)}>
                          </td>
                          {getLocation(report)}
                          <td className="p-3 text-slate-500">
                            {report.updatedAt ? new Date(report.updatedAt).toLocaleString() : ""}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRestoreReport(report._id)}
                              className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 active:scale-[0.98] transition border border-emerald-200"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" /></svg>
                              Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={exportDeletedReportsCSV}
                disabled={deletedReports.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export as CSV / Excel
              </button>
              <button onClick={() => setIsTrashModalOpen(false)} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
