import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const statusLabel = "Resident Registration";
  const copyText = "Create your resident profile with the essentials only, so sign-up stays fast and clean.";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute -right-20 -top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(239,68,68,0.22)_0%,_rgba(239,68,68,0.06)_42%,_transparent_72%)] blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_0%,_rgba(255,255,255,0.03)_42%,_transparent_72%)] blur-2xl"
        aria-hidden="true"
      />

      <section className="relative w-full max-w-[680px] rounded-[32px] border border-white/10 bg-zinc-950/92 px-7 pb-7 pt-[4.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <Link
          className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-gradient-to-b from-red-600 to-red-800 text-white shadow-[0_12px_30px_rgba(239,68,68,0.24)] transition hover:-translate-y-0.5 hover:from-red-500 hover:to-red-600 focus:outline-none focus:ring-4 focus:ring-red-500/20 sm:left-5 sm:top-5"
          to="/"
          aria-label="Back to home"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-stone-200/80">
            Alerto Calbayog
          </span>
          <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-red-200">
            {statusLabel}
          </span>
        </div>

        <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-[-0.06em] text-stone-50 sm:text-[3.4rem]">
          Create account
        </h1>
        <p className="mt-4 max-w-[42rem] text-base text-stone-300">{copyText}</p>

        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <label className="text-sm font-bold text-stone-100/90" htmlFor="fullName">
                Full Name
              </label>
              <input
                className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-400/70 focus:border-red-400/70 focus:bg-white/10 focus:ring-4 focus:ring-red-500/20"
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Juan Dela Cruz"
                required
              />
            </div>

            <input type="hidden" name="role" value="resident" />

            <div className="grid gap-2">
              <label className="text-sm font-bold text-stone-100/90" htmlFor="email">
                Email
              </label>
              <input
                className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-400/70 focus:border-red-400/70 focus:bg-white/10 focus:ring-4 focus:ring-red-500/20"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-stone-100/90" htmlFor="phoneNumber">
                Phone Number
              </label>
              <input
                className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-400/70 focus:border-red-400/70 focus:bg-white/10 focus:ring-4 focus:ring-red-500/20"
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder="+63 912 345 6789"
                required
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <label className="text-sm font-bold text-stone-100/90" htmlFor="password">
                Password
              </label>
              <input
                className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-400/70 focus:border-red-400/70 focus:bg-white/10 focus:ring-4 focus:ring-red-500/20"
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label
                className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm leading-6 text-stone-200"
                htmlFor="userAgreement"
              >
                <input
                  className="mt-1 h-4 w-4 shrink-0 rounded border-stone-500/60 bg-transparent accent-red-500"
                  id="userAgreement"
                  name="userAgreement"
                  type="checkbox"
                  checked={isAgreementAccepted}
                  onChange={(event) => setIsAgreementAccepted(event.target.checked)}
                  required
                />
                <span>
                  I agree to the{" "}
                  <a
                    className="font-extrabold text-red-200 transition hover:text-white"
                    href="/"
                    onClick={(event) => event.preventDefault()}
                  >
                    User Agreement
                  </a>{" "}
                  and the privacy terms for this registration.
                </span>
              </label>
            </div>
          </div>

          <button
            className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-red-300 to-red-500 px-6 font-extrabold tracking-[0.02em] text-stone-900 shadow-[0_16px_30px_rgba(239,68,68,0.24)] transition hover:-translate-y-0.5 hover:from-red-200 hover:to-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-zinc-700/50 disabled:text-stone-300 disabled:shadow-none disabled:hover:translate-y-0"
            type="submit"
            disabled={!isAgreementAccepted}
          >
            Register
          </button>

          <p className="mt-5 text-center text-sm text-stone-300">
            Already have an account?{" "}
            <Link className="font-extrabold text-red-200 transition hover:text-white" to="/login">
              Login
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Register;
