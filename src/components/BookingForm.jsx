import { useState } from 'react';
import { Link } from 'react-router';
import { bySize } from '../data/rooms.js';
import { checkHouseRules } from '../lib/bookingRules.js';
import { formToDraft, halfHourSlots, nearestFreeSlot, validateForm } from '../lib/bookingForm.js';
import { whenPhrase } from '../lib/roomDetail.js';
import { formatDate, formatTime } from '../lib/time.js';
import { clock } from '../lib/quickBook.js';
import { buttonClass } from '../lib/buttons.js';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning.js';
import ConfirmDialog from './ConfirmDialog.jsx';
import DayTimeline from './DayTimeline.jsx';
import TimeSlotPicker from './TimeSlotPicker.jsx';
import Field from './Field.jsx';

// Every half hour the library is open, 08:00 to 22:00, in the same 24-hour style as the rest of the app
// (a type="time" box shows "--:-- --" and AM/PM on many computers).
const TIMES = Array.from({ length: 29 }, (_, i) => clock(8 * 60 + i * 30));
// The words for "To book, add a room, a start time and …" under the button.
const NEEDED = { roomId: 'a room', date: 'a date', start: 'a start time', end: 'an end time', purpose: 'what it is for', attendees: 'how many of you' };

const inputClass =
  'w-full rounded-lg border border-ink/20 bg-surface px-3 py-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100 aria-invalid:border-red-500 aria-invalid:focus:ring-red-100';

// The form behind New booking and Edit booking (design pack 05). Every keystroke updates `form`, React
// re-renders, and the fields and the house rules are checked again, so a clash shows before submit.
// onSave is addBooking or updateBooking from useBookings; onSaved runs after a successful save.
export default function BookingForm({ rooms, bookings, currentUser, initialForm, bookingId, submitLabel, onSave, onSaved }) {
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});          // fields the user has changed
  const [submitted, setSubmitted] = useState(false);   // after a submit attempt, every error shows
  const [saveError, setSaveError] = useState('');

  const room = rooms.find((r) => r.id === form.roomId);
  const errors = validateForm(form, rooms);
  const timesOk = !errors.roomId && !errors.date && !errors.start && !errors.end;
  const draft = timesOk ? { ...formToDraft(form), id: bookingId, userId: currentUser.id } : null;
  const problems = draft ? checkHouseRules(draft, bookings) : [];
  const messageFor = (rule) => problems.find((p) => p.rule === rule)?.message;
  // The booking a rule points at: the one the time clashes with, or the user's other booking that day.
  const bookingFor = (rule) => bookings.find((b) => b.id === problems.find((p) => p.rule === rule)?.bookingId);
  const clash = bookingFor('overlap');
  const sameDay = bookingFor('one-per-day');
  const freeSlot = clash && nearestFreeSlot(draft, bookings);
  const blocked = Object.keys(errors).length > 0 || problems.length > 0;
  const leaving = useUnsavedChangesWarning(JSON.stringify(form) !== JSON.stringify(initialForm));

  // An error shows once its field has been changed, or after a submit attempt. Two house rules belong to
  // one field and show there at once: out of service on Room, the 2-hour limit on To.
  const ruleError = { roomId: messageFor('out-of-service'), end: messageFor('max-length') };
  const errorFor = (name) => ruleError[name] ?? (touched[name] || submitted ? errors[name] : undefined);

  // What every input needs: its value, onChange, and the link to its error or hint.
  const fieldProps = (name) => ({
    id: name, name, value: form[name], onChange: handleChange, className: inputClass,
    'aria-invalid': Boolean(errorFor(name)), 'aria-describedby': `${name}-msg`,
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setTouched({ ...touched, [name]: true });
    setSaveError('');
  }

  // A tap on the time picker sets From, and To follows: the same length as before (if it was a valid one,
  // two hours at most), else one hour, never past 22:00.
  function pickStart(time) {
    const minutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    const length = form.start && form.end && minutes(form.end) > minutes(form.start) ? Math.min(minutes(form.end) - minutes(form.start), 120) : 60;
    const end = Math.min(minutes(time) + length, 22 * 60);
    setForm({ ...form, start: time, end: `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}` });
    setTouched({ ...touched, start: true, end: true });
    setSaveError('');
  }

  // Why the button is greyed out, said next to it, so nobody has to guess.
  function blockedReason() {
    if (clash) return 'Resolve the clash to continue';
    if (submitted) return 'Fix what is marked to continue';
    const missing = Object.keys(errors).filter((name) => !form[name]).map((name) => NEEDED[name]);
    if (missing.length === 0) return 'Fix what is marked to continue';
    const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(', ')} and ${missing.at(-1)}`;
    return `To book, add ${list}.`;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    const firstError = Object.keys(errors)[0];
    if (firstError) document.getElementById(firstError).focus();
    if (blocked) return;   // the fields and the panels already say what is wrong
    const result = onSave(formToDraft(form));
    if (result.ok) onSaved(result.booking);
    else setSaveError(result.problems[0].message);
  }

  // The room's day from the shared timeline, the chosen time drawn on top (red when it clashes).
  // The booking being edited is left out, so it is not drawn twice.
  const timeline = draft && (
    <div className="mt-3">
      <DayTimeline bookings={bookings.filter((b) => b.roomId === room.id && b.id !== bookingId)} date={form.date} currentUser={currentUser}
        chosen={{ start: draft.start, end: draft.end }} clash={Boolean(clash)} label={`${room.name} · ${formatDate(draft.start)}`} />
    </div>
  );

  return (
    <form noValidate onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Field label="Room" name="roomId" error={errorFor('roomId')}>
          <select {...fieldProps('roomId')}>
            <option value="">Choose a room</option>
            {rooms.toSorted(bySize).map((r) => (
              <option key={r.id} value={r.id} disabled={r.status === 'out-of-service'}>
                {r.name} · {r.status === 'out-of-service' ? 'out of service' : `seats ${r.capacity}`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" name="date" error={errorFor('date')}><input type="date" {...fieldProps('date')} /></Field>
        {room && form.date && (
          <div className="sm:col-span-2">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Free start times on {room.name}</p>
            <TimeSlotPicker slots={halfHourSlots(room.id, form.date, bookings, bookingId)} value={form.start} onPick={pickStart} />
          </div>
        )}
        <Field label="From" name="start" error={errorFor('start')}><TimeSelect times={TIMES.slice(0, -1)} {...fieldProps('start')} /></Field>
        <Field label="To" name="end" error={errorFor('end')} hint="Two hours maximum."><TimeSelect times={TIMES.slice(1)} {...fieldProps('end')} /></Field>
      </div>

      {/* The house rules, checked while the time is chosen. Each refusal has its own panel and words. */}
      <div aria-live="polite" className="space-y-4">
        {clash && (
          <div className="rounded-lg border-l-4 border-red-600 bg-red-50 p-4 text-red-900">
            <p className="text-sm font-semibold">{form.start} to {form.end} clashes with a booking already on {room.name}.</p>
            <p className="mt-1 text-xs">
              It is taken from {formatTime(clash.start)} to {formatTime(clash.end)}.{' '}
              {freeSlot ? `The nearest free stretch long enough is ${freeSlot.start} to ${freeSlot.end}.` : 'No stretch that long is free that day.'}
            </p>
            {timeline}
            <div className="mt-3 flex flex-wrap gap-2">
              {freeSlot && <button type="button" onClick={() => setForm({ ...form, ...freeSlot })} className={buttonClass('secondary', 'small')}>Use {freeSlot.start} to {freeSlot.end}</button>}
              <button type="button" onClick={() => document.getElementById('roomId').focus()} className={buttonClass('quiet', 'small')}>Pick another room</button>
            </div>
          </div>
        )}
        {draft && problems.length === 0 && (
          <div className="rounded-lg border-l-4 border-brand-700 bg-brand-50 p-4 text-brand-900">
            <p className="text-sm font-semibold">{form.start} to {form.end} is free on {room.name}.</p>
            {timeline}
          </div>
        )}
        {sameDay && (
          <div className="rounded-lg border-l-4 border-accent-500 bg-accent-50 p-4 text-accent-900">
            <p className="text-sm font-semibold">You already have a room {whenPhrase(sameDay.start)}.</p>
            <p className="mt-1 text-xs">
              {rooms.find((r) => r.id === sameDay.roomId).name}, {formatTime(sameDay.start)} to {formatTime(sameDay.end)}. Cancel that one first if you want a different slot.
            </p>
            <Link to="/my-bookings" className="mt-3 inline-block text-xs font-semibold underline underline-offset-4">Go to my bookings</Link>
          </div>
        )}
      </div>

      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Field label="What for" name="purpose" error={errorFor('purpose')}><input type="text" {...fieldProps('purpose')} /></Field>
        <Field label="How many of you" name="attendees" error={errorFor('attendees')}><input type="number" min="1" {...fieldProps('attendees')} /></Field>
      </div>

      {saveError && <p role="alert" className="text-sm font-medium text-red-700">{saveError}</p>}
      {/* aria-disabled, not disabled: the button stays focusable, and pressing it shows every error. */}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button type="submit" aria-disabled={blocked} className={`${buttonClass('primary')} ${blocked ? 'opacity-50' : ''}`}>{submitLabel}</button>
        <Link to="/my-bookings" className={buttonClass('quiet')}>Cancel</Link>
        <span className="flex-1" />
        {blocked && <span className={`text-xs font-medium ${clash || submitted ? 'text-red-700' : 'text-muted'}`}>{blockedReason()}</span>}
      </div>

      <ConfirmDialog open={leaving.state === 'blocked'} title="Leave without saving?" message="The changes you made to this booking will be lost."
        confirmLabel="Leave" cancelLabel="Stay" onConfirm={() => leaving.proceed()} onCancel={() => leaving.reset()} />
    </form>
  );
}

// A time as a list of half hours. A time that is not on the half hour (an older booking) is kept as an option.
function TimeSelect({ times, value, ...props }) {
  const options = value && !times.includes(value) ? [value, ...times].sort() : times;
  return (
    <select value={value} {...props}>
      <option value="">Choose a time</option>
      {options.map((time) => <option key={time} value={time}>{time}</option>)}
    </select>
  );
}
