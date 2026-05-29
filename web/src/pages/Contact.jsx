import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const contacts = [
  {
    agency: "CDRRMO",
    fullName: "City Disaster Risk Reduction & Management Office",
    number: "(055) 209-1234",
    email: "cdrrmo@calbayog.gov.ph",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    color: "text-blue-700",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    agency: "BFP",
    fullName: "Bureau of Fire Protection — Calbayog City",
    number: "(055) 209-5678",
    email: "bfp.calbayog@bfp.gov.ph",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
  },
  {
    agency: "PNP",
    fullName: "Philippine National Police — Calbayog City Station",
    number: "(055) 209-9012",
    email: "pnp.calbayog@pnp.gov.ph",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    color: "text-indigo-700",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-800",
  },
];

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-32 pb-16 px-6 sm:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-md bg-[#ffe8e8] dark:bg-red-900/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#d93025] dark:text-red-400 mb-6">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.42 2 2 0 0 1 3.6 1.26h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.4a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
            </svg>
            Contact Us
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#0a1e3f] dark:text-white tracking-tight mb-4">
            Get in Touch
          </h1>
          <p className="text-[17px] text-[#5f6368] dark:text-slate-400 max-w-xl mx-auto">
            For emergencies, call your nearest agency directly. For questions and general inquiries, use the form below.
          </p>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="pb-16 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0a1e3f] dark:text-white mb-2 text-center">Emergency Hotlines</h2>
          <p className="text-[#5f6368] dark:text-slate-400 text-center text-[14px] mb-8">For life-threatening emergencies, call directly.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {contacts.map((c) => (
              <div key={c.agency} className={`rounded-2xl border p-6 ${c.bg} ${c.border}`}>
                <div className={`mb-3 ${c.color}`}>{c.icon}</div>
                <div className={`text-xs font-black uppercase tracking-widest mb-1 ${c.color}`}>{c.agency}</div>
                <h3 className="text-[14px] font-bold text-[#0a1e3f] dark:text-white mb-4 leading-snug">{c.fullName}</h3>
                <div className="space-y-2">
                  <a href={`tel:${c.number}`} className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#0a1e3f] dark:text-white hover:underline transition-transform duration-100 active:scale-[0.98] transform">
                    <svg className="w-4 h-4 text-[#5f6368]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.42 2 2 0 0 1 3.6 1.26h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.4a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
                    </svg>
                    {c.number}
                  </a>
                  <br />
                  <a href={`mailto:${c.email}`} className="inline-flex items-center gap-2 text-[13px] text-[#5f6368] dark:text-slate-400 hover:underline break-all transition-transform duration-100 active:scale-[0.98] transform">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    {c.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default Contact;
