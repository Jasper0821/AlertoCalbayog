import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

function Register() {
  const navigate = useNavigate();
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.target);
    const fullName = formData.get("fullName");
    const email = formData.get("email");
    const phoneNumber = formData.get("phoneNumber");
    const agency = formData.get("agency");

    try {
      const res = await api.post("/auth/register", {
        fullName,
        email,
        password,
        phoneNumber,
        agency: agency || "CDRRMO",
        role: "responder",
      });

      // Auto-login: save token and user data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setSuccessMessage("Account created! Redirecting to dashboard...");

      // Route to correct dashboard based on role
      const user = res.data.user;
      let route = "/dashboard";
      if (user.role === "admin") route = "/admindashboard";
      else if (user.agency === "PNP") route = "/crimedashboard";

      setTimeout(() => {
        navigate(route);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex flex-col min-h-screen bg-[#f4f7fc] dark:bg-slate-950 font-sans antialiased transition-colors duration-300">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 pt-32 pb-20 relative">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(12,49,102,0.03),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.02),transparent_40%)]" />

        {/* Unified Two-Panel Registration Box */}
        <section className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row z-10">
          
          {/* Left Panel: Responder Network Sidebar */}
          <div className="w-full md:w-[320px] shrink-0 bg-[#0a1e3f] text-white p-8 flex flex-col justify-between relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_60%)]" />
            
            <div className="relative z-10">
              {/* Logo */}
              <div className="mb-6 flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Alerto Calbayog Logo"
                  className="w-14 h-14 object-contain shrink-0"
                />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Official Portal</p>
                  <p className="text-sm font-bold text-white leading-tight">Alerto Calbayog</p>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold tracking-tight text-white mb-4">
                Responder Network
              </h2>
              
              <p className="text-slate-300 text-sm leading-relaxed">
                Joining the Alerto Calbayog network connects you directly with the City's Command and Control Center. Secure verification is required for all personnel.
              </p>
            </div>

            {/* Sidebar bottom icons */}
            <div className="space-y-4 pt-12 md:pt-0 relative z-10">
              <div className="flex items-center gap-3 text-left">
                <span className="text-red-500 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <span className="text-xs font-semibold tracking-wider text-slate-300">Identity Encryption</span>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <span className="text-red-500 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" className="w-5 h-5" strokeLinecap="round">
                    <line x1="12" y1="3" x2="12" y2="21" />
                    <line x1="4.22" y1="7.5" x2="19.78" y2="16.5" />
                    <line x1="4.22" y1="16.5" x2="19.78" y2="7.5" />
                  </svg>
                </span>
                <span className="text-xs font-semibold tracking-wider text-slate-300">Real-time Dispatch</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Registration Form */}
          <div className="flex-1 p-8 bg-white dark:bg-slate-900">
            <div className="text-left mb-6">
              <h1 className="text-xl font-bold text-[#0a1e3f] dark:text-white">
                Personal Information
              </h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                Provide your official legal details for background verification.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* Full Legal Name */}
              <div className="grid gap-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-0.5" htmlFor="fullName">
                  Full Legal Name
                </label>
                <input
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm"
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Juan A. Dela Cruz"
                  required
                />
              </div>

              {/* Contact Info (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-0.5" htmlFor="phoneNumber">
                    Contact Number
                  </label>
                  <input
                    className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm"
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+63 9XX XXX XXXX"
                    required
                  />
                </div>
                <div className="grid gap-1.5 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-0.5" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@agency.gov.ph"
                    required
                  />
                </div>
              </div>

              {/* Agency Type */}
              <div className="grid gap-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-0.5" htmlFor="agency">
                  Agency Type
                </label>
                <select
                  id="agency"
                  name="agency"
                  className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer"
                  required
                >
                  <option value="">Select Agency</option>
                  <option value="CDRRMO">CDRRMO (Disaster Risk Reduction)</option>
                  <option value="PNP">PNP (Police)</option>
                </select>
              </div>

              {/* Password Fields (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-0.5" htmlFor="password">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-4 pr-10 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm"
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="grid gap-1.5 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-0.5" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-100 dark:border-red-900/30">
                  {error}
                </p>
              )}

              {successMessage && (
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  {successMessage}
                </p>
              )}

              {/* User Agreement Checkbox */}
              <div className="flex items-start gap-3 text-left py-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                <input
                  className="mt-0.5 h-4.5 w-4.5 rounded border-slate-200 bg-white accent-blue-600 cursor-pointer shrink-0"
                  id="userAgreement"
                  name="userAgreement"
                  type="checkbox"
                  checked={isAgreementAccepted}
                  onChange={(e) => setIsAgreementAccepted(e.target.checked)}
                  required
                />
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer leading-snug" htmlFor="userAgreement">
                  I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-red-600 hover:underline font-bold transition-all duration-150 active:scale-[0.98] transform inline-block">User Agreement</button> and consent to secure data verification.
                </label>
              </div>

              {/* Red Continue Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex h-11 items-center justify-center rounded-lg bg-[#b91c1c] hover:bg-[#a11818] text-white text-[13px] font-bold uppercase tracking-wider gap-2 shadow-md transition-all duration-150 active:scale-[0.98] transform disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !isAgreementAccepted}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Registering...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>

            </form>
          </div>
        </section>
      </div>

      {/* Back to Login Link */}
      <p className="pb-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400 z-10 -mt-10">
        Already registered?{" "}
        <Link className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline transition-all duration-150 active:scale-95 transform inline-block" to="/login">
          Sign In
        </Link>
      </p>

      {/* USER AGREEMENT MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-12" onClick={() => setShowTermsModal(false)}>
          <div
            className="relative w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-10 py-8">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-red-600">Legal Protocol</p>
                <h3 className="mt-1 text-2xl font-black tracking-tighter text-slate-900 uppercase">User Agreement</h3>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-red-600 hover:text-white transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
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
                className="h-10 px-6 rounded-xl bg-slate-900 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-black transition-all"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

export default Register;
