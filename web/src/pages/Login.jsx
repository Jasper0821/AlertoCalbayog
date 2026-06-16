import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios.js";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

function Login() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [dashboardLabel, setDashboardLabel] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  }, []);



  const getAgencyRoute = (user) => {
    if (user.role === "admin") return "/admindashboard";
    if (user.agency === "PNP") return "/crimedashboard";
    return "/dashboard";
  };

  const getDashboardLabel = (user) => {
    if (user.role === "admin") return "Admin Dashboard";
    if (user.agency === "PNP") return "PNP Dashboard";
    if (user.agency === "CDRRMO") return "CDRRMO Dashboard";
    if (user.agency === "BFP") return "BFP Dashboard";
    return "Dashboard";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setDashboardLabel(getDashboardLabel(res.data.user));
      setLoginSuccess(true);

      const route = getAgencyRoute(res.data.user);
      setTimeout(() => {
        navigate(route);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex flex-col min-h-screen bg-[#f4f7fc] font-sans antialiased transition-colors duration-300">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 relative mt-16 sm:mt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(12,49,102,0.03),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.02),transparent_40%)]" />

        <section className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-7 sm:p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] z-10">

          <div className="flex flex-col items-center mb-6 z-10 text-center">
            <img
              src="/logo.png"
              alt="Alerto Calbayog Logo"
              className="w-20 h-20 object-contain mb-1 transition-transform duration-300 hover:scale-105"
            />
            <h2 className="text-[17px] font-bold text-[#0a1e3f] tracking-tight mt-1">
              Alerto Calbayog
            </h2>
            <p className="text-[13px] text-slate-500 font-medium">
              Emergency Response System
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>

            <div className="grid gap-1.5 text-left">
              <label className="text-[12px] font-bold text-slate-600 ml-0.5" htmlFor="email">
                 Email
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="9" cy="10" r="2" />
                    <path d="M15 8h2m-2 4h2M6 16c0-2 4-2 4-2s4 0 4 2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-5 text-[14px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 shadow-sm"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Please enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-1.5 text-left">
              <div className="flex items-center justify-between ml-0.5">
                <label className="text-[12px] font-bold text-slate-600" htmlFor="password">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-11 text-[14px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 shadow-sm"
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100">
                {error}
              </p>
            )}



            <div className="border border-dashed border-blue-500 rounded-lg p-[2.5px] transition-transform duration-150 active:scale-[0.98] transform">
              <button
                className="w-full flex h-11 items-center justify-center rounded-[6px] bg-[#b91c1c] hover:bg-[#a11818] text-white text-[13px] font-bold uppercase tracking-wider gap-2 shadow-md transition-colors"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authorizing...
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Login
                  </>
                )}
              </button>
            </div>

            <div className="h-px bg-slate-100 my-6"></div>

            <div className="flex items-start gap-3 text-left">
              <span className="text-red-600 mt-0.5 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                Encrypted endpoint monitoring active. Unauthorized access is recorded.
              </p>
            </div>

            <p className="mt-5 text-center text-[12px] font-semibold text-slate-500">
              New responder?{" "}
              <Link className="text-blue-600 hover:text-blue-700 hover:underline transition-all duration-150 active:scale-95 transform inline-block" to="/register">
                Register
              </Link>
            </p>

          </form>
        </section>

        {loginSuccess && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 transition-all duration-1000 animate-in fade-in fill-mode-both">
            <div className="max-w-md w-full rounded-[56px] bg-white p-12 text-center shadow-[0_40px_120px_rgba(0,0,0,0.3)] border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700">
              <div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-[32px] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="h-10 w-10">
                  <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">Authentication Secure</p>
              <h3 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-[0.9]">Login Successful</h3>
              <p className="mt-6 text-lg font-bold text-slate-500 leading-relaxed">
                Welcome to <span className="text-[#0a1e3f]">{dashboardLabel}</span>. Routing to your terminal...
              </p>
              <div className="mt-10 flex flex-col items-center gap-3">
                <div className="h-1.5 w-32 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-300">Initializing Terminal</p>
              </div>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </main>
  );
}

export default Login;
