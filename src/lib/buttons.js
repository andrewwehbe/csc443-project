// The design pack's buttons (components.html): <Link className={buttonClass('secondary', 'small')}>Change</Link>.
// One primary per screen. A press shrinks the button to 96% for as long as it is held, so the click
// registers before anything else happens (it glides back if you let go).
const kinds = {
  primary: 'bg-brand-800 text-paper hover:bg-brand-900 focus-visible:outline-brand-800',
  secondary: 'border border-ink/20 bg-surface text-ink hover:bg-brand-50',
  quiet: 'text-muted hover:bg-brand-50 hover:text-ink',
  danger: 'bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700',   // only to confirm something destructive
};

export function buttonClass(kind, size = 'normal') {
  const padding = size === 'small' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  return `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 ${padding} ${kinds[kind]}`;
}
