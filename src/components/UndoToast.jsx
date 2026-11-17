import { RotateCcw } from 'lucide-react';
import Icon from './Icon.jsx';

// The message that floats at the bottom after a cancel: "Booking cancelled. Undo", with a ring that empties
// over the seconds you have left. Adapted from 21st.dev/@arihantcodes/undo-pill, without framer-motion:
// the ring is a CSS animation (index.css, .undo-ring) that pauses while the pointer or keyboard is on the
// message, and when it ends the message closes by itself.
//   toast = { id, message, canUndo }   onUndo: put the booking back   onDone: hide the message
export default function UndoToast({ toast, onUndo, onDone, seconds = 6 }) {
  if (!toast) return null;
  const ring = 2 * Math.PI * 7;   // the ring's length, so the animation can empty it exactly

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-6">
      {/* key: a new toast restarts the ring from full */}
      <div key={toast.id} role="status" className="undo-toast pointer-events-auto flex items-center gap-3 rounded-full bg-brand-900 py-2 pl-3 pr-2 text-sm text-paper">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="-rotate-90">
          <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
          <circle cx="9" cy="9" r="7" fill="none" stroke="var(--color-accent-400)" strokeWidth="2" strokeDasharray={ring}
            className="undo-ring" style={{ '--ring': ring, '--seconds': `${seconds}s` }} onAnimationEnd={onDone} />
        </svg>
        <span>{toast.message}</span>
        {toast.canUndo ? (
          <button type="button" onClick={onUndo} className="inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-3 py-1 font-semibold text-paper hover:bg-paper/20 focus-visible:outline-2 focus-visible:outline-accent-400">
            <Icon icon={RotateCcw} size="sm" />Undo
          </button>
        ) : (
          <button type="button" onClick={onDone} className="rounded-full px-3 py-1 font-semibold text-paper/80 hover:text-paper">Close</button>
        )}
      </div>
    </div>
  );
}
