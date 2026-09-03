const dns = require("dns");
const net = require("net");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SMTP_TIMEOUT_MS = 5000;

const KNOWN_PROVIDER_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "live.com.ph",
  "msn.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.jp",
  "yahoo.co.in",
  "yahoo.co.kr",
  "yahoo.ca",
  "yahoo.com.au",
  "yahoo.com.ph",
  "yahoo.fr",
  "yahoo.de",
  "yahoo.it",
  "yahoo.es",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "zohomail.com",
  "yandex.com",
  "yandex.ru",
  "mail.com",
  "email.com",
  "gmx.com",
  "gmx.net",
  "fastmail.com",
  "fastmail.fm",
  "tutanota.com",
  "tutanota.de",
  "kolumbus.fi",
  "rediffmail.com",
  "laposte.net",
  "wanadoo.fr",
  "orange.fr",
  "sfr.fr",
  "free.fr",
  "libero.it",
  "virgilio.it",
  "alice.it",
  "tin.it",
  "tiscali.it",
  "web.de",
  "t-online.de",
  "freenet.de",
  "arcor.de",
  "India.com",
  "rocketmail.com",
]);

const GOOGLE_MX_PATTERNS = [
  "google.com",
  "googlemail.com",
  "google.com.sg",
  "google.com.hk",
];

const MICROSOFT_MX_PATTERNS = [
  "outlook.com",
  "protection.outlook.com",
  "microsoft.com",
  "microsoft365.com",
  "hotmail.com",
  "office365.com",
];

function readSmtpResponse(socket, callback) {
  let response = "";
  const onData = (chunk) => {
    response += chunk.toString();
    const lines = response.split(/\r?\n/).filter(Boolean);
    const lastLine = lines[lines.length - 1] || "";
    if (/^\d{3} /.test(lastLine)) {
      socket.removeListener("data", onData);
      callback(Number(lastLine.slice(0, 3)), response);
    }
  };
  socket.on("data", onData);
}

function checkSmtpServer(exchange, email, options = {}) {
  const timeout = options.timeout || SMTP_TIMEOUT_MS;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    const socket = net.createConnection({ host: exchange, port: 25 });
    socket.setTimeout(timeout);
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));

    readSmtpResponse(socket, (greetingCode) => {
      if (greetingCode !== 220) return finish(false);
      socket.write("EHLO alertocalbayog.local\r\n");
      readSmtpResponse(socket, (ehloCode) => {
        if (ehloCode < 200 || ehloCode >= 400) return finish(false);
        socket.write("MAIL FROM:<noreply@alertocalbayog.local>\r\n");
        readSmtpResponse(socket, (mailCode) => {
          if (mailCode < 200 || mailCode >= 400) return finish(false);
          socket.write(`RCPT TO:<${email}>\r\n`);
          readSmtpResponse(socket, (recipientCode) => {
            socket.write("QUIT\r\n");
            finish(recipientCode === 250 || recipientCode === 251);
          });
        });
      });
    });
  });
}

function isKnownProvider(domain) {
  if (KNOWN_PROVIDER_DOMAINS.has(domain)) return true;
  const parts = domain.split(".");
  if (parts.length > 2) {
    const root = parts.slice(-2).join(".");
    return KNOWN_PROVIDER_DOMAINS.has(root);
  }
  return false;
}

function matchesMxPattern(exchange, patterns) {
  const lower = exchange.toLowerCase();
  return patterns.some((pattern) => lower.endsWith("." + pattern) || lower === pattern);
}

function isGoogleWorkspace(mxRecords) {
  return mxRecords.some((r) => matchesMxPattern(r.exchange, GOOGLE_MX_PATTERNS));
}

function isMicrosoft365(mxRecords) {
  return mxRecords.some((r) => matchesMxPattern(r.exchange, MICROSOFT_MX_PATTERNS));
}

async function verifyEmailExists(email, dependencies = {}) {
  const normalizedEmail = email?.toString().trim().toLowerCase();
  if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) return false;

  const domain = normalizedEmail.slice(normalizedEmail.lastIndexOf("@") + 1);
  const resolveMx = dependencies.resolveMx || dns.promises.resolveMx;
  const smtpCheck = dependencies.checkSmtpServer || checkSmtpServer;

  let records;
  try {
    records = await resolveMx(domain);
  } catch {
    return false;
  }
  if (!Array.isArray(records) || records.length === 0) return false;

  if (isKnownProvider(domain)) return true;

  const exchanges = records
    .filter((record) => record && record.exchange)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));

  if (isGoogleWorkspace(exchanges)) return true;
  if (isMicrosoft365(exchanges)) return true;

  for (const record of exchanges) {
    try {
      if (await smtpCheck(record.exchange, normalizedEmail)) return true;
    } catch {}
  }

  return false;
}

module.exports = { verifyEmailExists, checkSmtpServer };
