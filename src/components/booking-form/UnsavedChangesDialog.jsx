import { useEffect, useRef } from 'react';

// Asks "Leave without saving?" when useUnsavedChangesWarning has held back a route change.
// A <dialog> opened with showModal() keeps the keyboard inside it and closes on Escape.
export default function UnsavedChangesDialog({ blocker }) {
  const dialogRef = useRef(null);
  const stayRef = useRef(null);
  const isBlocked = blocker.state === 'blocked';

  // The dialog follows the blocker: open while a route change is waiting, closed otherwise.
  // On open the focus goes to "Keep editing", the safe choice, so Enter never throws work away.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isBlocked && !dialog.open) {
      dialog.showModal();
      stayRef.current.focus();
    }
    if (!isBlocked && dialog.open) dialog.close();
  }, [isBlocked]);

  function stay() {
    if (blocker.state === 'blocked') blocker.reset();
  }

  function leave() {
    if (blocker.state === 'blocked') blocker.proceed();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="leave-title"
      aria-describedby="leave-text"
      onCancel={(e) => {
        e.preventDefault();   // Escape means "stay"
        stay();
      }}
      className="m-auto w-[min(26rem,calc(100%-2rem))] rounded-xl p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
    >
      <h2 id="leave-title" className="text-lg font-semibold">Leave without saving?</h2>
      <p id="leave-text" className="mt-2 text-sm text-slate-600">
        You have changes on this booking that are not saved yet. If you leave now, they are lost.
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={leave}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          Leave without saving
        </button>
        <button
          type="button"
          ref={stayRef}
          onClick={stay}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          Keep editing
        </button>
      </div>
    </dialog>
  );
}
