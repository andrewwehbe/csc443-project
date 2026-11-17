import { useEffect, useId, useRef } from 'react';
import { buttonClass } from '../lib/buttons.js';

// A yes/no question before something that cannot be taken back, like cancelling a booking.
// Adapted from 21st.dev/@ddoemonn/modal, rebuilt on the browser's own <dialog>: showModal() keeps the
// keyboard inside the dialog, makes the page behind it unclickable, and Escape closes it, with no library.
//   <ConfirmDialog open={asking} title="Cancel this booking?" message="Study Room 104, Thu 12:00 to 13:30."
//     confirmLabel="Cancel booking" danger onConfirm={cancel} onCancel={() => setAsking(false)} />
// The safe choice comes first, so it is the one that has focus when the dialog opens.
export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel = 'Keep it', danger = false, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); onCancel(); }}          // Escape: React decides, not the browser
      onClick={(e) => { if (e.target === dialogRef.current) onCancel(); }}   // a click on the dimmed backdrop
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-xl border border-line bg-surface p-0 text-ink backdrop:bg-ink/40"
    >
      <div className="px-6 pb-5 pt-6">
        <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {message && <p className="mt-2 text-sm text-muted">{message}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
        <button type="button" onClick={onCancel} className={buttonClass('secondary', 'small')}>{cancelLabel}</button>
        <button type="button" onClick={onConfirm} className={buttonClass(danger ? 'danger' : 'primary', 'small')}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
