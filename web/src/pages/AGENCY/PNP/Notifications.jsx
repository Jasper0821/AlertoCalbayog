export default function Notifications() {
 return (
 <div className="flex flex-col items-center justify-center h-full text-slate-400 min-h-[60vh] transition-opacity duration-500">
 <svg className="w-20 h-20 mb-5 opacity-20 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
 <h2 className="text-2xl font-black text-slate-800 tracking-tight">Notifications</h2>
 <p className="text-sm mt-2 text-slate-500">System alerts and incoming broadcasts.</p>
 </div>
 );
}
