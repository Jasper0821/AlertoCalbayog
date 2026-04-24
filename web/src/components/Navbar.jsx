import { useState } from "react";
import { Link } from "react-router-dom";
import { toggleDarkMode } from "../theme";
import { SunIcon, MoonIcon } from "../icons";

export function Navbar() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleTheme = () => {
    const newState = toggleDarkMode();
    setIsDark(newState);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 transition-all duration-300">
      <div className="mx-auto flex h-20 items-center justify-between px-6 sm:px-8 max-w-7xl">
        <Link to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-xl font-black tracking-tighter uppercase whitespace-nowrap"><span className="text-red-600 italic">Alerto</span> Calbayog</p>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={handleToggleTheme}
            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            aria-label="Toggle theme"
          >
            {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          <Link 
            to="/login" 
            className="h-12 px-6 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 transition-all flex items-center justify-center"
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className="h-12 px-8 rounded-xl bg-slate-900 dark:bg-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center whitespace-nowrap"
          >
            Register Now
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={handleToggleTheme}
            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400"
          >
            {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900"
            aria-label="Toggle menu"
          >
            <div className="relative h-4 w-4">
               <span className={`absolute block h-0.5 w-4 bg-current transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : 'translate-y-0'}`} />
               <span className={`absolute block h-0.5 w-4 bg-current transition-all duration-300 top-1.5 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
               <span className={`absolute block h-0.5 w-4 bg-current transition-all duration-300 top-3 ${isOpen ? '-rotate-45 -translate-y-1.5' : 'translate-y-0'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-64 opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}>
        <div className="flex flex-col p-6 gap-4">
          <Link 
            to="/login" 
            onClick={() => setIsOpen(false)}
            className="flex h-12 items-center justify-center rounded-xl border-2 border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
          >
            Login
          </Link>
          <Link 
            to="/register" 
            onClick={() => setIsOpen(false)}
            className="flex h-12 items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900"
          >
            Register Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
