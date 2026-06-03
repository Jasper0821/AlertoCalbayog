const fs = require('fs');
const path = 'c:/Users/jcome/AlertoCalbayog/web/src/pages/AGENCY/CDRRMO/Dashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add useRef and Swal
content = content.replace(
  'import { useEffect, useState } from "react";',
  'import { useEffect, useState, useRef } from "react";\nimport Swal from "sweetalert2";'
);

// 2. Add state and audio refs
const stateVars = `
  const [activeAlert, setActiveAlert] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState("Ambulance 1");
  const [dispatchNote, setDispatchNote] = useState("");
  const alarmSirenRef = useRef(null);

  const playSiren = () => {
    try {
      stopSiren();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      
      lfo.frequency.value = 0.5;
      lfoGain.gain.value = 250;
      
      osc.type = "triangle";
      osc.frequency.value = 750;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      
      osc.start();
      lfo.start();

      alarmSirenRef.current = { audioCtx, osc, lfo, gain };
    } catch (err) {
      console.warn("Failed to play siren:", err);
    }
  };

  const stopSiren = () => {
    if (alarmSirenRef.current) {
      try {
        alarmSirenRef.current.osc.stop();
        alarmSirenRef.current.lfo.stop();
        alarmSirenRef.current.audioCtx.close();
      } catch (e) {}
      alarmSirenRef.current = null;
    }
  };

  const closeAlert = () => {
    setActiveAlert(null);
    stopSiren();
  };

  useEffect(() => {
    return () => stopSiren();
  }, []);

  const handleDispatchSubmit = async () => {
    if (!activeAlert) return;
    try {
      await api.put(\`/emergency/\${activeAlert._id}\`, { status: "active" });
      setReports(prev => prev.map(r => r._id === activeAlert._id ? { ...r, status: "active" } : r));
    } catch (err) {
      console.warn(err);
    }
    setActiveAlert(null);
    stopSiren();
    setSelectedUnit("Ambulance 1");
    setDispatchNote("");
    setActiveSection("queuing");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "#queuing");
    }
  };
`;

content = content.replace(
  'const [isOffline, setIsOffline] = useState(false);',
  'const [isOffline, setIsOffline] = useState(false);\n' + stateVars
);

// 3. Update Socket listener
const socketListener = `
    socket.on("newEmergencyAlert", (newReport) => {
      console.log("📡 CDRRMO received real-time alert:", newReport);
      setReports((prev) => {
        if (prev.some(r => r._id === newReport._id)) return prev;
        return [newReport, ...prev];
      });
      playSiren();
      setActiveAlert(newReport);
    });
`;

content = content.replace(
  /socket\.on\("newEmergencyAlert", \(newReport\) => \{[\s\S]*?\}\);/,
  socketListener.trim()
);


// 4. Update Render
const modalJsx = `
    <>
      <AgencyShell activeSection={activeSection} onNavigate={handleNavClick} agency={agency}>
        {activeSection === "dashboard" && <OverviewSection reports={reports} isOffline={isOffline} />}
        {activeSection === "map-report" && <MapSection reports={reports} isOffline={isOffline} />}
        {activeSection === "reported-incidents" && <ReportsSection reports={reports} />}
        {activeSection === "queuing" && <QueueSection reports={reports} />}
        {activeSection === "profile" && <ProfileSection />}
      </AgencyShell>

      {/* ═══════════════════════════════════════════════════════
           🚨  PROFESSIONAL EMERGENCY ALERT DISPATCH MODAL 🚨
          ═══════════════════════════════════════════════════════ */}
      {activeAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#030d1e]/75 backdrop-blur-sm" onClick={closeAlert} />
          <div className="absolute inset-0 pointer-events-none alert-vignette" style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(185,28,28,0.55) 100%)" }} />
          <div className="absolute left-0 right-0 h-[2px] pointer-events-none alert-scan-line" style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)" }} />

          <div className="alert-modal-card relative z-10 w-full max-w-[520px] rounded-2xl overflow-hidden shadow-[0_32px_80px_-8px_rgba(0,0,0,0.7)] border border-[#1a3a6b]/60 flex flex-col">
            <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400" />
            <div className="bg-[#0a1e3f] px-6 pt-5 pb-4 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-black uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-white alert-live-dot inline-block" />LIVE
                    </span>
                    <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">Incoming Report</span>
                  </div>
                  <h3 className="text-white font-black text-base tracking-wide uppercase leading-tight">Emergency Incident Alert</h3>
                  <p className="text-white/50 text-[11px] mt-0.5 font-medium">CDRRMO / BFP Command Center</p>
                </div>
              </div>
              <button onClick={closeAlert} className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="bg-[#0d2550] px-6 py-2.5 flex items-center justify-between border-t border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 alert-live-dot" />
                <span className="text-red-400 font-black text-xs uppercase tracking-widest">{activeAlert.emergencyType || "Emergency"}</span>
              </div>
              <span className="text-white/40 text-[11px] font-semibold tabular-nums">
                {new Date(activeAlert.createdAt || Date.now()).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>

            <div className="bg-[#f8fafc] overflow-y-auto max-h-[52vh]">
              <div className="px-6 py-5 space-y-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Incident Information</p>
                {[
                  { label: "Complainant", value: activeAlert.userId?.fullName || activeAlert.name || "Anonymous", bold: true },
                  { label: "Contact No.", value: activeAlert.userId?.phoneNumber || activeAlert.phoneNumber || "N/A", mono: true },
                  { label: "Location", value: \`\${activeAlert.location?.barangay || activeAlert.barangay || "Unknown Barangay"}, \${activeAlert.location?.street || activeAlert.street || "N/A"}\` }
                ].map(({ label, value, bold, mono }) => (
                  <div key={label} className="flex items-baseline gap-3 py-2.5 border-b border-slate-100 last:border-0">
                    <span className="w-28 shrink-0 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                    <span className={\`flex-1 text-sm text-slate-800 \${bold ? "font-bold" : "font-medium"} \${mono ? "font-mono text-[#0a1e3f]" : ""}\`}>{value}</span>
                  </div>
                ))}
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Incident Narrative</p>
                  <p className="text-slate-700 text-[13px] leading-relaxed italic">"\${activeAlert.description || "No description provided."}"</p>
                </div>
              </div>

              <div className="mx-5 mb-5 rounded-xl border border-[#0a1e3f]/15 overflow-hidden">
                <div className="bg-[#0a1e3f] px-4 py-2.5 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/80">Dispatch Assignment</p>
                </div>
                <div className="bg-white px-4 py-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Responding Unit</label>
                    <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-lg bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-[#0a1e3f]/10 outline-none transition-all cursor-pointer font-semibold">
                      <option value="Ambulance 1">Ambulance 1 — CDRRMO Alpha</option>
                      <option value="Ambulance 2">Ambulance 2 — CDRRMO Bravo</option>
                      <option value="Firetruck 1">Firetruck 1 — BFP Central</option>
                      <option value="Rescue Boat">Rescue Boat — Flood Team</option>
                      <option value="Search and Rescue">Search and Rescue Team</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Field Orders / Notes</label>
                    <textarea rows={2} value={dispatchNote} onChange={e => setDispatchNote(e.target.value)} placeholder="Enter special instructions (optional)..." className="w-full px-3 py-2 text-[13px] text-slate-800 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-[#0a1e3f] focus:ring-2 focus:ring-[#0a1e3f]/10 outline-none transition-all resize-none placeholder:text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
              <button onClick={closeAlert} className="text-[13px] font-semibold text-slate-400 hover:text-slate-600 transition-colors tracking-wide">Dismiss</button>
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-[10px] text-slate-400 italic">Action will be logged</span>
                <button onClick={handleDispatchSubmit} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-black text-white bg-[#0a1e3f] hover:bg-[#0d2650] active:scale-95 shadow-lg shadow-[#0a1e3f]/30 transition-all tracking-wide uppercase">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                  Dispatch Now
                </button>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400" />
          </div>
        </div>
      )}
    </>
`;

content = content.replace(
  /<AgencyShell[\s\S]*?<\/AgencyShell>/,
  modalJsx.trim()
);

fs.writeFileSync(path, content);
