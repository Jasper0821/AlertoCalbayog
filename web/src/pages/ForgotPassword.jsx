import { Link, useNavigate } from"react-router-dom";
import { useState } from"react";
import { Navbar } from"../components/Navbar";
import { Footer } from"../components/Footer";

function ForgotPassword() {
 const navigate = useNavigate();
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [isSuccess, setIsSuccess] = useState(false);

 const handleSubmit = (event) => {
 event.preventDefault();
 setIsSubmitting(true);
 // Mimic API recovery link submission — navigate to OTP verify page
 setTimeout(() => {
 setIsSubmitting(false);
 setIsSuccess(true);
 setTimeout(() => navigate("/verify-otp"), 1000);
 }, 1200);
 };

 return (
 <main className="relative flex flex-col min-h-screen bg-[#f4f7fc] font-sans antialiased transition-colors duration-300">
 <Navbar />

 <div className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20 relative">
 {/* Background Decorative Elements */}
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(12,49,102,0.03),transparent_40%)]" />
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.02),transparent_40%)]" />

 {/* Password Recovery Card */}
 <section className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-7 sm:p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] z-10">
 
 <div className="text-left mb-6">
 <h1 className="text-xl font-bold text-[#0a1e3f]">
 Password Recovery
 </h1>
 <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
 Enter your registered agency email address and we'll send you a secure link to reset your password.
 </p>
 </div>

 {isSuccess ? (
 <div className="text-center py-6 space-y-4">
 <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-6 w-6">
 <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 </div>
 <h3 className="text-base font-bold text-slate-900">Recovery Sent</h3>
 <p className="text-xs text-slate-500">
 A secure reset link has been dispatched to your email address. Redirecting to OTP verification...
 </p>
 <div className="pt-4 flex justify-center">
 <Link
 to="/verify-otp"
 className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg border border-dashed border-blue-500 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all duration-150 active:scale-95 transform"
 >
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
 </svg>
 Enter OTP Code
 </Link>
 </div>
 </div>
 ) : (
 <form className="space-y-5" onSubmit={handleSubmit}>
 
 {/* Agency Email Input */}
 <div className="grid gap-1.5 text-left">
 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-0.5" htmlFor="email">
 Agency Email Address
 </label>
 <div className="relative flex items-center">
 <span className="absolute left-3.5 text-slate-400">
 <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
 </svg>
 </span>
 <input
 className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-5 text-[14px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 shadow-sm"
 id="email"
 name="email"
 type="email"
 autoComplete="email"
 placeholder="agency-email@calbayog.gov.ph"
 required
 />
 </div>
 </div>

 {/* Submit Button */}
 <div className="pt-2">
 <button
 type="submit"
 className="w-full flex h-11 items-center justify-center rounded-lg bg-[#b91c1c] hover:bg-[#a11818] text-white text-[13px] font-bold uppercase tracking-wider gap-2 shadow-md transition-all duration-150 active:scale-[0.98] transform disabled:opacity-75 disabled:cursor-wait"
 disabled={isSubmitting}
 >
 {isSubmitting ? (
 <span className="flex items-center gap-2">
 <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
 </svg>
 Sending...
 </span>
 ) : (
 <>
 Send Reset Link
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5 text-white ml-1">
 <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 </>
 )}
 </button>
 </div>

 {/* Divider */}
 <div className="h-px bg-slate-100 my-6"></div>

 {/* Back to Login Link with Dashed Border */}
 <div className="flex justify-center">
 <Link
 to="/login"
 className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg border border-dashed border-blue-500 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all duration-150 active:scale-95 transform"
 >
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
 </svg>
 Back to Login
 </Link>
 </div>

 </form>
 )}
 </section>
 </div>

 <Footer />
 </main>
 );
}

export default ForgotPassword;
