import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

function VerifyOTP() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsVerifying(true);
    
    // Simulate verification
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300">
      <Navbar />

      <div className="pt-24 pb-12 px-4 flex flex-col items-center justify-center">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.03),transparent_40%)]" />

        <section className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 sm:p-10 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.1)] backdrop-blur-3xl transition-colors">
          <div className="mt-8 mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              Identity Verification
            </span>
          </div>

          <h1 className="font-display text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase transition-colors">
            Verify OTP
          </h1>
          <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
            Enter the 6-digit authorization code sent to your recovery channel to proceed.
          </p>

          <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
            <div className="flex justify-between gap-2 sm:gap-3">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="h-14 w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-center text-xl font-black text-slate-900 dark:text-white outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-600/5 shadow-sm"
                  required
                />
              ))}
            </div>

            <button
              className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-900 dark:bg-white px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 shadow-2xl shadow-slate-900/20 transition-all hover:bg-black dark:hover:bg-slate-100 hover:scale-[1.02] active:scale-95 disabled:opacity-70"
              type="submit"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                <>
                  Verify Code
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Didn't receive the code?
              </p>
              <button type="button" className="mt-2 text-xs font-black text-red-600 hover:text-red-700 transition-colors uppercase tracking-widest">
                Resend Protocol
              </button>
            </div>

            <p className="text-center text-sm font-bold text-slate-400 dark:text-slate-500">
              <Link className="text-red-600 hover:text-red-700 underline underline-offset-4 decoration-2 transition-colors" to="/login">
                Back to Sign In
              </Link>
            </p>
          </form>
        </section>
      </div>

      <Footer />
    </main>
  );
}

export default VerifyOTP;
