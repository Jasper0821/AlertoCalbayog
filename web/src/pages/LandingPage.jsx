import { Link } from "react-router-dom";

const stats = [
  { value: "24/7", label: "Dispatch-ready" },
  { value: "Live", label: "City alerts" },
  { value: "1 Tap", label: "Report flow" },
];

function LandingPage() {
  return (
    <main className="landing">
      <div className="landing__orb landing__orb--one" aria-hidden="true" />
      <div className="landing__orb landing__orb--two" aria-hidden="true" />

      <div className="landing__frame">
        <header className="landing__topbar">
          <span className="landing__pill">Emergency Response System</span>
          <span className="landing__status">Ready 24/7</span>
        </header>

        <section className="landing__hero">
          <div className="landing__copy">
            <p className="landing__eyebrow">Calbayog City</p>
            <h1 className="landing__title">Alerto Calbayog</h1>
            <p className="landing__tagline">Your Safety, One Tap Away</p>
            <p className="landing__description">
              A clean entry point for fast alerts, clear reporting, and coordinated response when every second matters.
            </p>

            <div className="landing__actions">
              <Link className="landing__button landing__button--primary" to="/login">
                Login
              </Link>
              <Link className="landing__button landing__button--secondary" to="/register">
                Register
              </Link>
            </div>

            <div className="landing__meta">
              {stats.map((item) => (
                <div className="landing__meta-item" key={item.label}>
                  <span className="landing__meta-value">{item.value}</span>
                  <span className="landing__meta-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="landing__visual" aria-hidden="true">
            <div className="landing__device">
              <div className="landing__device-header">
                <span className="landing__chip">Live map</span>
                <span className="landing__chip landing__chip--accent">Alert route</span>
              </div>

              <div className="landing__map">
                <div className="landing__map-grid" />
                <div className="landing__map-tag">Calbayog City</div>
                <div className="landing__pulse" />
                <svg
                  className="landing__map-svg"
                  viewBox="0 0 560 560"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="routeStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
                      <stop offset="45%" stopColor="#f6f4ef" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.95" />
                    </linearGradient>
                    <radialGradient id="glow" cx="50%" cy="48%" r="55%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                      <stop offset="70%" stopColor="#ef4444" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="560" height="560" fill="none" />
                  <circle cx="414" cy="170" r="150" fill="url(#glow)" />
                  <path
                    d="M56 392 C 118 322, 160 328, 212 288 S 330 214, 402 176 S 482 128, 524 102"
                    fill="none"
                    stroke="url(#routeStroke)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M56 392 C 118 322, 160 328, 212 288 S 330 214, 402 176 S 482 128, 524 102"
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.12"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="56" cy="392" r="9" fill="#ef4444" />
                  <circle cx="212" cy="288" r="9" fill="#ef4444" />
                  <circle cx="402" cy="176" r="9" fill="#ef4444" />
                  <g transform="translate(408 164)">
                    <path
                      d="M0 -36 C 17 -36 31 -22 31 -5 C 31 17 15 33 0 56 C -15 33 -31 17 -31 -5 C -31 -22 -17 -36 0 -36 Z"
                      fill="#ef4444"
                    />
                    <circle cx="0" cy="-6" r="12" fill="#0b0b0b" />
                    <circle cx="0" cy="-6" r="5" fill="#ffffff" />
                  </g>
                  <path
                    d="M0 446 H30 V408 H58 V486 H86 V364 H116 V438 H148 V398 H178 V500 H210 V402 H242 V458 H274 V336 H308 V500 H340 V426 H370 V384 H396 V500 H426 V418 H456 V452 H490 V404 H530 V440 H560 V560 H0 Z"
                    fill="#111111"
                  />
                  <path d="M0 446 H560" stroke="#ffffff" strokeOpacity="0.06" />
                </svg>
              </div>

              <div className="landing__device-footer">
                <span>Responder network online</span>
                <span>One-tap emergency flow</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LandingPage;
