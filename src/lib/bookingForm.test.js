// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingToForm, emptyForm, formToDraft, nearestFreeSlot, validateForm } from './bookingForm.js';
import { rooms } from '../data/rooms.js';
import { atTime } from './time.js';

// A fixed "now" (Monday 9 November 2026, 08:00) so the tests do not depend on the clock.
const now = new Date(2026, 10, 9, 8, 0);
const goodForm = { roomId: 'r1', date: '2026-11-10', start: '10:00', end: '11:30', attendees: '3', purpose: 'Calculus' };
const errorsFor = (changes) => validateForm({ ...goodForm, ...changes }, rooms, now);

test('a complete form has no errors, an empty one has an error on every field', () => {
  assert.deepEqual(errorsFor({}), {});
  const empty = errorsFor({ roomId: '', date: '', start: '', end: '', attendees: '', purpose: ' ' });
  assert.deepEqual(Object.keys(empty), ['roomId', 'date', 'start', 'end', 'attendees', 'purpose']);
});

test('a time that has passed, or an end before the start, is refused', () => {
  assert.ok(errorsFor({ date: '2026-11-09', start: '07:30' }).start);
  assert.ok(errorsFor({ start: '11:00', end: '11:00' }).end);
});

test('attendees must be a whole number within the room capacity', () => {
  assert.ok(errorsFor({ attendees: '0' }).attendees);
  assert.ok(errorsFor({ attendees: '2.5' }).attendees);
  assert.match(errorsFor({ attendees: '5' }).attendees, /seats 4/);   // Study Room 104 seats 4
});

test('the address can fill in a new booking', () => {
  const form = emptyForm(new URLSearchParams('room=r3&date=2026-11-12&start=14:00'));
  assert.equal(form.roomId, 'r3');
  assert.equal(form.start, '14:00');
  assert.equal(form.end, '');
});

test('a booking survives the trip into the form and back', () => {
  const booking = { roomId: 'r6', start: atTime(1, '09:30', now), end: atTime(1, '11:00', now), attendees: 6, purpose: 'Review' };
  assert.deepEqual(formToDraft(bookingToForm(booking)), booking);
});

test('a clash suggests the nearest free stretch of the same length', () => {
  const taken = { id: 'b1', roomId: 'r1', userId: 'u2', start: atTime(1, '10:00', now), end: atTime(1, '12:00', now), status: 'confirmed' };
  const draft = { roomId: 'r1', userId: 'u1', start: atTime(1, '11:00', now), end: atTime(1, '13:00', now) };
  assert.deepEqual(nearestFreeSlot(draft, [taken], now), { start: '12:00', end: '14:00' });   // the pack's example
  const allDay = { ...taken, start: atTime(1, '08:00', now), end: atTime(1, '22:00', now) };
  assert.equal(nearestFreeSlot(draft, [allDay], now), null);
});
