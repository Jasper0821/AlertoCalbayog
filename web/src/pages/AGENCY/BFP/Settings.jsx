import { useState, useEffect } from "react";
import api from "../../../api/axios.js";
import { clearDashboardNavigationState } from "../../../utils/dashboardSession.js";

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

  // Security & Preferences
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [loopAlarm, setLoopAlarm] = useState(true);

  // Load from props on mount/change
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "BFP Marshal");
      setEmployeeId(user.employeeId || "BFP-2024-001");
      setEmail(user.email || "bfp@calbayog.gov.ph");
      setPhoneNumber(user.phoneNumber || "0917-000-0000");
      setRank(user.rank || "Fire Marshal");
      setDepartment(user.department || user.agency || "BFP");
      setBio(user.bio || "");
      setAvatar(user.avatar || "");
      setUsername(user.username || user.email || "bfp@calbayog.gov.ph");
      setSoundAlerts(user.soundAlerts !== false);
      setLoopAlarm(user.loopAlarm !== false);
    }
  }, [user]);

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

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmNewPassword) {
      setModalConfig({ type: "error", title: "Password Mismatch", message: "The new password and password confirmation do not match." });
      return;
    }

    const payload = {
      fullName,
      employeeId,
      email,
      phoneNumber,
      rank,
      department,
      bio,
      username,
      avatar,
      soundAlerts,
      loopAlarm,
      agency: department
    };

    if (newPassword) {
      payload.password = newPassword;
    }

    try {
      const res = await api.put("/users/profile", payload);
      
      const updatedUser = {
        ...user,
        ...res.data.user
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      setNewPassword("");
      setConfirmNewPassword("");
      setCurrentPassword("");
      
      setModalConfig({ type: "success", title: "Settings Saved!", message: "All your configurations and preferences have been successfully updated." });
    } catch (err) {
      setModalConfig({ type: "error", title: "Save Failed", message: err.response?.data?.message || "Failed to update profile on server." });
    }
  };

  const handleTestAlert = () => {
    const event = new CustomEvent("simulate-emergency-alert", {
      detail: {
        _id: "sim-" + Date.now(),
        incidentId: "INC-2026-FIRE",
        emergencyType: "fire",
        userId: { fullName: "Test Resident (Fire Simulation)", phoneNumber: "0917-111-2222" },
        location: { name: "Brgy. East Awang, Calbayog City", barangay: "East Awang", street: "Magsaysay Blvd." },
        description: "Simulated structural fire alert to verify BFP command center pop-up screen and alarm siren.",
        createdAt: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">BFP Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your station profile, security credentials, and alarm preferences.</p>
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
                    ? "bg-red-50 text-[#7f1d1d]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className={`shrink-0 ${activeTab === tab.id ? "text-[#7f1d1d]" : "text-slate-400"}`}>{tab.icon}</span>
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
                  <p className="text-xs text-slate-500 mt-0.5">Update your display name, photo, and officer information.</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-slate-100 shrink-0">
                      <img
                        src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || "Officer")}&background=7f1d1d&color=fff&bold=true&size=128`}
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
                        className="px-4 py-2 text-xs font-semibold bg-[#7f1d1d] hover:bg-[#991b1b] text-white rounded-lg transition-colors shadow-sm"
                      >
                        Change Photo
                      </button>
                      <p className="text-[11px] text-slate-400 mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 relative">
                    <div className="relative z-10">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                      <div className="flex items-center px-4 py-3.5 bg-white border border-slate-200/70 rounded-xl shadow-sm opacity-90 cursor-not-allowed">
                        <span className="text-sm font-bold text-slate-700">{fullName || "—"}</span>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Employee ID</label>
                      <div className="flex items-center px-4 py-3.5 bg-white border border-slate-200/70 rounded-xl shadow-sm opacity-90 cursor-not-allowed">
                        <span className="text-sm font-bold text-slate-700">{employeeId || "—"}</span>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3.5 text-sm font-bold text-slate-800 bg-white border border-red-200 rounded-xl focus:border-[#7f1d1d] focus:ring-2 focus:ring-red-100 outline-none transition-all"
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="relative z-10">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                      <div className="flex items-center px-4 py-3.5 bg-white border border-slate-200/70 rounded-xl shadow-sm opacity-90 cursor-not-allowed">
                        <span className="text-sm font-bold text-slate-700">{phoneNumber || "—"}</span>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Rank / Designation</label>
                      <div className="flex items-center px-4 py-3.5 bg-white border border-slate-200/70 rounded-xl shadow-sm opacity-90 cursor-not-allowed">
                        <span className="text-sm font-bold text-slate-700">{rank || "—"}</span>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Agency Type</label>
                      <div className="flex items-center px-4 py-3.5 bg-white border border-slate-200/70 rounded-xl shadow-sm opacity-90 cursor-not-allowed">
                        <span className="text-sm font-bold text-slate-700">{department || "BFP"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <div>
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-800">Security Settings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your credentials and test fire alarm alerts.</p>
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
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#7f1d1d] focus:ring-2 focus:ring-red-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password..."
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#7f1d1d] focus:ring-2 focus:ring-red-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm new password..."
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#7f1d1d] focus:ring-2 focus:ring-red-100 outline-none transition-all"
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
                          className="mt-0.5 w-4.5 h-4.5 rounded border-slate-300 text-[#7f1d1d] focus:ring-[#7f1d1d]"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Enable Incident Alarm Sound</p>
                          <p className="text-[11px] text-slate-400">Play an alert chime or siren when a new fire emergency is reported.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={loopAlarm}
                          onChange={e => setLoopAlarm(e.target.checked)}
                          className="mt-0.5 w-4.5 h-4.5 rounded border-slate-300 text-[#7f1d1d] focus:ring-[#7f1d1d]"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Continuous Fire Siren (Looping)</p>
                          <p className="text-[11px] text-slate-400">Keep sounding the emergency fire siren continuously until acknowledged.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Simulation testing section */}
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Simulation Testing</h3>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 pt-3.5">
                      <p className="text-sm font-semibold text-slate-800 mb-1">Simulate Incoming Fire Alert & Sound</p>
                      <p className="text-xs text-slate-500 mb-3.5">Trigger a simulated incoming fire report popup to verify system alarms and sound alerts.</p>
                      <button
                        onClick={handleTestAlert}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#7f1d1d] text-[#7f1d1d] hover:bg-red-50 text-xs font-bold transition-all"
                      >
                        Simulate Incoming Fire Alert Popup & Sound
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setModalConfig({ type: "success", title: "Reverted", message: "Values restored." })}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                Discard changes
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-[#7f1d1d] text-white hover:bg-[#991b1b] shadow-sm shadow-[#7f1d1d]/20 hover:scale-[1.01]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalConfig && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#030d1e]/75 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col bg-white">
            <div className={`h-1 w-full bg-gradient-to-r ${modalConfig.type === 'error' ? 'from-red-700 to-orange-400' : 'from-emerald-600 to-teal-400'}`} />
            <div className="bg-[#7f1d1d] px-6 py-4 flex items-center gap-4 shrink-0">
              <div>
                <h3 className="text-white font-black text-sm uppercase">{modalConfig.title}</h3>
              </div>
            </div>
            <div className="p-6 bg-[#f8fafc]">
              <p className="text-slate-600 text-sm font-medium">{modalConfig.message}</p>
            </div>
            <div className="bg-white border-t border-slate-100 px-6 py-4 flex justify-end">
              <button onClick={closeModal} className="px-5 py-2 rounded-lg text-xs font-black text-white bg-[#7f1d1d]">OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
