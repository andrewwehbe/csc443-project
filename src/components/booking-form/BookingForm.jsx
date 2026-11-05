import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { checkHouseRules } from '../../lib/bookingRules.js';
import { FIELDS, PURPOSE_MAX, formChanged, formToDraft, validateForm } from '../../lib/bookingForm.js';
import { dateKey, formatDuration, minutesBetween } from '../../lib/time.js';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning.js';
import Field from './Field.jsx';
import HouseRulesCheck from './HouseRulesCheck.jsx';
import RoomDaySchedule from './RoomDaySchedule.jsx';
import UnsavedChangesDialog from './UnsavedChangesDialog.jsx';

const inputClass =
  'w-full rounded-lg border bg-white px-3 py-2 text-base text-slate-900 sm:text-sm focus:outline-2 focus:outline-offset-1 focus:outline-brand-600';

// The form behind New booking and Edit booking. It keeps what the user typed in state and re-checks
// everything on every keystroke: the fields (validateForm) and the three house rules (checkHouseRules).
// Saving goes through onSave, which is useBookings' addBooking or updateBooking: they check again.
//   initialForm      the starting values (from the address bar for a new booking, the saved booking when editing)
//   bookingId        the booking being edited, or null for a new one (so a booking never clashes with itself)
//   ownerId          whose booking it is: the house rules look at that student's other bookings
//   onSave(draft)    returns { ok: true, booking } or { ok: false, problems }
//   onSaved(booking) runs after a successful save
export default function BookingForm({ rooms, bookings, initialForm, bookingId, ownerId, submitLabel, onSave, onSaved }) {
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});          // fields the user has changed: their errors show from then on
  const [submitted, setSubmitted] = useState(false);   // after a submit attempt, every error shows
  const [saveProblems, setSaveProblems] = useState([]); // anything useBookings refused when saving
  const rulesHeadingRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Everything below is worked out again on every render, so it always matches what is typed.
  const errors = validateForm(form, rooms);
  const room = rooms.find((r) => r.id === form.roomId) ?? null;
  const timesValid = !errors.roomId && !errors.date && !errors.start && !errors.end;
  const draft = timesValid ? { ...formToDraft(form), id: bookingId, userId: ownerId } : null;
  const problems = draft ? checkHouseRules(draft, bookings) : [];
  const hasChanges = formChanged(form, initialForm);
  const blocker = useUnsavedChangesWarning(hasChanges);

  const hints = {
    end: draft ? `Length: ${formatDuration(minutesBetween(draft.start, draft.end))}` : '',
    attendees: room ? `Count yourself too. ${room.name} seats ${room.capacity}.` : 'Count yourself too.',
    purpose: `${form.purpose.trim().length} of ${PURPOSE_MAX} characters`,
  };

  // An error shows once its field has been changed, or after a submit attempt.
  function errorFor(name) {
    return touched[name] || submitted ? errors[name] : undefined;
  }

  // The props every input shares: value and onChange, plus the ids that tie it to its hint and error.
  function fieldProps(name) {
    const id = `booking-${name}`;
    const error = errorFor(name);
    const describedBy = [hints[name] && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
    return {
      id,
      name,
      value: form[name],
      onChange: handleChange,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedBy || undefined,
      className: `${inputClass} ${error ? 'border-red-600' : 'border-slate-300'}`,
    };
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setTouched((current) => ({ ...current, [name]: true }));
    setSaveProblems([]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);

    // A field is wrong: put the cursor in the first one, where its message is.
    const firstError = FIELDS.find((name) => errors[name]);
    if (firstError) {
      document.getElementById(`booking-${firstError}`).focus();
      return;
    }
    // A house rule is broken: the panel already says which one; move the focus there.
    if (problems.length > 0) {
      rulesHeadingRef.current.focus();
      return;
    }

    const result = onSave(formToDraft(form));
    if (!result.ok) {
      setSaveProblems(result.problems);
      return;
    }
    onSaved(result.booking);
  }

  // Back to the previous page, or home when the form was opened straight from a link.
  function goBack() {
    if (location.key === 'default') navigate('/');
    else navigate(-1);
  }

  const buildings = [...new Set(rooms.map((r) => r.building))];

  return (
    <>
      <form noValidate onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5 lg:col-start-1">
          <Field id="booking-roomId" label="Room" error={errorFor('roomId')}>
            <select {...fieldProps('roomId')}>
              <option value="">Choose a room</option>
              {buildings.map((building) => (
                <optgroup key={building} label={building}>
                  {rooms
                    .filter((r) => r.building === building)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (floor {r.floor}, seats {r.capacity})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field id="booking-date" label="Date" error={errorFor('date')}>
              <input type="date" min={dateKey(new Date())} {...fieldProps('date')} />
            </Field>
            <Field id="booking-start" label="Start" error={errorFor('start')}>
              <input type="time" {...fieldProps('start')} />
            </Field>
            <Field id="booking-end" label="End" hint={hints.end} error={errorFor('end')}>
              <input type="time" {...fieldProps('end')} />
            </Field>
          </div>

          <Field id="booking-attendees" label="People coming" hint={hints.attendees} error={errorFor('attendees')} className="sm:max-w-sm">
            <input type="number" inputMode="numeric" min="1" max={room ? room.capacity : undefined} {...fieldProps('attendees')} />
          </Field>

          <Field id="booking-purpose" label="What is it for?" hint={hints.purpose} error={errorFor('purpose')}>
            <input type="text" autoComplete="off" placeholder="CSC443 project meeting" {...fieldProps('purpose')} />
          </Field>
        </div>

        <aside className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <HouseRulesCheck draft={draft} problems={problems} headingRef={rulesHeadingRef} />
          <RoomDaySchedule room={room} date={errors.date ? '' : form.date} bookings={bookings} draft={draft} bookingId={bookingId} />
        </aside>

        <div className="space-y-4 lg:col-start-1">
          {saveProblems.length > 0 && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {saveProblems.map((p) => (
                <p key={p.rule}>{p.message}</p>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              {submitLabel}
            </button>
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              Go back
            </button>
          </div>
        </div>
      </form>

      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}
