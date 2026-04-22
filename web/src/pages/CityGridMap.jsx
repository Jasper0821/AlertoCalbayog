import { Link } from "react-router-dom";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const cityCenter = [12.068, 124.597];

function CityGridMap() {
  return (
    <main className="h-screen w-screen relative overflow-hidden bg-slate-50">
      {/* FLOATING NAVIGATION */}
      <div className="absolute top-8 left-8 z-[1000]">
        <Link 
          to="/" 
          className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-100 p-2 pr-6 rounded-2xl shadow-2xl hover:scale-105 transition-all group"
        >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
                    <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Back to Hub</p>
              <p className="text-sm font-black tracking-tight text-slate-900 uppercase">Exit Terminal</p>
            </div>
        </Link>
      </div>

      {/* FLOATING STATUS HEADER */}
      <div className="absolute top-8 right-8 z-[1000] hidden sm:block">
        <div className="bg-white/90 backdrop-blur-md border border-slate-100 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6">
            <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Live Grid Active</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-100" />
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Focus</p>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">Calbayog City Proper</p>
            </div>
        </div>
      </div>

      {/* MAP VIEWPORT */}
      <div className="h-full w-full relative z-0">
        <MapContainer
          center={cityCenter}
          zoom={14}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ZoomControl position="bottomright" />
        </MapContainer>
        
        {/* CUSTOM OVERLAY MASK FOR STUDIO LIGHT AESTHETIC - NOW OUTSIDE MAP CONTAINER */}
        <div className="pointer-events-none absolute inset-0 z-[400] ring-inset ring-[40px] ring-white/10 opacity-50" />
        <div className="pointer-events-none absolute inset-0 z-[400] bg-[radial-gradient(circle_at_center,transparent_40%,rgba(255,255,255,0.05)_100%)]" />
      </div>


      {/* BOTTOM INFO PANEL (OPTIONAL, VERY MINIMAL) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-xl">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-6 rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,0.4)] flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/5 flex items-center justify-center">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5 text-red-500">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sector Latency</p>
                 <p className="text-sm font-bold text-white tracking-tight">42 Districts Monitored</p>
              </div>
           </div>
           <button className="h-12 px-6 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-slate-900 hover:scale-105 transition-all active:scale-95">
              Sync Data
           </button>
        </div>
      </div>
    </main>
  );
}

export default CityGridMap;
