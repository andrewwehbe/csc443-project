// The Ghurfa logo. The mark is a library doorway; the ochre wedge is two hours on a clock, the booking limit.
// <Logo /> is the mark plus the word, as in the header. <LogoMark className="h-16 w-16" /> is the mark alone.
// onDark swaps the colours for a navy background.

export function LogoMark({ className = 'h-7 w-7', onDark = false }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d="M16 96V46a34 34 0 0 1 68 0v50z" className={onDark ? 'fill-paper' : 'fill-brand-800'} />
      <path d="M50 52V24a28 28 0 0 1 24.25 14z" className="fill-accent-500" />
      <circle cx="50" cy="52" r="4" className={onDark ? 'fill-brand-800' : 'fill-paper'} />
    </svg>
  );
}

export default function Logo({ onDark = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className="h-7 w-7" onDark={onDark} />
      <span className={`-mt-1 font-display text-[1.65rem] font-bold leading-none tracking-tight ${onDark ? 'text-paper' : 'text-brand-800'}`}>
        ghurfa
      </span>
    </span>
  );
}
