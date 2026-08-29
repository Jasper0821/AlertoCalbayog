import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios.js";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { clearDashboardNavigationState } from "../utils/dashboardSession.js";
import CALBAYOG_BARANGAYS from "../utils/calbayogBarangays.js";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "892430385717-3i8g8ue561rqftv859o8i6gg1q4gk1nt.apps.googleusercontent.com";

function Login() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [dashboardLabel, setDashboardLabel] = useState("");
  const [error, setError] = useState("");
  const [pendingToast, setPendingToast] = useState(false);

  // Password Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // New Google Resident Registration Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleRegToken, setGoogleRegToken] = useState("");
  const [googleUserInfo, setGoogleUserInfo] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [barangay, setBarangay] = useState("");
  const [completeAddress, setCompleteAddress] = useState("");
  const [regError, setRegError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const clearAdminCache = () => {
      [
        "adminActiveNav",
        "adminReports",
        "adminUsers",
        "adminNotifications",
        "adminAuditTab",
        "adminSessionId",
      ].forEach((key) => localStorage.removeItem(key));
    };

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    clearDashboardNavigationState();
    clearAdminCache();

    // Initialize Google Identity Services SDK
    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) {
        initGoogleSignIn();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleSignIn();
      };
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  const initGoogleSignIn = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const googleBtnContainer = document.getElementById("googleSignInBtn");
        if (googleBtnContainer) {
          googleBtnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnContainer, {
            theme: "outline",
            size: "large",
            width: 320,
            text: "continue_with",
            shape: "pill",
          });
        }
      } catch (err) {
        console.error("Google Sign-In initialization error:", err);
      }
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    if (!response.credential) {
      setError("Google authentication failed. Please try again.");
      return;
    }

    setError("");
    setIsGoogleAuthenticating(true);

    try {
      const res = await api.post("/auth/google-login", {
        idToken: response.credential,
      });

      if (res.data.isNewResident) {
        // New resident -> Show profile completion modal
        setGoogleRegToken(res.data.googleRegistrationToken);
        setGoogleUserInfo(res.data.googleUser);
        setShowGoogleModal(true);
        setIsGoogleAuthenticating(false);
        return;
      }

      // Existing resident -> Instant Login
      completeLoginSession(res.data.token, res.data.user);
    } catch (err) {
      const msg = err.response?.data?.message || "Google Authentication failed. Please try again.";
      setError(msg);
      setIsGoogleAuthenticating(false);
    }
  };

  const handleGoogleCustomClick = () => {
    setError("");
    setIsGoogleAuthenticating(true);

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap is blocked or dismissed, re-render standard popup button
          const googleBtnContainer = document.getElementById("googleSignInBtn");
          if (googleBtnContainer) {
            const btn = googleBtnContainer.querySelector("div[role=button]");
            if (btn) btn.click();
          }
          setIsGoogleAuthenticating(false);
        }
      });
    } else {
      setError("Google services loading... Please try clicking again in a moment.");
      setIsGoogleAuthenticating(false);
    }
  };

  const handleFinishRegistration = async (e) => {
    e.preventDefault();
    setRegError("");

    if (!phoneNumber || !/^09\d{9}$/.test(phoneNumber.replace(/[\s-]/g, ""))) {
      setRegError("Please enter a valid 11-digit mobile number starting with 09.");
      return;
    }

    if (!barangay) {
      setRegError("Please select your Barangay.");
      return;
    }

    if (!completeAddress.trim()) {
      setRegError("Please enter your complete address.");
      return;
    }

    setIsRegistering(true);

    try {
      const res = await api.post("/auth/google-register", {
        googleRegistrationToken: googleRegToken,
        phoneNumber: phoneNumber.replace(/[\s-]/g, ""),
        barangay,
        completeAddress: completeAddress.trim(),
      });

      setShowGoogleModal(false);
      completeLoginSession(res.data.token, res.data.user);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to complete registration. Please try again.";
      setRegError(msg);
      setIsRegistering(false);
    }
  };

  const completeLoginSession = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setDashboardLabel(getDashboardLabel(user));
    setLoginSuccess(true);

    const route = getAgencyRoute(user);
    setTimeout(() => {
      navigate(route);
    }, 500);
  };

  const getAgencyRoute = (user) => {
    if (user.role === "admin") return "/admindashboard";
    if (user.agency === "PNP") return "/crimedashboard";
    if (user.agency === "BFP") return "/firedashboard";
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
      completeLoginSession(res.data.token, res.data.user);
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      const status = err.response?.status;
      if (status === 403 && msg.toLowerCase().includes("pending")) {
        setPendingToast(true);
        setTimeout(() => setPendingToast(false), 5000);
      } else {
        setError(msg);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-[#f4f7fc] font-sans antialiased transition-colors duration-300">
      <Navbar />

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 pt-20 pb-3">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(12,49,102,0.03),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.02),transparent_40%)]" />

        <section className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] sm:p-6">
          <div className="z-10 mb-4 flex flex-col items-center text-center">
            <img
              src="/logo.png"
              alt="Alerto Calbayog Logo"
              className="mb-1 h-14 w-14 object-contain transition-transform duration-300 hover:scale-105 sm:h-16 sm:w-16"
            />
            <h2 className="text-[18px] font-extrabold text-[#0a1e3f] tracking-tight mt-1">
              Alerto Calbayog
            </h2>
            <p className="text-[12.5px] text-slate-500 font-medium">
              Emergency Response System
            </p>
          </div>

          {/* ── Primary Action: CONTINUE WITH GOOGLE ── */}
          <div className="mb-4 flex flex-col items-center">
            <button
              type="button"
              onClick={handleGoogleCustomClick}
              disabled={isGoogleAuthenticating}
              className="w-full flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-bold gap-3 shadow-sm transition-all hover:shadow duration-200 active:scale-[0.98]"
            >
              {isGoogleAuthenticating ? (
                <span className="flex items-center gap-2 text-slate-500">
                  <svg className="h-4 w-4 animate-spin text-blue-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying Google Account...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Hidden container for standard GIS rendered button */}
            <div id="googleSignInBtn" className="hidden mt-2"></div>
          </div>

          <div className="relative my-3 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Or sign in with password
            </span>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid gap-1 text-left">
              <label className="text-[12px] font-bold text-slate-600 ml-0.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="9" cy="10" r="2" />
                    <path d="M15 8h2m-2 4h2M6 16c0-2 4-2 4-2s4 0 4 2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  className="h-9.5 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 shadow-sm"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-1 text-left">
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  className="h-9.5 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-[13px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 shadow-sm"
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 leading-relaxed">
                {error}
              </p>
            )}

            <button
              className="w-full flex h-10 items-center justify-center rounded-xl bg-[#b91c1c] hover:bg-[#a11818] text-white text-[12px] font-bold uppercase tracking-wider gap-2 shadow-md transition-all active:scale-[0.98]"
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

            <p className="mt-3 text-center text-[12px] font-semibold text-slate-500">
              New responder?{" "}
              <Link className="text-blue-600 hover:text-blue-700 hover:underline transition-all duration-150 active:scale-95 transform inline-block" to="/register">
                Register
              </Link>
            </p>
          </form>
        </section>

        {/* ── New Resident Fast Profile Completion Modal ── */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-overlay-fade">
            <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-login-success">
              <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
                {googleUserInfo?.profile_picture ? (
                  <img
                    src={googleUserInfo.profile_picture}
                    alt="Google Profile"
                    className="w-11 h-11 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-bold grid place-items-center">
                    {googleUserInfo?.full_name?.charAt(0) || "G"}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Complete Resident Profile
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    Signed in as <span className="font-semibold text-slate-700">{googleUserInfo?.google_email}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleFinishRegistration} className="space-y-3.5">
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-[11.5px] text-blue-800 leading-relaxed">
                  Google account authenticated. Please provide your contact &amp; residence details to finish registration.
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="09XXXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    maxLength={11}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-[13px] text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">
                    Barangay <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Select Barangay in Calbayog</option>
                    {CALBAYOG_BARANGAYS.map((bgy) => (
                      <option key={bgy} value={bgy}>
                        Brgy. {bgy}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">
                    Complete Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Purok, Street, House / Building No."
                    value={completeAddress}
                    onChange={(e) => setCompleteAddress(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-[13px] text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                    required
                  />
                </div>

                {regError && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                    {regError}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(false)}
                    className="flex-1 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="flex-[2] h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold shadow-md transition-all active:scale-[0.98]"
                  >
                    {isRegistering ? "Saving Profile..." : "Finish Registration"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loginSuccess && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-overlay-fade">
            <div className="max-w-[320px] w-full rounded-2xl bg-white p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 animate-login-success">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="h-6 w-6">
                  <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Secure Authentication</p>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Login Successful</h3>
              <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed">
                Welcome to <span className="text-[#0a1e3f]">{dashboardLabel}</span>. Routing to your terminal...
              </p>
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="h-1 w-24 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-pulse" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pending Approval Toast */}
      {pendingToast && (
        <div
          className="fixed top-5 right-5 z-[300] flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 shadow-lg shadow-amber-100/50"
          style={{ maxWidth: 340, animation: "slideInRight 0.3s ease" }}
        >
          <span className="mt-0.5 shrink-0 text-amber-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 6v6l4 2" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800">Account Pending Approval</p>
            <p className="mt-0.5 text-[11px] text-amber-700 leading-relaxed">
              Your responder account is awaiting admin approval. Please wait for confirmation before logging in.
            </p>
          </div>
          <button
            onClick={() => setPendingToast(false)}
            className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <Footer />
    </main>
  );
}

export default Login;
