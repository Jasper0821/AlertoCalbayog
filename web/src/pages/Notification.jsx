import React from "react";
import { Link } from "react-router-dom";

export function Notification({ isVisible, onClose }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-[28px] border border-red-500/20 bg-red-500/10 p-8 shadow-[0_40px_100px_rgba(239,68,68,0.3)] backdrop-blur-xl animate-in zoom-in-95 duration-300">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-red-500 shadow-[0_12px_30px_rgba(239,68,68,0.4)]">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center mt-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-200">Registration Complete</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-stone-50">Account created</h3>
          <p className="mt-3 text-base text-stone-300">
            Your responder account is successfully registered. You can now log in to the emergency coordination hub.
          </p>
        </div>
        <div className="mt-4 flex w-full gap-3">
          <Link
            to="/login"
            className="flex flex-1 items-center justify-center rounded-xl bg-red-500 px-6 py-3 font-bold text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-400 active:scale-95"
            onClick={onClose}
          >
            Access Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Notification;
