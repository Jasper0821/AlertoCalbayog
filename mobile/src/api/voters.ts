import api from "./axios";
import { getToken } from "../utils/Storage";

export interface VoterRequirements {
  /** A voters list is loaded, so residents can verify. */
  available: boolean;
  /** The list includes birthdates, so the resident must enter theirs. */
  needsBirthdate: boolean;
}

export interface VoterFields {
  lastName: string;
  firstName: string;
  middleName?: string;
  birthdate?: string;
  barangay?: string;
}

export type VoterResultStatus = "verified" | "not_found" | "claimed" | "incomplete" | "unavailable";

export interface VoterResult {
  status: VoterResultStatus;
  message: string;
}

export async function getVoterRequirements(): Promise<VoterRequirements> {
  try {
    const res = await api.get("/voters/requirements", { timeout: 10000 });
    return { available: Boolean(res.data?.available), needsBirthdate: Boolean(res.data?.needsBirthdate) };
  } catch {
    return { available: false, needsBirthdate: false };
  }
}

/** Checks the signed-in resident against the City's voters list. */
export async function verifyVoter(fields: VoterFields): Promise<VoterResult> {
  try {
    const res = await api.post("/voters/verify", fields, { headers: { Authorization: `Bearer ${await getToken()}` } });
    return res.data;
  } catch (error: any) {
    if (error.response?.data?.status) return error.response.data;
    return { status: "unavailable", message: error.response?.data?.message || "Couldn't check right now. Please try again later." };
  }
}

/** Short guidance after a check that did not verify. */
export function voterFollowUp(result: VoterResult | null): string {
  if (!result || result.status === "verified") return "";
  return `${result.message}\n\nYou can still use the app and send reports. Try again anytime from your profile.`;
}
