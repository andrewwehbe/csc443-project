// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingToForm, formChanged, formToDraft, newBookingForm, validateForm } from './bookingForm.js';
import { rooms } from '../data/rooms.js';
import { atTime } from './time.js';

// A fixed "now" (Monday 9 November 2026, 08:00) so the tests do not depend on the clock.
const now = new Date(2026, 10, 9, 8, 0);
const goodForm = {
  roomId: 'r1',            // Study Room 104, seats 4
  date: '2026-11-10',
  start: '10:00',
  end: '11:30',
  attendees: '3',
  purpose: 'Calculus II problem set',
};
const errorsFor = (changes) => validateForm({ ...goodForm, ...changes }, rooms, now);

test('a complete, sensible form has no errors', () => {
  assert.deepEqual(errorsFor({}), {});
});

test('every empty field says what is missing', () => {
  const errors = errorsFor({ roomId: '', date: '', start: '', end: '', attendees: '', purpose: '  ' });
  assert.deepEqual(Object.keys(errors).sort(), ['attendees', 'date', 'end', 'purpose', 'roomId', 'start']);
});

test('a day or a time that has passed is refused', () => {
  assert.ok(errorsFor({ date: '2026-11-08' }).date);
  assert.ok(errorsFor({ date: '2026-11-09', start: '07:30' }).start);
  assert.equal(errorsFor({ date: '2026-11-09', start: '09:00', end: '10:00' }).start, undefined);
});

test('the end must come after the start', () => {
  assert.ok(errorsFor({ start: '11:00', end: '11:00' }).end);
  assert.ok(errorsFor({ start: '11:00', end: '10:30' }).end);
});

test('attendees must be a whole number within the room capacity', () => {
  assert.ok(errorsFor({ attendees: '0' }).attendees);
  assert.ok(errorsFor({ attendees: '2.5' }).attendees);
  assert.match(errorsFor({ attendees: '5' }).attendees, /seats 4/);
  assert.equal(errorsFor({ attendees: '4' }).attendees, undefined);
});

test('the purpose has a length limit', () => {
  assert.ok(errorsFor({ purpose: 'x'.repeat(81) }).purpose);
  assert.equal(errorsFor({ purpose: 'x'.repeat(80) }).purpose, undefined);
});

test('the address bar can fill in a new booking', () => {
  const form = newBookingForm({ room: 'r3', date: '2026-11-12', start: '14:00', end: null }, rooms, now);
  assert.equal(form.roomId, 'r3');
  assert.equal(form.date, '2026-11-12');
  assert.equal(form.end, '15:00');   // one hour after the start when no end is given
});

test('a bad prefill is ignored, not shown', () => {
  const form = newBookingForm({ room: 'r99', date: 'tomorrow', start: '2pm', end: null }, rooms, now);
  assert.equal(form.roomId, '');
  assert.equal(form.date, '2026-11-09');   // today
  assert.equal(form.start, '');
  assert.equal(form.end, '');
});

test('a booking survives the trip into the form and back', () => {
  const booking = {
    roomId: 'r6', start: atTime(1, '09:30', now), end: atTime(1, '11:00', now), attendees: 6, purpose: 'Design review',
  };
  const form = bookingToForm(booking);
  assert.equal(form.start, '09:30');
  assert.equal(form.attendees, '6');
  assert.deepEqual(formToDraft(form), booking);
  assert.equal(formChanged(form, bookingToForm(booking)), false);
  assert.equal(formChanged({ ...form, purpose: 'Design review 2' }, bookingToForm(booking)), true);
});
