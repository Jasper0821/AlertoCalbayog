import api from "./axios";
import { getToken } from "../utils/Storage";

/** Short-lived upload credentials our API hands out; the API secret never leaves the server. */
export interface UploadCredentials {
  apiKey: string;
  timestamp: number;
  signature: string;
  cloudName: string;
}

/**
 * Posts one image straight to Cloudinary with signed credentials. `fields` are the
 * extra parameters the signature covers (folder, or public_id and type). Returns
 * Cloudinary's response, or null if the upload was refused or never arrived.
 */
export async function postToCloudinary(
  dataUrl: string,
  cred: UploadCredentials,
  fields: Record<string, string>
): Promise<{ secure_url?: string; public_id?: string } | null> {
  const form = new FormData();
  form.append("file", dataUrl);
  form.append("api_key", String(cred.apiKey));
  form.append("timestamp", String(cred.timestamp));
  form.append("signature", String(cred.signature));
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cred.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  return response.ok ? response.json() : null;
}

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
      headers: { Authorization: `Bearer ${await getToken()}` },
      timeout: 10000,
    });
    if (!cred?.configured) return dataUrl;

    const result = await postToCloudinary(dataUrl, cred, { folder: String(cred.folder) });
    return typeof result?.secure_url === "string" ? result.secure_url : dataUrl;
  } catch {
    // Offline, unconfigured, rate-limited or rejected — keep the inline image.
    return dataUrl;
  }
}
