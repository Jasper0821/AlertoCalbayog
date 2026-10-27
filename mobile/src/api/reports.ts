import api from "./axios";
import { getToken } from "../utils/Storage";

export interface SubmitReportInput {
  type: string;
  latitude: number;
  longitude: number;
  /** GPS uncertainty in metres; null when the resident placed the pin by hand. */
  accuracy: number | null;
  barangay: string;
  street: string;
  purok: string;
  landmark: string;
  symptoms: string[];
  peopleCount: number;
  photos: string[];
  note: string;
}

const authHeaders = async () => ({ Authorization: `Bearer ${await getToken()}` });

/**
 * Symptoms and head count are folded into the description as well as sent as
 * fields, so every dashboard already shows them in the incident narrative.
 */
export function buildDescription(type: string, symptoms: string[], peopleCount: number, note: string): string {
  const summary = [
    symptoms.join(", "),
    `${peopleCount} ${peopleCount === 1 ? "person needs" : "people need"} help`,
  ]
    .filter(Boolean)
    .join(" · ");
  const trimmedNote = note.trim();
  return trimmedNote ? `${summary}. ${trimmedNote}` : summary || `${type.toUpperCase()} incident reported`;
}

export async function submitReport(
  input: SubmitReportInput,
  onProgress?: (percent: number) => void
): Promise<{ reportId: string }> {
  const res = await api.post(
    "/emergency",
    {
      emergencyType: input.type,
      description: buildDescription(input.type, input.symptoms, input.peopleCount, input.note),
      proofPhotos: input.photos,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      barangay: input.barangay.trim(),
      street: input.street.trim(),
      purok: input.purok.trim(),
      landmark: input.landmark.trim(),
      symptoms: input.symptoms,
      peopleCount: input.peopleCount,
    },
    {
      headers: await authHeaders(),
      onUploadProgress: (event) => {
        if (event.total && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    }
  );
  return { reportId: res.data.report._id };
}

/** The full report, including photos, for its owner. */
export async function fetchReport(reportId: string): Promise<any> {
  const res = await api.get(`/emergency/${reportId}`, { headers: await authHeaders() });
  return res.data;
}

/**
 * The report without its photos, cheap enough to poll. Used as a backstop for the
 * live socket, which can drop on mobile data without the app noticing.
 */
export async function fetchReportSummary(reportId: string): Promise<any | null> {
  const res = await api.get("/emergency/me", { headers: await authHeaders() });
  return Array.isArray(res.data) ? res.data.find((r: any) => r._id === reportId) ?? null : null;
}

export async function addPhotos(reportId: string, photos: string[]): Promise<any> {
  const res = await api.post(`/emergency/${reportId}/photos`, { photos }, { headers: await authHeaders() });
  return res.data.report;
}

/** The resident's own reports, newest first, without photos. */
export async function fetchMyReports(): Promise<any[]> {
  const res = await api.get("/emergency/me", { headers: await authHeaders() });
  return Array.isArray(res.data) ? res.data : [];
}

/** "Yes, resolved": the resident has seen the evidence and is okay. */
export async function confirmReport(reportId: string): Promise<any> {
  const res = await api.post(`/emergency/${reportId}/confirm`, {}, { headers: await authHeaders() });
  return res.data.report;
}

/** Hides a finished report from "My reports" only. The report itself is kept. */
export async function removeFromHistory(reportId: string): Promise<void> {
  await api.delete(`/emergency/${reportId}`, { headers: await authHeaders() });
}

export async function cancelReport(reportId: string): Promise<any> {
  const res = await api.post(`/emergency/${reportId}/cancel`, {}, { headers: await authHeaders() });
  return res.data.report;
}
