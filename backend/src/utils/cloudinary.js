const cloudinary = require("cloudinary").v2;

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const API_KEY = process.env.CLOUDINARY_API_KEY?.trim();
const API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim();

/**
 * Folders photos are filed under. Keeping resident proof and responder resolution
 * evidence separate makes them easy to audit and to apply different retention to.
 */
const UPLOAD_FOLDERS = {
  proof: "alerto/proof",
  resolution: "alerto/resolution",
};

const isConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
  console.log(`\n☁️  [Cloudinary] Configured for cloud "${CLOUD_NAME}"`);
} else {
  // Loud, like the mailer warning. A silently unconfigured image host would send
  // every client back to embedding megabytes of base64 with no visible reason.
  console.warn(
    "\n⚠️  [Cloudinary] CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are not set.\n" +
    "    Photo uploads will fall back to inline base64, which is capped by MongoDB's 16MB document limit.\n" +
    "    Set all three in your hosting provider's environment settings (Render → Environment).\n"
  );
}

/**
 * Produces the short-lived credentials a client needs to upload one file straight
 * to Cloudinary. The API secret is used to sign and is never returned.
 *
 * Direct client upload is deliberate: it keeps multi-megabyte images off the API
 * host entirely, so a cold or slow instance never delays an emergency report, and
 * the report request itself carries only a short URL.
 */
const signUpload = (kind) => {
  if (!isConfigured) return null;

  const folder = UPLOAD_FOLDERS[kind];
  if (!folder) return null;

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    API_SECRET
  );

  return { signature, timestamp, folder, apiKey: API_KEY, cloudName: CLOUD_NAME };
};

module.exports = { cloudinary, signUpload, isConfigured, UPLOAD_FOLDERS };
