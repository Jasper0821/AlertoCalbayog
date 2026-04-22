import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    // Simulate registration
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };


  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans antialiased">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.03),transparent_40%)]" />

      <section className="relative w-full max-w-2xl overflow-hidden rounded-[48px] border border-slate-100 bg-white p-8 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.1)] sm:p-16">
        <Link
          className="absolute left-6 top-6 grid h-12 w-12 place-items-center rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-sm transition hover:scale-105 hover:bg-slate-50 active:scale-95 sm:left-10 sm:top-10"
          to="/"
          aria-label="Back to home"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="mt-8 mb-10 flex flex-wrap items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            Alerto Calbayog
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-600">
            Resident Enrollment
          </span>
        </div>

        <h1 className="font-display text-5xl font-black leading-[0.85] tracking-[-0.06em] text-slate-900 sm:text-6xl">
          Create Account
        </h1>
        <p className="mt-8 text-xl font-medium leading-relaxed text-slate-500">
          Join the network for rapid emergency response and real-time community safety updates.
        </p>

        <form className="mt-12 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1" htmlFor="fullName">
                Full Name
              </label>
              <input
                className="h-16 w-full rounded-2xl border border-slate-100 bg-white px-6 text-slate-900 outline-none transition shadow-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/5 placeholder:text-slate-300"
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Juan Dela Cruz"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1" htmlFor="email">
                Email Address
              </label>
              <input
                className="h-16 w-full rounded-2xl border border-slate-100 bg-white px-6 text-slate-900 outline-none transition shadow-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/5 placeholder:text-slate-300"
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1" htmlFor="phoneNumber">
                Phone Number
              </label>
              <input
                className="h-16 w-full rounded-2xl border border-slate-100 bg-white px-6 text-slate-900 outline-none transition shadow-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/5 placeholder:text-slate-300"
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="+63 912 345 6789"
                required
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1" htmlFor="password">
                Password
              </label>
              <input
                className="h-16 w-full rounded-2xl border border-slate-100 bg-white px-6 text-slate-900 outline-none transition shadow-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/5 placeholder:text-slate-300"
                id="password"
                name="password"
                type="password"
                placeholder="Create a strong password"
                required
              />
            </div>

            {error && (
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                  {error}
                </p>
              </div>
            )}

            <div className="sm:col-span-2">
              <label
                className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition hover:bg-slate-50 cursor-pointer"
                htmlFor="userAgreement"
              >
                <input
                  className="mt-1 h-5 w-5 shrink-0 rounded-lg border-slate-200 bg-white accent-red-600 transition cursor-pointer"
                  id="userAgreement"
                  name="userAgreement"
                  type="checkbox"
                  checked={isAgreementAccepted}
                  onChange={(event) => setIsAgreementAccepted(event.target.checked)}
                  required
                />
                <span className="text-sm font-bold text-slate-600 leading-relaxed">
                  I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-red-600 hover:underline font-black">User Agreement</button> and the privacy terms for this registration.
                </span>
              </label>
            </div>
          </div>

          <button
            className="group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-900 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-black hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:bg-slate-400 disabled:cursor-not-allowed"
            type="submit"
            disabled={!isAgreementAccepted || isSubmitting}
          >
            {isSubmitting ? "Creating Profile..." : "Create Profile"}
            {!isSubmitting && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          <p className="pt-4 text-center text-sm font-bold text-slate-400">
            Already registered?{" "}
            <Link className="text-red-600 hover:text-red-700 underline underline-offset-4 decoration-2" to="/login">
              Sign In
            </Link>
          </p>
        </form>
      </section>

      {/* USER AGREEMENT MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-12" onClick={() => setShowTermsModal(false)}>
          <div 
            className="relative w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden rounded-[48px] border border-slate-100 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-10 py-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Legal Protocol</p>
                <h3 className="mt-1 text-2xl font-black tracking-tighter text-slate-900 uppercase">User Agreement</h3>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-red-600 hover:text-white transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-6 text-slate-600">
              <p className="text-lg font-bold text-slate-900 italic">Welcome to Alerto Calbayog. By registering, you agree to the following terms:</p>
              
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">1. Data Privacy</h4>
                <p className="text-sm leading-relaxed">We collect and process your personal information (name, email, phone) exclusively for emergency response coordination. Your data is encrypted and managed according to the City Emergency Command Center security protocols.</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">2. Incident Reporting</h4>
                <p className="text-sm leading-relaxed">False reporting is strictly prohibited and subject to administrative penalties. Every alert triggered through this terminal is logged with spatial telemetry for verification.</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">3. Responder Conduct</h4>
                <p className="text-sm leading-relaxed">Responders must maintain professional conduct and follow established dispatch protocols at all times during active shifts.</p>
              </div>

              <div className="pt-6 border-t border-slate-50 italic text-xs text-slate-400">
                Last updated: April 21, 2026. Alerto Calbayog Command Center.
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end">

              <button 
                onClick={() => setShowTermsModal(false)}
                className="h-14 px-10 rounded-2xl bg-slate-900 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-black transition-all"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Register;
