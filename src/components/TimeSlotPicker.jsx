import { useRef } from 'react';

// The start times of the chosen room and day as buttons: tap a free one instead of typing a time.
// Adapted from 21st.dev/@klyv-ui/time-slot-picker. Taken and past times stay in the grid, struck through,
// so a busy morning still reads as busy. It is one radio group: Tab reaches it once, the arrow keys move.
//   slots = halfHourSlots(...) from lib/bookingForm.js   value = form.start   onPick('14:30')
export default function TimeSlotPicker({ slots, value, onPick }) {
  const buttons = useRef([]);
  // The one button Tab lands on: the chosen time, or else the first free one.
  const chosen = slots.findIndex((s) => s.time === value && s.available);
  const focusStop = chosen >= 0 ? chosen : slots.findIndex((s) => s.available);

  // Arrow keys jump to the next free time in that direction, skipping taken ones.
  function handleKey(e, index) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    for (let i = index + step; i >= 0 && i < slots.length; i += step) {
      if (slots[i].available) { onPick(slots[i].time); buttons.current[i].focus(); return; }
    }
  }

  if (!slots.some((s) => s.available)) {
    return <p className="rounded-lg border border-dashed border-ink/25 px-4 py-4 text-center text-sm text-muted">No start times left on this day. Try another day or room.</p>;
  }

  return (
    <div role="radiogroup" aria-label="Free start times" className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {slots.map((slot, i) => {
        const checked = slot.time === value;
        // h-11 on phones: a 44px target for a thumb. No transition: the arrow keys move the choice, and a
        // highlight that glides falls behind the keys.
        return (
          <button key={slot.time} ref={(el) => { buttons.current[i] = el; }} type="button" role="radio" aria-checked={checked}
            disabled={!slot.available} tabIndex={i === focusStop ? 0 : -1}
            onClick={() => onPick(slot.time)} onKeyDown={(e) => handleKey(e, i)}
            className={`h-11 rounded-lg border font-mono text-xs tabular-nums sm:h-9 ${checked
              ? 'border-brand-800 bg-brand-800 font-semibold text-paper'
              : 'border-line bg-surface text-ink hover:border-brand-400'} disabled:cursor-not-allowed disabled:border-transparent disabled:bg-paper disabled:text-muted/50 disabled:line-through`}>
            {slot.time}
            {!slot.available && <span className="sr-only">, taken or past</span>}
          </button>
        );
      })}
    </div>
  );
}
