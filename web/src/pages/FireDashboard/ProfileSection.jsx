import { useState } from "react";
import { shellCard, innerCard, SectionHeader } from "./SharedUI.jsx";

export function ProfileSection() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "Jasper Alerto",
    role: "Emergency Ops Lead",
    description: "Head of City Operations. Coordinating fire response units and managing city-wide emergency synchronization.",
    rank: "Ops Commander",
    shift: "08:00 - 20:00",
    net: "Full Admin",
    id: "AC-5829-01"
  });

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
  };

  return (
    <section id="profile" className={shellCard}>
      <div className="p-6 sm:p-10 lg:p-16">
        <SectionHeader
          title={isEditing ? "Edit terminal profile" : "Account profile"}
          action={
            !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-black shadow-lg shadow-slate-900/20 active:scale-95"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profile
              </button>
            )
          }
        />

        <div className="flex justify-center">
          {isEditing ? (
            <form onSubmit={handleSave} className="w-full max-w-3xl rounded-[40px] border border-slate-100 bg-white p-8 sm:p-12 shadow-2xl shadow-slate-200/50">
               <div className="grid gap-8">
                  <div className="grid gap-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Operational Name</label>
                    <input 
                      className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 text-sm font-bold text-slate-900 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/5 transition-all"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Designated Role</label>
                    <input 
                      className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 text-sm font-bold text-slate-900 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/5 transition-all"
                      value={profileData.role}
                      onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mission Description</label>
                    <textarea 
                      className="h-32 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/5 transition-all resize-none"
                      value={profileData.description}
                      onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                      type="submit"
                      className="flex-1 h-14 rounded-2xl bg-red-600 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95"
                    >
                      Update Terminal Data
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="h-14 px-10 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
               </div>
            </form>
          ) : (
            <article className="rounded-[40px] border border-slate-100 bg-white p-8 sm:p-12 w-full max-w-3xl shadow-2xl shadow-slate-200/50 transition-all">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 lg:gap-10">
                <div className="grid h-24 w-24 sm:h-32 sm:w-32 shrink-0 place-items-center rounded-[40px] bg-red-600 text-3xl sm:text-4xl font-black text-white shadow-2xl shadow-red-600/20">
                  {profileData.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0 text-center sm:text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-2">{profileData.role}</p>
                  <h3 className="font-display text-3xl sm:text-4xl font-black tracking-tighter text-slate-900">
                    {profileData.name}
                  </h3>
                  <p className="mt-4 text-base sm:text-lg font-bold text-slate-600 leading-relaxed">
                    {profileData.description}
                  </p>
                </div>
              </div>

              <div className="mt-12 grid gap-4 sm:gap-6 sm:grid-cols-2">
                {[
                  { id: "rank", label: "Operational Rank", value: profileData.rank },
                  { id: "shift", label: "Current Shift", value: profileData.shift },
                  { id: "net", label: "Network Access", value: profileData.net },
                  { id: "id", label: "Responder ID", value: profileData.id },
                ].map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-50 bg-slate-50 px-6 py-5 hover:bg-white hover:border-slate-100 transition-all group">
                    <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-red-600">{item.label}</span>
                    <strong className="mt-2 block text-sm font-black text-slate-900">{item.value}</strong>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

