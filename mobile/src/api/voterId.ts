import api from "./axios";
import { getToken } from "../utils/Storage";
import { postToCloudinary } from "./uploads";

export type VoterIdDocument = "voters_id" | "voters_certification";

export const DOCUMENT_LABELS: Record<VoterIdDocument, string> = {
  voters_id: "Voter's ID",
  voters_certification: "Voter's Certification",
};

/** The resident's latest request, as /auth/me and the submit response report it. */
export interface VoterIdReview {
  status: "" | "pending" | "approved" | "rejected";
  documentType?: VoterIdDocument | "";
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string;
}

export interface VoterIdResult {
  ok: boolean;
  message: string;
  review?: VoterIdReview;
}

const auth = async () => ({ headers: { Authorization: `Bearer ${await getToken()}` } });

/** Whether the server can take Voter's ID photos (it needs Cloudinary set up). */
export async function getVoterIdAvailable(): Promise<boolean> {
  try {
    const res = await api.get("/voter-id/requirements", { timeout: 10000 });
    return Boolean(res.data?.available);
  } catch {
    return false;
  }
}

/** Uploads one photo to the private spot the server signed for it, and returns its id. */
async function uploadPhoto(dataUrl: string, side: "front" | "selfie"): Promise<string> {
  const { data: cred } = await api.get("/voter-id/upload-signature", { params: { side }, timeout: 15000, ...(await auth()) });
  const result = await postToCloudinary(dataUrl, cred, { public_id: cred.publicId, type: cred.type });
  if (result?.public_id !== cred.publicId) throw new Error("upload failed");
  return cred.publicId;
}

/**
 * Sends the resident's Voter's ID photo and selfie for the City to review. The
 * photos go straight to private storage; only their ids pass through our API.
 */
export async function submitVoterId(input: {
  documentType: VoterIdDocument;
  front: string;
  selfie: string;
}): Promise<VoterIdResult> {
  try {
    const [frontPublicId, selfiePublicId] = await Promise.all([
      uploadPhoto(input.front, "front"),
      uploadPhoto(input.selfie, "selfie"),
    ]);
    const res = await api.post(
      "/voter-id",
      { documentType: input.documentType, frontPublicId, selfiePublicId },
      { timeout: 20000, ...(await auth()) }
    );
    return { ok: true, message: res.data?.message || "Your Voter's ID was sent for review.", review: res.data?.review };
  } catch (error: any) {
    return {
      ok: false,
      message:
        error.response?.data?.message ||
        "We couldn't send your photos. Check your connection and try again from your Profile.",
      review: error.response?.data?.review,
    };
  }
}

/** Cancels a request that is still waiting for review; the server deletes the photos. */
export async function withdrawVoterId(): Promise<VoterIdResult> {
  try {
    const res = await api.delete("/voter-id/me", await auth());
    return { ok: true, message: res.data?.message || "Your request was cancelled.", review: res.data?.review };
  } catch (error: any) {
    return { ok: false, message: error.response?.data?.message || "Couldn't cancel right now. Please try again." };
  }
}
