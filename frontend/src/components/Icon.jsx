// One icon language: 24px grid, 1.6 stroke, round caps — so weights match the
// adjacent text and nothing looks pasted in from a different set.
const PATHS = {
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.6-3 8.2-7 10-4-1.8-7-5.4-7-10V6l7-3z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  car: (
    <>
      <path d="M4 15v-3.2c0-.5.1-.9.3-1.3L6 7.2A2 2 0 017.8 6h8.4A2 2 0 0118 7.2l1.7 3.3c.2.4.3.8.3 1.3V15" />
      <path d="M3.5 15h17v2.5a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5V17h-11v.5a.5.5 0 01-.5.5H4a.5.5 0 01-.5-.5V15z" />
      <circle cx="7.5" cy="12.5" r=".6" />
      <circle cx="16.5" cy="12.5" r=".6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M4 10h16M8.5 3v4M15.5 3v4" />
    </>
  ),
  chart: (
    <>
      <path d="M5 20V11M12 20V5M19 20v-6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.6-3.6 3.4-5.5 7-5.5s6.4 1.9 7 5.5" />
    </>
  ),
  store: (
    <>
      <path d="M4 9.5L5.5 4h13L20 9.5" />
      <path d="M4 9.5c0 1.4 1.1 2.5 2.5 2.5S9 10.9 9 9.5c0 1.4 1.1 2.5 2.5 2.5h1c1.4 0 2.5-1.1 2.5-2.5 0 1.4 1.1 2.5 2.5 2.5S20 10.9 20 9.5" />
      <path d="M5.5 12v8h13v-8M10 20v-4.5h4V20" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M3 3l18 18M10.6 6a9 9 0 011.4-.1c6 0 9.5 6.1 9.5 6.1a17 17 0 01-2.7 3.4M6.6 7.6C4 9.2 2.5 12 2.5 12S6 18.1 12 18.1c1.4 0 2.7-.3 3.8-.8M9.9 9.9a2.8 2.8 0 003.9 3.9" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.2M12 16.3h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  chevron: (
    <>
      <path d="M9 6l6 6-6 6" />
    </>
  ),
  'chevron-down': (
    <>
      <path d="M6 9l6 6 6-6" />
    </>
  ),
  layout: (
    <>
      <rect x="3.5" y="3.5" width="7" height="9" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="2" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="2" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="2" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 20.5h-3a2 2 0 01-2-2v-13a2 2 0 012-2h3M15.5 16.5l4.5-4.5-4.5-4.5M20 12H9.5" />
    </>
  ),
};

export default function Icon({ name, size = 24, className, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
