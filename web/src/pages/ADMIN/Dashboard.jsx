import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "incidents", label: "Incidents" },
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
      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
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
    return {
      total: reports.length,
      pending: reports.filter((report) => (report.status || "").toLowerCase() === "pending").length,
      active: reports.filter((report) => ["verified", "responding", "active"].includes((report.status || "").toLowerCase())).length,
      resolved: reports.filter((report) => ["resolved", "responded", "closed"].includes((report.status || "").toLowerCase())).length,
      open,
      users: users.length,
      responders: responders.length,
    };
  }, [reports, responders.length, users.length]);

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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const statCards = [
    { label: "Total Incidents", value: stats.total, sub: "All agencies" },
    { label: "Open Incidents", value: stats.open, sub: "Pending or in progress" },
    { label: "Pending", value: stats.pending, sub: "Needs verification" },
    { label: "Resolved", value: stats.resolved, sub: "Closed response loop" },
    { label: "Users", value: stats.users, sub: "Residents and staff" },
    { label: "Responders", value: stats.responders, sub: "Assignable responders" },
  ];

  const renderOverview = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-slate-900">Priority Incident Control</h2>
              <p className="text-xs text-slate-500">Update status and assignment without leaving the dashboard.</p>
            </div>
            <button onClick={() => setActiveNav("incidents")} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">
              Manage all
            </button>
          </div>
          {renderIncidentTable(filteredReports.slice(0, 6), true)}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-900">Live Notifications</h2>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm font-medium text-slate-500">No live notifications yet.</p>
            ) : notifications.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.message}</p>
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
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-black outline-none ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text}`}
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
                    className="w-full min-w-[180px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400"
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
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={agencyFilter} onChange={(event) => setAgencyFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
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
          <input value={userForm.fullName} onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })} placeholder="Full name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900" />
          <input value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} placeholder="Email" type="email" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900" />
          <input value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} placeholder={editingUserId ? "New password (optional)" : "Password"} type="password" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900" />
          <div className="grid grid-cols-2 gap-3">
            <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value, agency: event.target.value === "resident" ? "NONE" : userForm.agency })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-slate-900">
              <option value="resident">Resident</option>
              <option value="responder">Responder</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <select value={userForm.agency} onChange={(event) => setUserForm({ ...userForm, agency: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-slate-900">
              <option value="NONE">No agency</option>
              <option value="BFP">BFP</option>
              <option value="CDRRMO">CDRRMO</option>
              <option value="PNP">PNP</option>
            </select>
          </div>
          <input value={userForm.phoneNumber} onChange={(event) => setUserForm({ ...userForm, phoneNumber: event.target.value })} placeholder="Phone number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900" />
        </div>
        <div className="mt-4 flex gap-2">
          <button disabled={isSavingUser} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-black text-white disabled:opacity-60">
            {isSavingUser ? "Saving..." : editingUserId ? "Save Changes" : "Create User"}
          </button>
          {editingUserId && (
            <button type="button" onClick={resetUserForm} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-black text-slate-600">
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
                      <button onClick={() => editUser(user)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Edit</button>
                      <button onClick={() => deleteUser(user._id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">Remove</button>
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

  const renderSettings = () => (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black text-slate-900">System Settings</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          ["Access control", "Admins can manage all users and incidents. Responders can update incidents routed to their agency."],
          ["Realtime updates", "Dashboards join the admin and agency socket rooms. Mobile residents join their own user room for notifications."],
          ["Incident workflow", "Use Pending, Verified, Active, and Resolved as the primary response path."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );

  const renderContent = () => {
    if (activeNav === "overview") return renderOverview();
    if (activeNav === "incidents") return renderIncidents();
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
