export function StethoscopeLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Stethoscope Logo"
    >
      <path d="M2 6.5A4.5 4.5 0 0 1 6.5 2C8.985 2 11 4.015 11 6.5V19a5 5 0 0 0 5 5h0a5 5 0 0 0 5-5v-1" />
      <path d="M11 6.5a2.5 2.5 0 0 1 5 0V18" />
      <circle cx="6.5" cy="6.5" r="4.5" />
    </svg>
  );
}
