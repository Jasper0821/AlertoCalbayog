import { useState } from "react";
import { TYPE_ICONS, STATUS_STYLES, MOCK_REPORTS } from "./utils.js";

const UNITS = [
  { id: "U-101", name: "Unit Alpha-101", type: "Patrol Car", status: "Available", officer: "Sgt. Reyes", location: "Brgy. Bagacay" },
  { id: "U-102", name: "Unit Bravo-102", type: "Patrol Car", status: "Deployed", officer: "Cpl. Santos", location: "Maharlika Highway" },
  { id: "U-103", name: "Unit Charlie-103", type: "Motorcycle", status: "Available", officer: "PO1 Cruz", location: "City Hall" },
  { id: "U-104", name: "Unit Delta-104", type: "Patrol Car", status: "On Break", officer: "PO2 Lim", location: "Police Station" },
  { id: "U-F01", name: "K9 Unit F-01", type: "K9 / Canine", status: "Available", officer: "SGT. Diaz + K9", location: "Brgy. Nijaga" },
];

export default function DispatchCenter({ reports = [] }) {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const pending = reports.filter(r => (r.status || "").toLowerCase() === "pending");

  const statusColor = {
    "Available": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Deployed": "bg-blue-100 text-blue-700 border-blue-200",
    "On Break": "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dispatch Center</h1>
        <p className="text-sm text-slate-500 mt-0.5">Assign available units to pending incidents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Incidents */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Pending Incidents</h3>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              {pending.length} waiting
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {(pending.length > 0 ? pending : MOCK_REPORTS.slice(0, 3)).map((r, i) => {
              const type = (r.emergencyType || "others").toLowerCase();
              const typeInfo = TYPE_ICONS[type] || TYPE_ICONS.others;
              const loc = typeof r.location === "string" ? r.location : (r.location?.name || "Unknown");
              const isSelected = selectedIncident?._id === r._id;
              return (
                <button
                  key={r._id || i}
                  onClick={() => setSelectedIncident(isSelected ? null : r)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                >
                  <span className="text-xl">{typeInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{loc}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{r.userId?.fullName || "Unknown"} · {typeInfo.label}</p>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
            {pending.length === 0 && reports.length > 0 && (
              <div className="py-10 text-center text-sm text-slate-400">No pending incidents.</div>
            )}
          </div>
        </div>

        {/* Available Units */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Available Units</h3>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              {UNITS.filter(u => u.status === "Available").length} free
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {UNITS.map(unit => {
              const isSelected = selectedUnit?.id === unit.id;
              return (
                <button
                  key={unit.id}
                  onClick={() => setSelectedUnit(isSelected ? null : unit)}
                  disabled={unit.status !== "Available"}
                  className={`w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected ? "bg-blue-50" : unit.status === "Available" ? "hover:bg-slate-50" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800">{unit.name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusColor[unit.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {unit.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{unit.officer} · {unit.location}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dispatch Action */}
      {(selectedUnit || selectedIncident) && (
        <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Confirm Dispatch</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Selected Incident</p>
              {selectedIncident ? (
                <>
                  <p className="text-sm font-bold text-slate-800">{typeof selectedIncident.location === "string" ? selectedIncident.location : (selectedIncident.location?.name || "Unknown")}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedIncident.userId?.fullName || "Anonymous"}</p>
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">No incident selected</p>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Selected Unit</p>
              {selectedUnit ? (
                <>
                  <p className="text-sm font-bold text-slate-800">{selectedUnit.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedUnit.officer} · {selectedUnit.type}</p>
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">No unit selected</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              disabled={!selectedUnit || !selectedIncident}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-600/20"
            >
              Dispatch Unit Now
            </button>
            <button
              onClick={() => { setSelectedUnit(null); setSelectedIncident(null); }}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
