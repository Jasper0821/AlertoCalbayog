import { useState } from "react";
import { Link } from "react-router-dom";
//hh
function Register() {
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const statusLabel = "Resident Registration";
  const copyText = "Create your resident profile with the essentials only, so sign-up stays fast and clean.";

  return (
    <main className="auth-page auth-page--register">
      <style>{`
        .auth-page {
          position: relative;
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(239, 68, 68, 0.16), transparent 28%),
            radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 26%),
            linear-gradient(180deg, #070707 0%, #050505 100%);
        }

        .auth-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(16px);
          pointer-events: none;
        }

        .auth-orb--one {
          top: -4rem;
          right: -5rem;
          width: 18rem;
          height: 18rem;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.22) 0%, rgba(239, 68, 68, 0.06) 42%, transparent 72%);
        }

        .auth-orb--two {
          bottom: -6rem;
          left: -4rem;
          width: 16rem;
          height: 16rem;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 42%, transparent 72%);
        }

        .auth-back {
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 2;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(180deg, #dc2626 0%, #991b1b 100%);
          color: #ffffff;
          text-decoration: none;
          box-shadow: 0 12px 30px rgba(239, 68, 68, 0.24);
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background 180ms ease,
            color 180ms ease;
        }

        .auth-back:hover {
          transform: translateY(-1px);
          border-color: rgba(239, 68, 68, 0.75);
          background: linear-gradient(180deg, #fb7185 0%, #ef4444 100%);
          color: #ffffff;
        }

        .auth-back:focus-visible {
          outline: 3px solid rgba(239, 68, 68, 0.45);
          outline-offset: 3px;
        }

        .auth-back svg {
          width: 20px;
          height: 20px;
        }

        .auth-card {
          position: relative;
          width: min(100%, 680px);
          padding: 72px 28px 28px;
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(180deg, rgba(16, 16, 16, 0.92), rgba(8, 8, 8, 0.96));
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .auth-card::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          border: 1px solid rgba(255, 255, 255, 0.04);
          pointer-events: none;
        }

        .auth-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .auth-badge,
        .auth-status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .auth-badge {
          padding: 0.5rem 0.8rem;
          color: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(255, 255, 255, 0.03);
        }

        .auth-status {
          padding: 0.5rem 0.8rem;
          color: #fecaca;
          border: 1px solid rgba(239, 68, 68, 0.24);
          background: rgba(239, 68, 68, 0.08);
        }

        .auth-title {
          margin: 0;
          font-family: "Space Grotesk", "Manrope", sans-serif;
          font-size: clamp(2.3rem, 5vw, 3.4rem);
          line-height: 0.95;
          letter-spacing: -0.06em;
          color: #f6f4ef;
        }

        .auth-copy {
          margin: 14px 0 0;
          color: rgba(246, 244, 239, 0.74);
          font-size: 1rem;
        }

        .auth-form {
          margin-top: 24px;
        }

        .auth-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .auth-copy--compact {
          max-width: 42rem;
        }

        .auth-field {
          display: grid;
          gap: 8px;
        }

        .auth-field--full {
          grid-column: 1 / -1;
        }

        .auth-label {
          color: rgba(246, 244, 239, 0.88);
          font-size: 0.95rem;
          font-weight: 700;
        }

        .auth-input {
          width: 100%;
          min-height: 54px;
          padding: 0.95rem 1rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: #f6f4ef;
          outline: none;
          transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }

        .auth-input::placeholder {
          color: rgba(246, 244, 239, 0.4);
        }

        .auth-input:focus {
          border-color: rgba(239, 68, 68, 0.65);
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.14);
          background: rgba(255, 255, 255, 0.05);
        }

        .auth-button {
          width: 100%;
          min-height: 54px;
          margin-top: 20px;
          border: none;
          border-radius: 16px;
          background: var(--button-red-gradient);
          color: #161310;
          font-weight: 800;
          letter-spacing: 0.02em;
          cursor: pointer;
          box-shadow: 0 16px 30px rgba(239, 68, 68, 0.24);
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .auth-button:hover {
          transform: translateY(-1px);
          background: var(--button-red-gradient-hover);
        }

        .auth-button:focus-visible {
          outline: 3px solid rgba(239, 68, 68, 0.45);
          outline-offset: 3px;
        }

        .auth-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          box-shadow: none;
          background: linear-gradient(180deg, rgba(239, 68, 68, 0.42) 0%, rgba(153, 27, 27, 0.42) 100%);
          color: rgba(255, 255, 255, 0.82);
          transform: none;
        }

        .auth-button:disabled:hover {
          transform: none;
          background: linear-gradient(180deg, rgba(239, 68, 68, 0.42) 0%, rgba(153, 27, 27, 0.42) 100%);
        }

        .auth-footer {
          margin: 18px 0 0;
          color: rgba(246, 244, 239, 0.72);
          font-size: 0.95rem;
          text-align: center;
        }

        .auth-footer a {
          color: #fecaca;
          font-weight: 800;
          text-decoration: none;
        }

        .auth-footer a:hover {
          color: #ffffff;
        }

        .auth-agreement {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid rgba(239, 68, 68, 0.16);
          background: rgba(239, 68, 68, 0.06);
          color: rgba(246, 244, 239, 0.84);
          font-size: 0.92rem;
          line-height: 1.45;
        }

        .auth-agreement input {
          margin-top: 2px;
          width: 1rem;
          height: 1rem;
          flex: 0 0 auto;
          accent-color: #ef4444;
        }

        .auth-agreement a {
          color: #fecaca;
          font-weight: 800;
          text-decoration: none;
        }

        .auth-agreement a:hover {
          color: #ffffff;
        }

        @media (max-width: 560px) {
          .auth-page {
            padding: 12px;
          }

          .auth-card {
            padding: 64px 18px 18px;
            border-radius: 24px;
          }

          .auth-back {
            top: 12px;
            left: 12px;
            width: 42px;
            height: 42px;
          }

          .auth-card__header {
            flex-direction: column;
            align-items: flex-start;
          }

          .auth-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="auth-orb auth-orb--one" aria-hidden="true" />
      <div className="auth-orb auth-orb--two" aria-hidden="true" />

      <section className="auth-card">
        <Link className="auth-back" to="/" aria-label="Back to home">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="auth-card__header">
          <span className="auth-badge">Alerto Calbayog</span>
          <span className="auth-status">{statusLabel}</span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-copy auth-copy--compact">{copyText}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-grid">
            <div className="auth-field auth-field--full">
              <label className="auth-label" htmlFor="fullName">
                Full Name
              </label>
              <input
                className="auth-input"
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Juan Dela Cruz"
                required
              />
            </div>

            <input type="hidden" name="role" value="resident" />

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Email
              </label>
              <input
                className="auth-input"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="phoneNumber">
                Phone Number
              </label>
              <input
                className="auth-input"
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder="+63 912 345 6789"
                required
              />
            </div>

            <div className="auth-field auth-field--full">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <input
                className="auth-input"
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                required
              />
            </div>

            <div className="auth-field auth-field--full">
              <label className="auth-agreement" htmlFor="userAgreement">
                <input
                  id="userAgreement"
                  name="userAgreement"
                  type="checkbox"
                  checked={isAgreementAccepted}
                  onChange={(event) => setIsAgreementAccepted(event.target.checked)}
                  required
                />
                <span>
                  I agree to the <a href="/" onClick={(event) => event.preventDefault()}>User Agreement</a> and the
                  privacy terms for this registration.
                </span>
              </label>
            </div>
          </div>

          <button className="auth-button" type="submit" disabled={!isAgreementAccepted}>
            Register
          </button>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Register;
