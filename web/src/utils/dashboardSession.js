export const DASHBOARD_NAV_STORAGE_KEYS = [
  "adminActiveNav",
  "cdrrmoActiveNav",
  "pnpActiveNav",
];

export function clearDashboardNavigationState() {
  DASHBOARD_NAV_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}
