function Icon({ children, className = "", viewBox = "0 0 24 24" }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 ${className}`.trim()}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="3.5" width="7" height="4.8" rx="1.8" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="1.8" />
      <rect x="3.5" y="13" width="7" height="7.5" rx="1.8" />
    </Icon>
  );
}

export function MapIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 6.5 9.5 5l5 1.5L19 5v12.5l-4.5 1.5-5-1.5L5 19z" />
      <path d="M9.5 5v12.5" />
      <path d="M14.5 6.5v12.5" />
      <path d="M12 8.4c-1.3 0-2.4 1.1-2.4 2.5 0 1.9 2.4 4.7 2.4 4.7s2.4-2.8 2.4-4.7c0-1.4-1.1-2.5-2.4-2.5Z" />
      <circle cx="12" cy="10.9" r="0.8" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ReportIcon(props) {
  return (
    <Icon {...props}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </Icon>
  );
}

export function QueueIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 6.5h14" />
      <path d="M5 12h14" />
      <path d="M5 17.5h9" />
      <circle cx="17" cy="17.5" r="1.6" />
      <circle cx="17" cy="12" r="1.6" />
      <circle cx="17" cy="6.5" r="1.6" />
    </Icon>
  );
}

export function ProfileIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.3" r="3.1" />
      <path d="M6.5 18.5c1.3-2.7 3.6-4.1 5.5-4.1s4.2 1.4 5.5 4.1" />
    </Icon>
  );
}

export function BellIcon(props) {
  return (
    <Icon {...props}>
      <path d="M8 17.5h8" />
      <path d="M10 17.5a2 2 0 0 0 4 0" />
      <path d="M7.5 16.2V11c0-2.8 1.8-4.8 4.5-5.2V5a0 0 0 0 1 0 0c0-.8.7-1.5 1.5-1.5S15 4.2 15 5v.8c2.7.4 4.5 2.4 4.5 5.2v5.2l1.3 1.3H6.2z" />
    </Icon>
  );
}

export function LogoutIcon(props) {
  return (
    <Icon {...props}>
      <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10" />
      <path d="M14 8.5 18 12l-4 3.5" />
      <path d="M18 12H10" />
    </Icon>
  );
}

export function BoltIcon(props) {
  return (
    <Icon {...props}>
      <path d="M13.2 2.5 5.8 13h5.1L10.8 21l7.4-10.5h-5.1z" />
    </Icon>
  );
}

export function CheckIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.5 4.9-5" />
    </Icon>
  );
}

export function ExpandIcon(props) {
  return (
    <Icon {...props}>
      <path d="M9 5H5v4" />
      <path d="M15 5h4v4" />
      <path d="M19 15v4h-4" />
      <path d="M5 15v4h4" />
      <path d="M8 8 5 5" />
      <path d="M16 8l3-3" />
      <path d="M8 16l-3 3" />
      <path d="M16 16l3 3" />
    </Icon>
  );
}

export function CloseIcon(props) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </Icon>
  );
}

export function MenuIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Icon>
  );
}
