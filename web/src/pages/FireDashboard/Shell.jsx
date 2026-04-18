import { useState } from "react";
import { Link } from "react-router-dom";

import { BellIcon, BoltIcon, LogoutIcon, DashboardIcon, MapIcon, ReportIcon, QueueIcon, ProfileIcon, MenuIcon } from "./icons.jsx";

const innerCard = "rounded-[24px] border border-white/10 bg-white/5";

const navigation = [
  { id: "dashboard", label: "Dashboard", meta: "Overview and live status", icon: DashboardIcon },
  { id: "map-report", label: "Map Report", meta: "Pins and incident heat", icon: MapIcon },
  { id: "reported-incidents", label: "Reported Incidents", meta: "Incident log and filters", icon: ReportIcon },
  { id: "queuing", label: "Queuing", meta: "Ongoing and completed", icon: QueueIcon },
  { id: "profile", label: "Profile", meta: "Account and shift details", icon: ProfileIcon },
];

function Shell({ activeSection, onNavigate, children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen relative bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.12),transparent_26%),radial-gradient(circle_at_80%_0,rgba(255,255,255,0.05),transparent_18%),linear-gradient(180deg,#09090b_0%,#111111_42%,#09090b_100%)] text-stone-100">
      
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`flex flex-col gap-4 border-b border-white/10 bg-zinc-950/95 px-4 py-5 backdrop-blur-xl lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:h-screen lg:w-[290px] lg:border-b-0 lg:border-r lg:overflow-y-auto transition-transform duration-300 ${isMobileMenuOpen ? "fixed inset-y-0 left-0 z-50 w-[290px] translate-x-0" : "hidden lg:flex"}`}>
        <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 p-4">
          <div className="grid h-[3.25rem] w-[3.25rem] place-items-center rounded-2xl bg-gradient-to-b from-red-200 to-red-400 text-stone-950 shadow-[0_18px_30px_rgba(239,68,68,0.16)]">
            <BoltIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-[-0.03em] text-stone-50">Alerto Calbayog</p>
            <p className="mt-1 text-sm text-stone-300">Emergency response network</p>
          </div>
        </div>

        <nav className="grid gap-2" aria-label="Dashboard navigation">
          {navigation.map((item) => {
            const ItemIcon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${isActive ? "border-red-400/30 bg-red-400/10 text-stone-50 shadow-[0_18px_36px_rgba(239,68,68,0.06)]" : "border-transparent text-stone-300 hover:border-white/10 hover:bg-white/5 hover:text-stone-50"}`}
                aria-current={isActive ? "page" : undefined}
                onClick={(event) => {
                  onNavigate(event, item.id);
                  setIsMobileMenuOpen(false);
                }}
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${isActive ? "border-red-400/20 bg-red-400/10 text-red-300" : "border-white/10 bg-white/5 text-red-300"}`}
                >
                  <ItemIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-sm">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-stone-400">{item.meta}</span>
                </span>
              </a>
            );
          })}
        </nav>

        <div className="mt-auto pt-4">
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-50"
          >
            <LogoutIcon className="h-4 w-4 text-red-200" />
            Log Out
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[290px]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 min-w-0">
              <button
                type="button"
                className="lg:hidden grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-stone-100"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-red-400">
                  Alerto Calbayog Dashboard
                </p>
                <h1 className="mt-2 truncate font-display text-lg font-bold tracking-[-0.04em] text-stone-50 sm:text-2xl">
                  City emergency operations hub
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-stone-100 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-200"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-zinc-950" />
              </button>

              <div className="hidden items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-2 sm:flex">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-b from-red-200 to-red-400 text-sm font-extrabold text-stone-950">
                  AC
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-50">Fire Dashboard</p>
                  <p className="text-xs text-stone-400">Responder Unit 02</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className={`flex-1 w-full h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 ${activeSection === "map-report" ? "overflow-hidden" : "overflow-y-auto"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default Shell;
