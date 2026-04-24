import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="w-full bg-[#0f172a] text-slate-500 py-6 px-8 border-t border-slate-800/50 mt-auto">
      <div className="mx-auto max-w-7xl flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-600 shadow-lg shadow-red-600/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4 text-white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-base font-black tracking-tighter text-white uppercase italic">Alerto Calbayog</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
             <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-600" /> Sector Alpha, Calbayog City</span>
             <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-slate-700" /> Lead Operations Dispatcher</span>
          </div>
        </div>

        <div className="flex gap-6 items-center py-2">
          <a href="#" className="text-slate-600 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="#" className="text-slate-600 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
          </a>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-[9px] font-bold text-slate-700 dark:text-slate-600 uppercase tracking-widest">© 2026 Alerto Systems Command Center. All Protocols Observed.</p>
        </div>
      </div>
    </footer>
  );
}
