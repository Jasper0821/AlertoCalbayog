import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

function ForgotPassword() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    // Simulate link sent
    navigate("/verify-otp");
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
              Security Protocol
            </span>
          </div>

          <h1 className="font-display text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase transition-colors">
            Reset Password
          </h1>
          <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
            Enter your recovery email to receive a secure authorization code.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1" htmlFor="email">
                Recovery Email
              </label>
              <input
                className="h-14 w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 text-sm font-bold text-slate-900 dark:text-white outline-none transition shadow-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/5 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
              />
            </div>

            <button
              className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-900 dark:bg-white px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 shadow-2xl shadow-slate-900/20 transition-all hover:bg-black dark:hover:bg-slate-100 hover:scale-[1.02] active:scale-95"
              type="submit"
            >
              Send Recovery Link
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <p className="text-center text-sm font-bold text-slate-400 dark:text-slate-500">
              Remembered your password?{" "}
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

export default ForgotPassword;
