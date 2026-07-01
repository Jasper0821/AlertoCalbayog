import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLink = (to, label) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`text-[15px] font-medium pb-1 transition-all duration-150 active:scale-95 active:opacity-80 transform inline-block ${isActive
            ? "text-white font-semibold border-b-2 border-white"
            : "text-slate-400 hover:text-white border-b-2 border-transparent hover:border-slate-500"
          }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0f172a] backdrop-blur-xl border-b border-slate-800 transition-all duration-300">
      <div className="mx-auto flex h-16 items-center justify-between px-6 sm:px-10 max-w-7xl">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 transition-transform duration-150 active:scale-[0.97] transform" onClick={() => setIsOpen(false)}>
          <img
            src="/logo.png"
            alt="Alerto Calbayog Logo"
            className="h-11 w-11 object-contain"
          />
          <span className="text-xl font-bold tracking-tight text-white">Alerto Calbayog</span>
        </Link>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {navLink("/services", "Services")}
          {navLink("/about", "About")}
          {navLink("/contact", "Contact")}
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="flex h-9 items-center justify-center px-6 rounded-md border-[1.5px] border-dashed border-slate-400 text-[13px] font-bold text-slate-200 hover:border-white hover:text-white transition-all duration-150 active:scale-95 transform"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="flex h-9 items-center justify-center px-6 rounded-md bg-white text-[13px] font-bold text-[#0a1e3f] hover:bg-slate-100 transition-all duration-150 active:scale-95 transform"
          >
            Register
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-3">

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="grid h-8 w-8 place-items-center text-white transition-all duration-150 active:scale-90 transform"
            aria-label="Toggle menu"
          >
            <div className="relative h-4 w-4">
              <span className={`absolute block h-[2px] w-4 bg-current transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : 'translate-y-0'}`} />
              <span className={`absolute block h-[2px] w-4 bg-current transition-all duration-300 top-1.5 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
              <span className={`absolute block h-[2px] w-4 bg-current transition-all duration-300 top-3 ${isOpen ? '-rotate-45 -translate-y-1.5' : 'translate-y-0'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Content */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-[#0f172a] border-b border-slate-800 transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}>
        <div className="flex flex-col p-6 gap-4 text-center">
          <Link to="/services" onClick={() => setIsOpen(false)} className="text-[15px] font-semibold text-slate-200 hover:text-white py-2 transition-all duration-150 active:scale-95 transform">Services</Link>
          <Link to="/about" onClick={() => setIsOpen(false)} className="text-[15px] font-medium text-slate-400 hover:text-white py-2 transition-all duration-150 active:scale-95 transform">About</Link>
          <Link to="/contact" onClick={() => setIsOpen(false)} className="text-[15px] font-medium text-slate-400 hover:text-white py-2 transition-all duration-150 active:scale-95 transform">Contact</Link>
          <div className="h-px bg-slate-800 my-2"></div>
          <Link
            to="/login"
            onClick={() => setIsOpen(false)}
            className="flex h-10 items-center justify-center rounded-md border-[1.5px] border-dashed border-slate-400 text-[14px] font-bold text-slate-200 hover:border-white hover:text-white transition-all duration-150 active:scale-95 transform"
          >
            Login
          </Link>
          <Link
            to="/register"
            onClick={() => setIsOpen(false)}
            className="flex h-10 items-center justify-center rounded-md bg-white text-[14px] font-bold text-[#0a1e3f] hover:bg-slate-100 transition-all duration-150 active:scale-95 transform"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
