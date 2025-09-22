export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 125"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Spirit Logo"
    >
      <path d="M50 0C27.9 0 10 17.9 10 40c0 22.1 40 60 40 60s40-37.9 40-60C90 17.9 72.1 0 50 0zm0 60c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z" />
      <path d="M55 25h-10v10h-10v10h10v10h10v-10h10v-10h-10z" fill="hsl(var(--background))" />
    </svg>
  );
}
