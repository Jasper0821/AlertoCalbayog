import api from "./axios";
import { getToken } from "../utils/Storage";

export interface ReportRef {
  _id: string;
  status?: string;
  emergencyType?: string;
  createdAt?: string;
  resolvedAt?: string | null;
  assignedAgency?: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  /** Populated by the server with a few report fields; null for advisories. */
  reportId?: ReportRef | string | null;
  type?: string;
  category?: string;
  read: boolean;
  createdAt: string;
  metadata?: { status?: string; reportId?: string };
}

const auth = async () => ({ headers: { Authorization: `Bearer ${await getToken()}` } });

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await api.get("/notifications/me", { ...(await auth()), params: { limit: 100 } });
  const data = res.data;
  return Array.isArray(data) ? data : data?.notifications ?? [];
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await api.get("/notifications/unread-count", await auth());
  return Number(res.data?.count) || 0;
}

export async function markRead(id: string): Promise<void> {
  await api.put(`/notifications/${id}/read`, {}, await auth());
}

export async function markUnread(id: string): Promise<void> {
  await api.put(`/notifications/${id}/unread`, {}, await auth());
}

export async function markAllRead(): Promise<void> {
  await api.put("/notifications/read-all", {}, await auth());
}

/** Deletes the notification only — never the report it is about. */
export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`, await auth());
}
