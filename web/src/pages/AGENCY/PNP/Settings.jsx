import { useState, useEffect } from "react";

const TABS = [
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    id: "security",
    label: "Security",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.599-3.751A11.956 11.956 0 0112 2.714z" />
      </svg>
    ),
  },
];

export default function Settings({ user = {}, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [modalConfig, setModalConfig] = useState(null);
  const closeModal = () => setModalConfig(null);

  // Profile States
  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rank, setRank] = useState("");
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");

  // Account States
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Security States
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [ipRestriction, setIpRestriction] = useState(false);
  const [sessions, setSessions] = useState([]);

  // Preferences States
  const [language, setLanguage] = useState("English (US)");
  const [timezone, setTimezone] = useState("Asia/Manila (UTC+8)");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState("12-Hour (AM/PM)");
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [loopAlarm, setLoopAlarm] = useState(true);
  const [desktopPush, setDesktopPush] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(false);

  // Agency Config States
  const [agencyName, setAgencyName] = useState("");
  const [agencyCode, setAgencyCode] = useState("");
  const [stationUnit, setStationUnit] = useState("");
  const [jurisdictionArea, setJurisdictionArea] = useState("");
  const [emergencyHotline, setEmergencyHotline] = useState("");
  const [dispatchFrequency, setDispatchFrequency] = useState("");
  const [autoAssign, setAutoAssign] = useState(true);
  const [requireSupervisorApproval, setRequireSupervisorApproval] = useState(false);
  const [enableGpsTracking, setEnableGpsTracking] = useState(true);

  // Load from props and localStorage on mount/change
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "Officer J. Dela Cruz");
      setEmployeeId(user.employeeId || "PNP-2024-001");
      setEmail(user.email || "officer@calbayog.gov.ph");
      setPhoneNumber(user.phoneNumber || "0917-123-4567");
      setRank(user.rank || "Shift Commander");
      setDepartment(user.department || user.agency || "PNP");
      setBio(user.bio || "");
      setAvatar(user.avatar || "");
      setUsername(user.username || user.email || "officer.delacruz@pnp.gov.ph");

      setTwoFactor(user.twoFactor || false);
      setLoginAlerts(user.loginAlerts !== false);
      setSessionTimeout(user.sessionTimeout !== false);
      setIpRestriction(user.ipRestriction || false);

      setLanguage(user.language || "English (US)");
      setTimezone(user.timezone || "Asia/Manila (UTC+8)");
      setDateFormat(user.dateFormat || "MM/DD/YYYY");
      setTimeFormat(user.timeFormat || "12-Hour (AM/PM)");
      setSoundAlerts(user.soundAlerts !== false);
      setLoopAlarm(user.loopAlarm !== false);
      setDesktopPush(user.desktopPush !== false);
      setEmailDigest(user.emailDigest || false);
      setSmsAlerts(user.smsAlerts || false);
    }

    try {
      const sess = localStorage.getItem("activeSessions");
      setSessions(sess ? JSON.parse(sess) : [
        { id: 1, browser: "Chrome on Windows", loc: "Calbayog City, PH", time: "Now — Current session", active: true },
        { id: 2, browser: "Firefox on Android", loc: "Samar, PH", time: "2 hours ago", active: false }
      ]);
    } catch {
      setSessions([
        { id: 1, browser: "Chrome on Windows", loc: "Calbayog City, PH", time: "Now — Current session", active: true },
        { id: 2, browser: "Firefox on Android", loc: "Samar, PH", time: "2 hours ago", active: false }
      ]);
    }

    try {
      const cfg = JSON.parse(localStorage.getItem("agencyConfig") || "{}");
      setAgencyName(cfg.agencyName || "Philippine National Police");
      setAgencyCode(cfg.agencyCode || user.agency || "PNP");
      setStationUnit(cfg.stationUnit || "Calbayog City Police Station");
      setJurisdictionArea(cfg.jurisdictionArea || "Calbayog City, Samar");
      setEmergencyHotline(cfg.emergencyHotline || "117 / (055) 209-1234");
      setDispatchFrequency(cfg.dispatchFrequency || "10 seconds");
      setAutoAssign(cfg.autoAssign !== false);
      setRequireSupervisorApproval(cfg.requireSupervisorApproval || false);
      setEnableGpsTracking(cfg.enableGpsTracking !== false);
    } catch {
      setAgencyName("Philippine National Police");
      setAgencyCode(user.agency || "PNP");
      setStationUnit("Calbayog City Police Station");
      setJurisdictionArea("Calbayog City, Samar");
      setEmergencyHotline("117 / (055) 209-1234");
      setDispatchFrequency("10 seconds");
      setAutoAssign(true);
      setRequireSupervisorApproval(false);
      setEnableGpsTracking(true);
    }
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setModalConfig({ type: "error", title: "File Too Large", message: "Please select an image smaller than 2MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (newPassword && newPassword !== confirmNewPassword) {
      setModalConfig({ type: "error", title: "Password Mismatch", message: "The new password and password confirmation do not match." });
      return;
    }

    const updatedUser = {
      ...user,
      fullName,
      employeeId,
      email,
      phoneNumber,
      rank,
      department,
      bio,
      username,
      avatar,
      twoFactor,
      loginAlerts,
      sessionTimeout,
      ipRestriction,
      language,
      timezone,
      dateFormat,
      timeFormat,
      soundAlerts,
      loopAlarm,
      desktopPush,
      emailDigest,
      smsAlerts,
      agency: department // keep synchronized
    };

    const updatedAgencyConfig = {
      agencyName,
      agencyCode,
      stationUnit,
      jurisdictionArea,
      emergencyHotline,
      dispatchFrequency,
      autoAssign,
      requireSupervisorApproval,
      enableGpsTracking
    };

    // Save to localStorage
    localStorage.setItem("user", JSON.stringify(updatedUser));
    localStorage.setItem("agencyConfig", JSON.stringify(updatedAgencyConfig));

    // Propagate updates to parent component
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }

    setModalConfig({ type: "success", title: "Settings Saved!", message: "All your configurations and preferences have been successfully updated." });
  };

  const handleTestAlert = () => {
    const event = new CustomEvent("simulate-crime-alert", {
      detail: {
        _id: "sim-" + Date.now(),
        incidentId: "INC-2026-999",
        emergencyType: "crime",
        userId: { fullName: "Test Reporter (Simulation)", phoneNumber: "0917-000-0000" },
        location: { name: "Brgy. Obrero, Calbayog City", barangay: "Obrero", street: "San Roque St." },
        description: "This is a simulated test incident to verify the incoming emergency pop-up screen and audio chime alerts.",
        createdAt: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
  };

  const executeDiscard = () => {
    setFullName(user.fullName || "Officer J. Dela Cruz");
    setEmployeeId(user.employeeId || "PNP-2024-001");
    setEmail(user.email || "officer@calbayog.gov.ph");
    setPhoneNumber(user.phoneNumber || "0917-123-4567");
    setRank(user.rank || "Shift Commander");
    setDepartment(user.department || user.agency || "PNP");
    setBio(user.bio || "");
    setAvatar(user.avatar || "");
    setUsername(user.username || user.email || "officer.delacruz@pnp.gov.ph");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");

    setTwoFactor(user.twoFactor || false);
    setLoginAlerts(user.loginAlerts !== false);
    setSessionTimeout(user.sessionTimeout !== false);
    setIpRestriction(user.ipRestriction || false);

    setLanguage(user.language || "English (US)");
    setTimezone(user.timezone || "Asia/Manila (UTC+8)");
    setDateFormat(user.dateFormat || "MM/DD/YYYY");
    setTimeFormat(user.timeFormat || "12-Hour (AM/PM)");
    setSoundAlerts(user.soundAlerts !== false);
    setLoopAlarm(user.loopAlarm !== false);
    setDesktopPush(user.desktopPush !== false);
    setEmailDigest(user.emailDigest || false);
    setSmsAlerts(user.smsAlerts || false);

    try {
      const cfg = JSON.parse(localStorage.getItem("agencyConfig") || "{}");
      setAgencyName(cfg.agencyName || "Philippine National Police");
      setAgencyCode(cfg.agencyCode || user.agency || "PNP");
      setStationUnit(cfg.stationUnit || "Calbayog City Police Station");
      setJurisdictionArea(cfg.jurisdictionArea || "Calbayog City, Samar");
      setEmergencyHotline(cfg.emergencyHotline || "117 / (055) 209-1234");
      setDispatchFrequency(cfg.dispatchFrequency || "10 seconds");
      setAutoAssign(cfg.autoAssign !== false);
      setRequireSupervisorApproval(cfg.requireSupervisorApproval || false);
      setEnableGpsTracking(cfg.enableGpsTracking !== false);
    } catch {
      // ignore
    }
    setModalConfig({ type: "success", title: "Reverted", message: "All values have been restored to your previous save." });
  };

  const handleDiscard = () => {
    setModalConfig({
      type: "confirm",
      title: "Discard Changes?",
      message: "Are you sure you want to revert all unsaved adjustments?",
      confirmText: "Yes, revert",
      onConfirm: () => {
        closeModal();
        executeDiscard();
      }
    });
  };

  const handleDeactivate = () => {
    setModalConfig({
      type: "confirm_danger",
      title: "Deactivate Account?",
      message: "Warning: This will lock your active shift and log you out. Re-activation requires administrator clearance.",
      confirmText: "Yes, deactivate",
      onConfirm: () => {
        setModalConfig({ type: "loading", title: "Deactivating...", message: "Please wait while we deactivate your account..." });
        setTimeout(() => {
          localStorage.removeItem("user");
          window.location.reload();
        }, 1500);
      }
    });
  };

  const handleRevokeSession = (id) => {
    setModalConfig({
      type: "confirm_danger",
      title: "Revoke Session?",
      message: "This device will be immediately logged out of Alerto Calbayog.",
      confirmText: "Revoke",
      onConfirm: () => {
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        localStorage.setItem("activeSessions", JSON.stringify(updated));
        setModalConfig({ type: "success", title: "Session Terminated", message: "The device session was successfully revoked." });
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your profile, account, and system preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-52 shrink-0">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex md:flex-col">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none w-full flex items-center justify-center md:justify-start gap-3 px-4 py-3.5 text-xs md:text-sm font-medium transition-all text-left border-r md:border-r-0 md:border-b border-slate-100 last:border-0 ${
                  activeTab === tab.id
                    ? "bg-blue-50/70 text-[#0a1e3f]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className={`shrink-0 ${activeTab === tab.id ? "text-[#0a1e3f]" : "text-slate-400"}`}>{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* ── PROFILE ── */}
            {activeTab === "profile" && (
              <div>
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-800">Profile Management</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Update your display name, photo, and personal information.</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-slate-100 shrink-0">
                      <img
                        src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || "Officer")}&background=0a1e3f&color=fff&bold=true&size=128`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <button
                        onClick={() => document.getElementById("avatar-upload").click()}
                        className="px-4 py-2 text-xs font-semibold bg-[#0a1e3f] hover:bg-[#07152c] text-white rounded-lg transition-colors shadow-sm"
                      >
                        Change Photo
                      </button>
                      <p className="text-[11px] text-slate-400 mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Employee ID</label>
                      <input
                        type="text"
                        value={employeeId}
                        onChange={e => setEmployeeId(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number</label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rank / Designation</label>
                      <input
                        type="text"
                        value={rank}
                        onChange={e => setRank(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bio / Notes</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Add any notes about your current post or shift parameters..."
                      className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <div>
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-800">Security Settings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your password credentials and run alarm test simulations.</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Change Password Fields */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Change Password</h3>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password..."
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm new password..."
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Alarm / Notification Preferences */}
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Notification Alerts</h3>
                    <div className="space-y-3.5">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={soundAlerts}
                          onChange={e => setSoundAlerts(e.target.checked)}
                          className="mt-0.5 w-4.5 h-4.5 rounded border-slate-300 text-[#0a1e3f] focus:ring-[#0a1e3f]"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Enable Incident Alarm Sound</p>
                          <p className="text-[11px] text-slate-400">Play an alert chime or siren when a new emergency is reported.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={loopAlarm}
                          onChange={e => setLoopAlarm(e.target.checked)}
                          className="mt-0.5 w-4.5 h-4.5 rounded border-slate-300 text-[#0a1e3f] focus:ring-[#0a1e3f]"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Continuous Emergency Siren (Looping)</p>
                          <p className="text-[11px] text-slate-400">Keep sounding the emergency siren continuously until manually clicked or dismissed.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Simulation testing section */}
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Simulation Testing</h3>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 pt-3.5">
                      <p className="text-sm font-semibold text-slate-800 mb-1">Simulate New Incident Alert & Sound</p>
                      <p className="text-xs text-slate-500 mb-3.5">Trigger a simulated incoming incident dispatcher popup to verify system alarms, live notifications, and sound functionalities.</p>
                      <button
                        onClick={handleTestAlert}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#0a1e3f] text-[#0a1e3f] hover:bg-blue-50 text-xs font-bold transition-all"
                      >
                        Simulate Incoming Crime Alert Popup & Sound
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={handleDiscard}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                Discard changes
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-[#0a1e3f] text-white hover:bg-[#07152c] shadow-sm shadow-[#0a1e3f]/20 hover:scale-[1.01]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* ══════════════ SETTINGS MODAL ══════════════ */}
      {modalConfig && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#030d1e]/75 backdrop-blur-sm" onClick={() => modalConfig.type !== 'loading' && closeModal()} />
          <div className="relative z-10 w-full max-w-[420px] rounded-2xl overflow-hidden shadow-[0_32px_80px_-8px_rgba(0,0,0,0.7)] border border-[#1a3a6b]/60 flex flex-col bg-white animate-zoom-in">
            {/* Top strip */}
            <div className={`h-1 w-full bg-gradient-to-r ${
              modalConfig.type === 'error' || modalConfig.type === 'confirm_danger' ? 'from-red-700 to-orange-400' :
              modalConfig.type === 'success' ? 'from-emerald-600 to-teal-400' : 'from-[#0a1e3f] to-blue-500'
            }`} />
            
            <div className="bg-[#0a1e3f] px-6 py-4 flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                {modalConfig.type === 'success' ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : modalConfig.type === 'error' || modalConfig.type === 'confirm_danger' ? (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                ) : modalConfig.type === 'loading' ? (
                  <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                )}
              </div>
              <div>
                <h3 className="text-white font-black text-sm tracking-wide uppercase">{modalConfig.title}</h3>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Settings notification</p>
              </div>
            </div>

            <div className="p-6 bg-[#f8fafc]">
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                {modalConfig.message}
              </p>
            </div>

            {modalConfig.type !== 'loading' && (
              <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                {(modalConfig.type === 'confirm' || modalConfig.type === 'confirm_danger') && (
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-[13px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                
                {modalConfig.type === 'confirm_danger' ? (
                  <button
                    onClick={modalConfig.onConfirm}
                    className="px-5 py-2 rounded-lg text-[13px] font-black text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all uppercase tracking-wide shadow-lg shadow-red-600/20"
                  >
                    {modalConfig.confirmText}
                  </button>
                ) : modalConfig.type === 'confirm' ? (
                  <button
                    onClick={modalConfig.onConfirm}
                    className="px-5 py-2 rounded-lg text-[13px] font-black text-white bg-[#0a1e3f] hover:bg-emerald-600 active:scale-95 transition-all uppercase tracking-wide shadow-lg shadow-[#0a1e3f]/20 hover:shadow-emerald-600/30"
                  >
                    {modalConfig.confirmText}
                  </button>
                ) : (
                  <button
                    onClick={closeModal}
                    className="px-5 py-2 rounded-lg text-[13px] font-black text-white bg-[#0a1e3f] active:scale-95 transition-all uppercase tracking-wide shadow-lg shadow-[#0a1e3f]/20"
                  >
                    OK
                  </button>
                )}
              </div>
            )}
            
            {/* Bottom strip */}
            <div className={`h-1 w-full bg-gradient-to-r ${
              modalConfig.type === 'error' || modalConfig.type === 'confirm_danger' ? 'from-red-700 to-orange-400' :
              modalConfig.type === 'success' ? 'from-emerald-600 to-teal-400' : 'from-[#0a1e3f] to-blue-500'
            }`} />
          </div>
        </div>
      )}
    </div>
  );
};
