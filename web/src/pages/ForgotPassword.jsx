import { Link } from "react-router-dom";

function ForgotPassword() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans antialiased">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.03),transparent_40%)]" />

      <section className="relative w-full max-w-xl overflow-hidden rounded-[48px] border border-slate-100 bg-white p-8 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.1)] sm:p-16">
        <Link
          className="absolute left-6 top-6 grid h-12 w-12 place-items-center rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-sm transition hover:scale-105 hover:bg-slate-50 active:scale-95 sm:left-10 sm:top-10"
          to="/login"
          aria-label="Back to login"
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

        <div className="mt-8 mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            Security Protocol
          </span>
        </div>

        <h1 className="font-display text-5xl font-black leading-[0.85] tracking-[-0.06em] text-slate-900 sm:text-6xl">
          Reset Password
        </h1>
        <p className="mt-8 text-xl font-medium leading-relaxed text-slate-500">
          Enter your registered email address and we will send you instructions to recover your account access.
        </p>

        <form className="mt-12 space-y-8" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1" htmlFor="email">
              Recovery Email
            </label>
            <input
              className="h-16 w-full rounded-2xl border border-slate-100 bg-white px-6 text-slate-900 outline-none transition shadow-sm focus:border-red-600 focus:ring-4 focus:ring-red-600/5 placeholder:text-slate-300"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
            />
          </div>

          <button
            className="group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-900 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-black hover:scale-[1.02] active:scale-95"
            type="submit"
          >
            Send Recovery Link
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <p className="text-center text-sm font-bold text-slate-400">
            Remembered your password?{" "}
            <Link className="text-red-600 hover:text-red-700 underline underline-offset-4 decoration-2" to="/login">
              Back to Sign In
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default ForgotPassword;
