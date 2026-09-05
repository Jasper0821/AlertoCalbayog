import api from "./axios.js";

/**
 * Uploads one image straight to Cloudinary using a short-lived signature from our
 * API, and returns the hosted URL.
 *
 * Direct upload keeps multi-megabyte images off the API host, so a cold instance
 * never delays an emergency, and the report request carries only a short URL
 * instead of ~3MB of base64 (which MongoDB's 16MB document limit cannot absorb
 * once resolution photos are added).
 *
 * Returns the original data URI unchanged if anything fails — evidence must never
 * be lost because an image host was unreachable.
 *
 * @param {string} dataUrl  "data:image/jpeg;base64,..."
 * @param {"proof"|"resolution"} kind
 * @returns {Promise<string>} hosted URL, or the input data URI on failure
 */
export async function uploadEvidenceImage(dataUrl, kind = "resolution") {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }

  try {
    const { data: cred } = await api.get("/uploads/signature", { params: { kind } });
    if (!cred?.configured) return dataUrl;

    const form = new FormData();
    form.append("file", dataUrl);
    form.append("api_key", cred.apiKey);
    form.append("timestamp", cred.timestamp);
    form.append("signature", cred.signature);
    form.append("folder", cred.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cred.cloudName}/image/upload`,
      { method: "POST", body: form }
    );

    if (!response.ok) return dataUrl;

    const result = await response.json();
    return result.secure_url || dataUrl;
  } catch {
    // Offline, unconfigured, rate-limited or rejected — fall back to inline.
    return dataUrl;
  }
}

/** Uploads a batch, preserving order. Individual failures fall back to base64. */
export async function uploadEvidenceImages(dataUrls, kind = "resolution") {
  if (!Array.isArray(dataUrls)) return [];
  return Promise.all(dataUrls.map((url) => uploadEvidenceImage(url, kind)));
}
