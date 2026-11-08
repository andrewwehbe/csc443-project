import { useState } from 'react';
import { Link } from 'react-router';
import { checkHouseRules } from '../lib/bookingRules.js';
import { formToDraft, nearestFreeSlot, validateForm } from '../lib/bookingForm.js';
import { whenPhrase } from '../lib/roomDetail.js';
import { formatDate, formatTime } from '../lib/time.js';
import { buttonClass } from '../lib/buttons.js';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning.js';
import DayTimeline from './DayTimeline.jsx';
import Field from './Field.jsx';

const inputClass =
  'w-full rounded border border-ink/20 bg-surface px-3 py-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100 aria-invalid:border-red-500 aria-invalid:focus:ring-red-100';

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
  useUnsavedChangesWarning(JSON.stringify(form) !== JSON.stringify(initialForm));

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
            {rooms.map((r) => (
              <option key={r.id} value={r.id} disabled={r.status === 'out-of-service'}>
                {r.name} · {r.status === 'out-of-service' ? 'out of service' : `seats ${r.capacity}`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" name="date" error={errorFor('date')}><input type="date" {...fieldProps('date')} /></Field>
        <Field label="From" name="start" error={errorFor('start')}><input type="time" {...fieldProps('start')} /></Field>
        <Field label="To" name="end" error={errorFor('end')} hint="Two hours maximum."><input type="time" {...fieldProps('end')} /></Field>
      </div>

      {/* The house rules, checked while the time is chosen. Each refusal has its own panel and words. */}
      <div aria-live="polite" className="space-y-4">
        {clash && (
          <div className="border-l-4 border-red-600 bg-red-50 p-4 text-red-900">
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
          <div className="border-l-4 border-brand-700 bg-brand-50 p-4 text-brand-900">
            <p className="text-sm font-semibold">{form.start} to {form.end} is free on {room.name}.</p>
            {timeline}
          </div>
        )}
        {sameDay && (
          <div className="border-l-4 border-accent-500 bg-accent-50 p-4 text-accent-900">
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
        {blocked && (clash || submitted) && <span className="text-xs font-medium text-red-700">{clash ? 'Resolve the clash to continue' : 'Fix what is marked to continue'}</span>}
      </div>
    </form>
  );
}
