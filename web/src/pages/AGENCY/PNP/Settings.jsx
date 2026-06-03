import { useState } from "react";

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
    id: "account",
    label: "Account",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
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
  {
    id: "preferences",
    label: "Preferences",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "agency",
    label: "Agency Config",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.33l-7.5-5-7.5 5V21M3 21h18M12 9h.008v.008H12V9z" />
      </svg>
    ),
  },
];

export default function Settings({ user = {}, agency = "PNP" }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your profile, account, and system preferences.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-52 shrink-0">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all text-left border-b border-slate-100 last:border-0 ${
                  activeTab === tab.id
                    ? "bg-blue-50/70 text-[#0a1e3f]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className="shrink-0 text-slate-400 group-hover:text-[#0a1e3f]">{tab.icon}</span>
                {tab.label}
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
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-slate-100">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || "Officer")}&background=0a1e3f&color=fff&bold=true&size=128`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <button className="px-4 py-2 text-xs font-semibold bg-[#0a1e3f] hover:bg-[#07152c] text-white rounded-lg transition-colors shadow-sm">
                        Change Photo
                      </button>
                      <p className="text-[11px] text-slate-400 mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Full Name", defaultVal: user.fullName || "Officer J. Dela Cruz" },
                      { label: "Employee ID", defaultVal: "PNP-2024-001" },
                      { label: "Email Address", defaultVal: user.email || "officer@calbayog.gov.ph" },
                      { label: "Phone Number", defaultVal: user.phoneNumber || "09XX-XXX-XXXX" },
                      { label: "Rank / Designation", defaultVal: "Shift Commander" },
                      { label: "Department", defaultVal: agency },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                        <input
                          type="text"
                          defaultValue={f.defaultVal}
                          className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bio / Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Optional notes about your role or shift..."
                      className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── ACCOUNT ── */}
            {activeTab === "account" && (
              <div>
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-800">Account Settings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your login credentials and account preferences.</p>
                </div>
                <div className="p-6 space-y-5">
                  {[
                    { label: "Username / Login ID", val: user.email || "officer.delacruz@pnp.gov.ph" },
                    { label: "Current Password", val: "••••••••••••", type: "password" },
                    { label: "New Password", val: "", type: "password", placeholder: "Enter new password..." },
                    { label: "Confirm New Password", val: "", type: "password", placeholder: "Confirm new password..." },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                      <input
                        type={f.type || "text"}
                        defaultValue={f.val}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                  ))}

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-700 mb-3">Danger Zone</p>
                    <button className="px-4 py-2 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      Deactivate Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <div>
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-800">Security Settings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Configure two-factor authentication and session management.</p>
                </div>
                <div className="p-6 space-y-5">
                  {[
                    { title: "Two-Factor Authentication", desc: "Require a verification code on every login.", enabled: false },
                    { title: "Login Alerts", desc: "Send email alerts for new logins.", enabled: true },
                    { title: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity.", enabled: true },
                    { title: "IP Restriction", desc: "Only allow access from approved IP addresses.", enabled: false },
                  ].map(s => (
                    <div key={s.title} className="flex items-start justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                      </div>
                      <button className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${s.enabled ? "bg-[#0a1e3f]" : "bg-slate-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5 ${s.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  ))}

                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Active Sessions</p>
                    {[
                      { browser: "Chrome on Windows", loc: "Calbayog City, PH", time: "Now — Current session", active: true },
                      { browser: "Firefox on Android", loc: "Samar, PH", time: "2 hours ago", active: false },
                    ].map(sess => (
                      <div key={sess.browser} className="flex items-center justify-between py-2.5 border-b border-slate-200 last:border-0">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{sess.browser}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{sess.loc} · {sess.time}</p>
                        </div>
                        {!sess.active && (
                          <button className="text-[10px] font-bold text-red-500 hover:text-red-600 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors">
                            Revoke
                          </button>
                        )}
                        {sess.active && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">Active</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PREFERENCES ── */}
            {activeTab === "preferences" && (
              <div>
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-800">System Preferences</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Adjust display, notification, and operational preferences.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Language", opts: ["English (US)", "Filipino"] },
                      { label: "Timezone", opts: ["Asia/Manila (UTC+8)", "UTC"] },
                      { label: "Date Format", opts: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] },
                      { label: "Time Format", opts: ["12-Hour (AM/PM)", "24-Hour"] },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                        <select className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all">
                          {f.opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-slate-700">Notification Preferences</p>
                    {[
                      { label: "Sound alerts on new incident", on: true },
                      { label: "Desktop push notifications", on: true },
                      { label: "Email digest (daily)", on: false },
                      { label: "SMS alerts for critical incidents", on: false },
                    ].map(p => (
                      <label key={p.label} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                        <span className="text-sm text-slate-700">{p.label}</span>
                        <input type="checkbox" defaultChecked={p.on} className="w-4 h-4 rounded text-[#0a1e3f] border-slate-300 focus:ring-blue-400" />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── AGENCY CONFIG ── */}
            {activeTab === "agency" && (
              <div>
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-800">Agency Configuration</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Configure agency-level settings and operational parameters.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Agency Name", val: "Philippine National Police" },
                      { label: "Agency Code", val: agency },
                      { label: "Station / Unit", val: "Calbayog City Police Station" },
                      { label: "Jurisdiction Area", val: "Calbayog City, Samar" },
                      { label: "Emergency Hotline", val: "117 / (055) 209-1234" },
                      { label: "Dispatch Frequency", val: "10 seconds" },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                        <input
                          type="text"
                          defaultValue={f.val}
                          className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-slate-700">Operational Toggles</p>
                    {[
                      { label: "Auto-assign nearest unit to new incident", on: true },
                      { label: "Require supervisor approval for closing incidents", on: false },
                      { label: "Enable real-time GPS tracking of units", on: true },
                    ].map(p => (
                      <label key={p.label} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                        <span className="text-sm text-slate-700">{p.label}</span>
                        <input type="checkbox" defaultChecked={p.on} className="w-4 h-4 rounded text-[#0a1e3f] border-slate-300 focus:ring-blue-400" />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
                Discard changes
              </button>
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                  saved
                    ? "bg-emerald-600 text-white shadow-emerald-600/20"
                    : "bg-[#0a1e3f] text-white hover:bg-[#07152c] shadow-[#0a1e3f]/20"
                }`}
              >
                {saved ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
