import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios.js";

function Login() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Route user to correct dashboard based on their agency
  const getAgencyRoute = (agency) => {
    switch (agency) {
      case "BFP": return "/firedashboard";
      case "DRRMO": return "/flooddashboard";
      case "EMS": return "/emergencydashboard";
      default: return "/dashboard";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      
      // Save token and user data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setLoginSuccess(true);

      // Route to correct agency dashboard after animation
      const route = getAgencyRoute(res.data.user.agency);
      setTimeout(() => {
        navigate(route);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans antialiased">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.03),transparent_40%)]" />

      <section className="relative w-full max-w-xl overflow-hidden rounded-[40px] sm:rounded-[48px] border border-slate-100 bg-white p-6 sm:p-16 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.1)]">
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
          <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-red-600">
            Secure Entry
          </span>
        </div>

        <h1 className="font-display text-4xl font-black leading-[0.85] tracking-[-0.06em] text-slate-900 sm:text-6xl">
          Sign In
        </h1>
        <p className="mt-8 text-xl font-medium leading-relaxed text-slate-500">
          Access the emergency coordination terminal and real-time city alerts.
        </p>

        <form className="mt-12 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="grid gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1" htmlFor="email">
                Email Address
              </label>
              <input
                className="h-16 w-full rounded-2xl border border-slate-100 bg-white px-6 text-slate-900 outline-none transition shadow-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/5 placeholder:text-slate-300"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1" htmlFor="password">
                Password
              </label>
              <input
                className="h-16 w-full rounded-2xl border border-slate-100 bg-white px-6 text-slate-900 outline-none transition shadow-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/5 placeholder:text-slate-300"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between ml-1 pt-2">
            <div className="flex items-center gap-3">
              <input
                className="h-5 w-5 rounded-lg border-slate-200 bg-white accent-red-600 transition cursor-pointer"
                id="remember"
                name="remember"
                type="checkbox"
              />
              <label className="text-sm font-bold text-slate-600 cursor-pointer" htmlFor="remember">
                Keep me active
              </label>
            </div>
            
            <Link
              to="/forgot-password"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 hover:text-red-700 transition"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            className="group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-900 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-black hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-wait"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying Credentials...
              </span>
            ) : (
              <>
                Authenticate
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>

          <p className="pt-4 text-center text-sm font-bold text-slate-400">
            New to the grid?{" "}
            <Link className="text-red-600 hover:text-red-700 underline underline-offset-4 decoration-2" to="/register">
              Join the Network
            </Link>
          </p>
        </form>
      </section>

      {/* SUCCESS MESSAGE OVERLAY */}
      {loginSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 transition-all duration-1000 animate-in fade-in fill-mode-both">
          <div className="max-w-md w-full rounded-[56px] bg-white p-12 text-center shadow-[0_40px_120px_rgba(0,0,0,0.3)] animate-in zoom-in-95 slide-in-from-bottom-12 duration-700">
             <div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-[32px] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="h-10 w-10">
                   <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">Authentication Secure</p>
             <h3 className="text-4xl font-black tracking-tighter text-slate-900 uppercase leading-[0.9]">Login Successful</h3>
             <p className="mt-6 text-lg font-bold text-slate-500 leading-relaxed">
               Welcome back, Dispatcher. Routing to your agency terminal...
             </p>
             <div className="mt-10 flex flex-col items-center gap-3">
                <div className="h-1.5 w-32 rounded-full bg-slate-50 overflow-hidden">
                   <div className="h-full bg-emerald-500 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Initializing Terminal</p>
             </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Login;
