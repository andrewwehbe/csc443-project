import { useState } from 'react';
import { checkHouseRules } from '../lib/bookingRules.js';
import { formToDraft, validateForm } from '../lib/bookingForm.js';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning.js';
import Field from './Field.jsx';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-base sm:text-sm aria-invalid:border-red-600';

// The form behind New booking and Edit booking. Every keystroke updates `form`, React re-renders,
// and the fields and the house rules are checked again, so mistakes and conflicts show before submit.
// onSave is addBooking or updateBooking from useBookings; onSaved runs after a successful save.
export default function BookingForm({ rooms, bookings, initialForm, bookingId, ownerId, submitLabel, onSave, onSaved }) {
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});          // fields the user has changed
  const [submitted, setSubmitted] = useState(false);   // after a submit attempt, every error shows
  const [saveError, setSaveError] = useState('');

  const errors = validateForm(form, rooms);
  const timesOk = !errors.roomId && !errors.date && !errors.start && !errors.end;
  const draft = timesOk ? { ...formToDraft(form), id: bookingId, userId: ownerId } : null;
  const problems = draft ? checkHouseRules(draft, bookings) : [];
  useUnsavedChangesWarning(JSON.stringify(form) !== JSON.stringify(initialForm));

  // An error shows once its field has been changed, or after a submit attempt.
  const errorFor = (name) => (touched[name] || submitted ? errors[name] : undefined);

  // What every input needs: its value, onChange, and the link to its error message.
  const fieldProps = (name) => ({
    id: name,
    name,
    value: form[name],
    onChange: handleChange,
    'aria-invalid': Boolean(errorFor(name)),
    'aria-describedby': `${name}-error`,
    className: inputClass,
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
    if (firstError) {
      document.getElementById(firstError).focus();
      return;
    }
    if (problems.length > 0) return;   // the House rules box already says which rule and why
    const result = onSave(formToDraft(form));
    if (result.ok) onSaved(result.booking);
    else setSaveError(result.problems[0].message);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <Field label="Room" name="roomId" error={errorFor('roomId')}>
        <select {...fieldProps('roomId')}>
          <option value="">Choose a room</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name} ({r.building}, seats {r.capacity})</option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Date" name="date" error={errorFor('date')}>
          <input type="date" {...fieldProps('date')} />
        </Field>
        <Field label="Start" name="start" error={errorFor('start')}>
          <input type="time" {...fieldProps('start')} />
        </Field>
        <Field label="End" name="end" error={errorFor('end')}>
          <input type="time" {...fieldProps('end')} />
        </Field>
      </div>

      <Field label="People coming (you included)" name="attendees" error={errorFor('attendees')}>
        <input type="number" min="1" {...fieldProps('attendees')} />
      </Field>

      <Field label="What is it for?" name="purpose" error={errorFor('purpose')}>
        <input type="text" {...fieldProps('purpose')} />
      </Field>

      <section aria-live="polite" className="rounded-xl border border-slate-200 p-4 text-sm">
        <h2 className="font-semibold">House rules</h2>
        {draft === null && <p className="mt-1 text-slate-600">Checked once the room, date and times are filled in.</p>}
        {draft && problems.length === 0 && (
          <p className="mt-1 text-brand-700">All 3 rules pass: no overlap, 2 hours at most, one upcoming booking per day.</p>
        )}
        {problems.map((p) => (
          <p key={p.rule} className="mt-1 text-red-700">{p.message}</p>
        ))}
      </section>

      {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
      <button type="submit" className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-800">
        {submitLabel}
      </button>
    </form>
  );
}
