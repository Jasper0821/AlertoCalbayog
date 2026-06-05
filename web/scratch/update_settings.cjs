const fs = require('fs');
const path = 'c:/Users/jcome/AlertoCalbayog/web/src/pages/AGENCY/PNP/Settings.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove Swal import
content = content.replace('import Swal from "sweetalert2";\n', '');

// 2. Add state
content = content.replace('const [activeTab, setActiveTab] = useState("profile");', 'const [activeTab, setActiveTab] = useState("profile");\n  const [modalConfig, setModalConfig] = useState(null);\n  const closeModal = () => setModalConfig(null);');

// 3. handleAvatarChange
content = content.replace(/Swal\.fire\(\{\s*title: "File Too Large"[\s\S]*?\}\);/, 
  'setModalConfig({ type: "error", title: "File Too Large", message: "Please select an image smaller than 2MB." });');

// 4. handleSave
content = content.replace(/Swal\.fire\(\{\s*title: "Password Mismatch"[\s\S]*?\}\);/,
  'setModalConfig({ type: "error", title: "Password Mismatch", message: "The new password and password confirmation do not match." });');

content = content.replace(/Swal\.fire\(\{\s*title: "Settings Saved!"[\s\S]*?\}\);/,
  'setModalConfig({ type: "success", title: "Settings Saved!", message: "All your configurations and preferences have been successfully updated." });');

// 5. handleDiscard
const discardReplace = `const executeDiscard = () => {
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
  };`;

content = content.replace(/const handleDiscard = \(\) => \{[\s\S]*?\}\);\n  \};/, discardReplace);

// 6. handleDeactivate
const deactivateReplace = `const handleDeactivate = () => {
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
  };`;

content = content.replace(/const handleDeactivate = \(\) => \{[\s\S]*?\}\);\n  \};/, deactivateReplace);

// 7. handleRevokeSession
const revokeReplace = `const handleRevokeSession = (id) => {
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
  };`;

content = content.replace(/const handleRevokeSession = \(id\) => \{[\s\S]*?\}\);\n  \};/, revokeReplace);

// 8. Inject Modal JSX
const modalJsx = `

      {/* ══════════════ SETTINGS MODAL ══════════════ */}
      {modalConfig && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#030d1e]/75 backdrop-blur-sm" onClick={() => modalConfig.type !== 'loading' && closeModal()} />
          <div className="relative z-10 w-full max-w-[420px] rounded-2xl overflow-hidden shadow-[0_32px_80px_-8px_rgba(0,0,0,0.7)] border border-[#1a3a6b]/60 flex flex-col bg-white animate-zoom-in">
            {/* Top strip */}
            <div className={\`h-1 w-full bg-gradient-to-r \${
              modalConfig.type === 'error' || modalConfig.type === 'confirm_danger' ? 'from-red-700 to-orange-400' :
              modalConfig.type === 'success' ? 'from-emerald-600 to-teal-400' : 'from-[#0a1e3f] to-blue-500'
            }\`} />
            
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
            <div className={\`h-1 w-full bg-gradient-to-r \${
              modalConfig.type === 'error' || modalConfig.type === 'confirm_danger' ? 'from-red-700 to-orange-400' :
              modalConfig.type === 'success' ? 'from-emerald-600 to-teal-400' : 'from-[#0a1e3f] to-blue-500'
            }\`} />
          </div>
        </div>
      )}
    </div>
  );
};
`;

content = content.replace(/    <\/div>\n  \);\n\}\n/m, modalJsx);

fs.writeFileSync(path, content);
