// Every icon in the app goes through here, so they all look the same: lucide outline, 1.5 stroke,
// 16 px ('sm') or 20 px ('md'), drawn in the text colour around it.
// Use: import { Clock } from 'lucide-react';  <Icon icon={Clock} />  or  <Icon icon={Clock} size="sm" />
// Icons are decoration: the words next to them carry the meaning, so screen readers skip them.

const SIZES = { sm: 16, md: 20 };

export default function Icon({ icon: LucideIcon, size = 'md', className = '' }) {
  return <LucideIcon size={SIZES[size]} strokeWidth={1.5} aria-hidden="true" className={`shrink-0 ${className}`} />;
}
