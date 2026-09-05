import api from "./axios";

/**
 * Uploads one captured photo straight to Cloudinary using a short-lived signature
 * from our API, and returns the hosted URL.
 *
 * Uploading direct from the phone keeps multi-megabyte images off the API host, so
 * a cold instance never delays an emergency report, and the report request carries
 * only a short URL instead of ~3MB of base64 — which MongoDB's 16MB per-document
 * limit cannot absorb once resolution photos are added to the same report.
 *
 * Returns the original data URI unchanged if anything fails. An emergency report
 * must never be blocked because an image host was unreachable.
 */
export async function uploadEvidenceImage(
  dataUrl: string,
  kind: "proof" | "resolution" = "proof"
): Promise<string> {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }

  try {
    const { data: cred } = await api.get("/uploads/signature", {
      params: { kind },
      timeout: 10000,
    });
    if (!cred?.configured) return dataUrl;

    const form = new FormData();
    form.append("file", dataUrl);
    form.append("api_key", String(cred.apiKey));
    form.append("timestamp", String(cred.timestamp));
    form.append("signature", String(cred.signature));
    form.append("folder", String(cred.folder));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cred.cloudName}/image/upload`,
      { method: "POST", body: form }
    );

    if (!response.ok) return dataUrl;

    const result = await response.json();
    return typeof result?.secure_url === "string" ? result.secure_url : dataUrl;
  } catch {
    // Offline, unconfigured, rate-limited or rejected — keep the inline image.
    return dataUrl;
  }
}
