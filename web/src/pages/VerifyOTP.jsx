import { useState, useRef } from"react";
import { Link, useNavigate } from"react-router-dom";
import { Navbar } from"../components/Navbar";
import { Footer } from"../components/Footer";

// Demo: the correct OTP is"123456" (replace with real API call)
const DEMO_OTP ="123456";

function VerifyOTP() {
 const navigate = useNavigate();
 const [otp, setOtp] = useState(["","","","","",""]);
 const [isVerifying, setIsVerifying] = useState(false);
 const [otpVerified, setOtpVerified] = useState(false);
 const [otpError, setOtpError] = useState("");
 const inputRefs = useRef([]);

 // Password fields
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showNew, setShowNew] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [isResetting, setIsResetting] = useState(false);
 const [resetSuccess, setResetSuccess] = useState(false);
 const [passwordError, setPasswordError] = useState("");

 const handleChange = (element, index) => {
 if (isNaN(element.value)) return;
 const newOtp = [...otp.map((d, idx) => (idx === index ? element.value : d))];
 setOtp(newOtp);
 setOtpError("");
 if (element.value !=="" && index < 5) {
 inputRefs.current[index + 1].focus();
 }
 };

 const handleKeyDown = (e, index) => {
 if (e.key ==="Backspace" && !otp[index] && index > 0) {
 inputRefs.current[index - 1].focus();
 }
 };

 const handlePaste = (e) => {
 e.preventDefault();
 const pasted = e.clipboardData.getData("text").replace(/\D/g,"").slice(0, 6);
 if (!pasted) return;
 const newOtp = [...otp];
 pasted.split("").forEach((char, i) => {
 if (i < 6) newOtp[i] = char;
 });
 setOtp(newOtp);
 const nextEmpty = pasted.length < 6 ? pasted.length : 5;
 inputRefs.current[nextEmpty]?.focus();
 };

 const handleVerify = (event) => {
 event.preventDefault();
 const entered = otp.join("");
 if (entered.length < 6) {
 setOtpError("Please enter the complete 6-digit code.");
 return;
 }
 setIsVerifying(true);
 setOtpError("");

 // Simulate API verification
 setTimeout(() => {
 setIsVerifying(false);
 if (entered === DEMO_OTP) {
 setOtpVerified(true);
 } else {
 setOtpError("Invalid OTP code. Please check your email and try again.");
 }
 }, 1200);
 };

 const handleResend = () => {
 setOtp(["","","","","",""]);
 setOtpError("");
 setOtpVerified(false);
 inputRefs.current[0]?.focus();
 };

 const handleResetPassword = (event) => {
 event.preventDefault();
 setPasswordError("");
 if (newPassword.length < 8) {
 setPasswordError("Password must be at least 8 characters.");
 return;
 }
 if (newPassword !== confirmPassword) {
 setPasswordError("Passwords do not match.");
 return;
 }
 setIsResetting(true);
 setTimeout(() => {
 setIsResetting(false);
 setResetSuccess(true);
 setTimeout(() => navigate("/login"), 2000);
 }, 1400);
 };

 return (
 <main className="relative flex flex-col min-h-screen bg-[#f4f7fc] font-sans antialiased transition-colors duration-300">
 <Navbar />

 <div className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20 relative">
 {/* Background Decorative */}
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(12,49,102,0.03),transparent_40%)]" />
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.02),transparent_40%)]" />

 <section className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-7 sm:p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] z-10">

 {/* Shield Icon Header */}
 <div className="flex flex-col items-center mb-6">
 <div className="bg-[#0a1e3f] w-14 h-14 rounded-xl flex items-center justify-center shadow-lg mb-3">
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-7 h-7 text-blue-400" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
 <path d="M9 12l2 2 4-4" />
 </svg>
 </div>
 <h1 className="text-xl font-black tracking-tight text-[#0a1e3f] uppercase">
 {otpVerified ?"Create New Password" :"Verify Your Identity"}
 </h1>
 <p className="text-[12px] text-slate-500 mt-1.5 text-center leading-relaxed max-w-[280px]">
 {otpVerified
 ?"OTP verified. Enter and confirm your new password below."
 :"A 6-digit verification code has been sent to your agency email. Please enter it below to proceed."}
 </p>
 </div>

 {/* ─── OTP Section ─── */}
 {!otpVerified && (
 <form onSubmit={handleVerify} className="space-y-5">
 {/* OTP Input Boxes */}
 <div className="flex justify-between gap-2" onPaste={handlePaste}>
 {otp.map((data, index) => (
 <input
 key={index}
 type="text"
 inputMode="numeric"
 maxLength="1"
 ref={(el) => (inputRefs.current[index] = el)}
 value={data}
 onChange={(e) => handleChange(e.target, index)}
 onKeyDown={(e) => handleKeyDown(e, index)}
 className={`h-14 w-full rounded-xl border text-center text-xl font-black text-slate-900 outline-none transition shadow-sm
 ${otpError
 ?"border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500/20"
 :"border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
 }`}
 required
 />
 ))}
 </div>

 {/* OTP Error */}
 {otpError && (
 <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
 <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
 </svg>
 <p className="text-xs font-bold text-red-600">{otpError}</p>
 </div>
 )}

 {/* Verify Button (red with blue dashed border) */}
 <div className="border border-dashed border-blue-500 rounded-lg p-[2.5px] transition-transform duration-150 active:scale-[0.98] transform">
 <button
 type="submit"
 disabled={isVerifying}
 className="w-full flex h-11 items-center justify-center rounded-[6px] bg-[#b91c1c] hover:bg-[#a11818] text-white text-[13px] font-bold uppercase tracking-wider gap-2 shadow-md transition-colors disabled:opacity-75 disabled:cursor-wait"
 >
 {isVerifying ? (
 <span className="flex items-center gap-2">
 <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
 </svg>
 Verifying...
 </span>
 ) : (
 <>
 Verify &amp; Proceed
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5 text-white">
 <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 </>
 )}
 </button>
 </div>

 {/* Resend */}
 <p className="text-center text-[11px] font-semibold text-slate-400">
 Didn't receive a code?{""}
 <button
 type="button"
 onClick={handleResend}
 className="text-blue-600 font-bold hover:underline transition-all"
 >
 Resend Code
 </button>
 </p>

 {/* Divider */}
 <div className="h-px bg-slate-100" />

 {/* Footer info */}
 <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
 <span className="flex items-center gap-1.5">
 <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
 <rect x="3" y="11" width="18" height="11" rx="2" />
 <path d="M7 11V7a5 5 0 0110 0v4" />
 </svg>
 Encrypted Session
 </span>
 <span>Authorized Personnel Only</span>
 </div>
 </form>
 )}

 {/* ─── Create New Password Section ─── */}
 {otpVerified && !resetSuccess && (
 <form onSubmit={handleResetPassword} className="space-y-5">
 {/* New Password */}
 <div className="grid gap-1.5 text-left">
 <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-0.5" htmlFor="newPassword">
 New Password
 </label>
 <div className="relative flex items-center">
 <span className="absolute left-3.5 text-slate-400">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
 <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
 <path d="M7 11V7a5 5 0 0110 0v4" />
 </svg>
 </span>
 <input
 id="newPassword"
 type={showNew ?"text" :"password"}
 placeholder="Min. 8 characters"
 value={newPassword}
 onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
 disabled={!otpVerified}
 className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-11 text-[14px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
 required
 />
 <button
 type="button"
 onClick={() => setShowNew(!showNew)}
 className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors"
 >
 {showNew ? (
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

 {/* Confirm Password */}
 <div className="grid gap-1.5 text-left">
 <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-0.5" htmlFor="confirmPassword">
 Confirm Password
 </label>
 <div className="relative flex items-center">
 <span className="absolute left-3.5 text-slate-400">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
 </svg>
 </span>
 <input
 id="confirmPassword"
 type={showConfirm ?"text" :"password"}
 placeholder="Re-enter new password"
 value={confirmPassword}
 onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
 disabled={!otpVerified}
 className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-11 text-[14px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
 required
 />
 <button
 type="button"
 onClick={() => setShowConfirm(!showConfirm)}
 className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors"
 >
 {showConfirm ? (
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

 {/* Password Error */}
 {passwordError && (
 <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
 <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
 </svg>
 <p className="text-xs font-bold text-red-600">{passwordError}</p>
 </div>
 )}

 {/* Submit Button */}
 <div className="border border-dashed border-blue-500 rounded-lg p-[2.5px] transition-transform duration-150 active:scale-[0.98] transform">
 <button
 type="submit"
 disabled={isResetting}
 className="w-full flex h-11 items-center justify-center rounded-[6px] bg-[#b91c1c] hover:bg-[#a11818] text-white text-[13px] font-bold uppercase tracking-wider gap-2 shadow-md transition-colors disabled:opacity-75 disabled:cursor-wait"
 >
 {isResetting ? (
 <span className="flex items-center gap-2">
 <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
 </svg>
 Saving...
 </span>
 ) : (
 <>
 Set New Password
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5 text-white">
 <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 </>
 )}
 </button>
 </div>

 {/* Divider */}
 <div className="h-px bg-slate-100" />

 {/* Footer info */}
 <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
 <span className="flex items-center gap-1.5">
 <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
 <rect x="3" y="11" width="18" height="11" rx="2" />
 <path d="M7 11V7a5 5 0 0110 0v4" />
 </svg>
 Encrypted Session
 </span>
 <span>Authorized Personnel Only</span>
 </div>
 </form>
 )}

 {/* Reset Success */}
 {resetSuccess && (
 <div className="flex flex-col items-center py-4 space-y-4 text-center">
 <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-6 w-6">
 <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 </div>
 <h3 className="text-base font-black text-slate-900 uppercase">Password Updated!</h3>
 <p className="text-xs text-slate-500">
 Your password has been reset successfully. Redirecting to login...
 </p>
 </div>
 )}
 </section>

 {/* Return to Login Portal */}
 <div className="mt-5 z-10">
 <Link
 to="/login"
 className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg border border-dashed border-blue-500 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all duration-150 active:scale-95 transform"
 >
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
 </svg>
 Return to Login Portal
 </Link>
 </div>
 </div>

 <Footer />
 </main>
 );
}

export default VerifyOTP;
