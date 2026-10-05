import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

// Keep in sync with the mobile UserAgreementScreen (v1.0).
const LAST_UPDATED = "October 2026";

const pages = {
  privacy: {
    path: "/privacy",
    label: "Privacy Policy",
    title: "Privacy Policy",
    intro:
      "This policy explains what information Alerto Calbayog collects, how it is used, and who it is shared with when you use the web portal or mobile application.",
    sections: [
      {
        heading: "1. Information We Collect",
        body: [
          "Verified account details from Google Sign-In or registration: name, email address and profile picture.",
          "Contact phone numbers you provide.",
          "Precise GPS location, barangay, street, purok and landmark details at the time you submit a report.",
          "Photos and descriptions attached to emergency reports.",
          "Device IP address and browser or device information, recorded for security and accountability.",
        ],
      },
      {
        heading: "2. How We Use Your Data",
        body: [
          "To dispatch the appropriate emergency responders to your location.",
          "To notify you about the status of incidents you reported.",
          "To prevent and investigate false, prank or fraudulent reports.",
          "To produce anonymized incident statistics that help the city plan disaster risk reduction.",
        ],
      },
      {
        heading: "3. Data Sharing & Protection",
        body: [
          "Your location and contact details are shared only with authorized responders: CDRRMO, BFP and PNP of Calbayog City.",
          "We do not sell, rent or monetize user data.",
          "Access to reports is restricted to authenticated agency accounts, and administrative actions are recorded in audit logs.",
        ],
      },
      {
        heading: "4. Your Rights & Data Retention",
        body: [
          "Under the Data Privacy Act of 2012 (RA 10173), you may request access to, correction of, or deletion of your personal data.",
          "Emergency reports and audit logs may be retained after account deletion where required by law or for official records.",
          "To exercise these rights, reach us through the Contact Support page.",
        ],
      },
    ],
  },
  terms: {
    path: "/terms",
    label: "Terms of Service",
    title: "Terms of Service",
    intro:
      "By accessing or using Alerto Calbayog, you agree to be bound by these Terms of Service.",
    sections: [
      {
        heading: "1. Purpose of the Service",
        body: [
          "Alerto Calbayog is a civic emergency reporting tool that helps residents of Calbayog City report urgent situations to the CDRRMO, BFP and PNP.",
          "Use it only to report real fires, medical emergencies, crimes, floods or other public safety incidents.",
        ],
      },
      {
        heading: "2. Zero Tolerance for False Reports",
        body: [
          "Filing false, frivolous or prank emergency reports is strictly prohibited. It diverts responders away from real emergencies and endangers lives.",
          "Every submission records your authenticated account, device IP address and location. Violators will be banned and referred to law enforcement.",
        ],
      },
      {
        heading: "3. Account Responsibilities",
        body: [
          "You are responsible for keeping your account credentials confidential.",
          "You must not impersonate emergency officials, upload malicious content, or attempt to flood, reverse-engineer or bypass the system's safety mechanisms.",
        ],
      },
      {
        heading: "4. Limitation of Liability",
        body: [
          "Responders strive to act quickly, but the city government and the developers do not guarantee response times or uninterrupted availability, especially during severe network or disaster outages.",
          "If the app is unavailable, call the emergency hotlines directly.",
        ],
      },
      {
        heading: "5. Changes to These Terms",
        body: [
          "These terms may be updated. Continued use of the service after an update means you accept the revised terms.",
        ],
      },
    ],
  },
  protocols: {
    path: "/emergency-protocols",
    label: "Emergency Protocols",
    title: "Emergency Protocols",
    intro:
      "What to do before, during and after an emergency, and how to report it so responders can reach you fast.",
    sections: [
      {
        heading: "When to Report",
        body: [
          "Report immediately if lives or property are in danger: fire, flooding, landslide, road accidents, medical emergencies, crimes in progress or other public safety threats.",
          "If someone's life is at immediate risk, call the hotline first, then file a report in the app.",
        ],
      },
      {
        heading: "How to File a Good Report",
        body: [
          "Turn on location services so your exact GPS position is attached.",
          "Choose the correct emergency type so the right agency is notified.",
          "Describe what is happening, how many people are involved and any injuries.",
          "Add a nearby landmark and, if it is safe to do so, a photo.",
          "Keep your phone on and reachable. Responders may call you for details.",
        ],
      },
      {
        heading: "Fire",
        body: [
          "Get everyone out and stay out. Do not go back inside for belongings.",
          "Stay low under smoke and feel doors for heat before opening them.",
          "Report to BFP, then move to a safe distance and keep the road clear for fire trucks.",
        ],
      },
      {
        heading: "Flood & Typhoon",
        body: [
          "Monitor CDRRMO advisories and evacuate early when told to.",
          "Avoid walking or driving through floodwater. Turn off electricity if water is entering your home.",
          "Report trapped persons, rising water and landslides to CDRRMO.",
        ],
      },
      {
        heading: "Crime or Threat to Safety",
        body: [
          "Move to a safe place before reporting. Do not confront suspects.",
          "Note descriptions of people, vehicles and the direction they went.",
          "Report to PNP and do not disturb the scene.",
        ],
      },
      {
        heading: "Medical Emergency",
        body: [
          "Check that the scene is safe, then check the person's breathing and responsiveness.",
          "Apply pressure to bleeding and do not move someone with a possible spinal injury unless they are in danger.",
          "Report to CDRRMO for ambulance and rescue support.",
        ],
      },
    ],
    hotlines: [
      { agency: "National Emergency Hotline", number: "911" },
      { agency: "CDRRMO", number: "0917 1779 215" },
      { agency: "BFP Calbayog", number: "0927 1279 488" },
      { agency: "PNP Calbayog", number: "0998 598 6571" },
    ],
  },
};

const pageByPath = Object.fromEntries(Object.values(pages).map((p) => [p.path, p]));

function Policies() {
  const { pathname } = useLocation();
  const page = pageByPath[pathname] || pages.privacy;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${page.title} | Alerto Calbayog`;
  }, [page]);

  return (
    <main className="min-h-screen flex flex-col bg-white font-sans text-slate-900 antialiased">
      <Navbar />

      <div className="relative pt-32 pb-10 px-6 sm:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <nav className="flex flex-wrap gap-2 mb-8">
            {Object.values(pages).map((p) => (
              <Link
                key={p.path}
                to={p.path}
                className={`rounded-md px-3 py-1.5 text-[12px] font-bold transition-colors ${
                  p.path === page.path
                    ? "bg-[#0a1e3f] text-white"
                    : "bg-slate-100 text-[#5f6368] hover:bg-slate-200"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#0a1e3f] tracking-tight mb-4">{page.title}</h1>
          <p className="text-[17px] text-[#5f6368]">{page.intro}</p>
          <p className="mt-3 text-[12px] text-slate-400">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="pb-16 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto space-y-8">
          {page.hotlines && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#d93025] mb-4">Emergency Hotlines</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {page.hotlines.map((h) => (
                  <a
                    key={h.agency}
                    href={`tel:${h.number.replace(/\s/g, "")}`}
                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3 border border-red-100 hover:border-red-300 transition-colors"
                  >
                    <span className="text-[13px] font-semibold text-[#0a1e3f]">{h.agency}</span>
                    <span className="text-[14px] font-bold text-[#d93025]">{h.number}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {page.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-bold text-[#0a1e3f] mb-3">{s.heading}</h2>
              <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed text-[#3c4043]">
                {s.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}

          <p className="border-t border-slate-200 pt-6 text-[14px] text-[#5f6368]">
            Questions about this page?{" "}
            <Link to="/contact" className="font-semibold text-[#0a1e3f] hover:underline">
              Contact Support
            </Link>
            .
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default Policies;
