import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0f172a] text-slate-400 py-8 px-6 sm:px-10 border-t border-slate-800/60 mt-auto transition-colors duration-300">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        
        {/* Left Side: Brand and Copyright */}
        <div className="flex flex-col text-left">
          <h3 className="text-[17px] font-bold text-white tracking-tight">
            Alerto Calbayog
          </h3>
          <p className="text-[12px] text-slate-500 mt-1">
            © {currentYear} Alerto Calbayog Emergency Response System. All Rights Reserved. Official Government Portal.
          </p>
        </div>

        {/* Right Side: Navigation & Social Links */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 md:gap-8">
          
          {/* Navigation Links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-400">
            <a 
              href="#" 
              className="hover:text-white hover:underline transition-colors duration-150 active:scale-95 transform inline-block"
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              className="hover:text-white hover:underline transition-colors duration-150 active:scale-95 transform inline-block"
            >
              Terms of Service
            </a>
            <a 
              href="#" 
              className="hover:text-white hover:underline transition-colors duration-150 active:scale-95 transform inline-block"
            >
              Emergency Protocols
            </a>
            <a 
              href="#" 
              className="hover:text-white hover:underline transition-colors duration-150 active:scale-95 transform inline-block"
            >
              Contact Support
            </a>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4 py-1">
            <a 
              href="#" 
              className="text-slate-500 hover:text-white transition-colors duration-150 active:scale-90 transform"
              aria-label="Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="text-slate-500 hover:text-white transition-colors duration-150 active:scale-90 transform"
              aria-label="Twitter"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="text-slate-500 hover:text-white transition-colors duration-150 active:scale-90 transform"
              aria-label="Instagram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
}
