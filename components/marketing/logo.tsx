export function Logo({ size = 20 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        {/* Three tributaries converging into one signal line. */}
        <path
          d="M3 20 L9 12 L13 15 L21 4"
          stroke="#2EE6A8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="21" cy="4" r="2.4" fill="#2EE6A8" />
      </svg>
      <span className="font-display text-[17px] font-semibold tracking-tight text-fg">
        upstream
      </span>
    </span>
  );
}
