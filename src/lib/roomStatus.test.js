// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roomStatus, statusChipClass } from './roomStatus.js';
import { toISO } from './time.js';

// A fixed "now" (Monday 9 November 2026, 13:30) so the tests do not depend on the clock.
const now = new Date(2026, 10, 9, 13, 30);
const today = '2026-11-09';
const tomorrow = '2026-11-10';
const room = { id: 'r1', name: 'B-204' };
const me = { id: 'u1' };
const booking = (id, day, start, end, userId = 'u2', status = 'confirmed') => ({
  id, roomId: 'r1', userId, start: toISO(day, start), end: toISO(day, end), status,
});
const word = (bookings, day = today, user = me, r = room) => roomStatus(r, bookings, day, user, now)?.word;

test('a room with nothing booked is free all day', () => {
  assert.equal(word([]), 'Free all day');
});

test('a room busy now is free from the end of that booking (pack: B-206)', () => {
  assert.equal(word([booking('a', today, '09:00', '11:00'), booking('b', today, '13:00', '15:00')]), 'Free from 15:00');
});

test('bookings that are over do not count', () => {
  assert.equal(word([booking('a', today, '09:00', '11:00')]), 'Free all day');
});

test('cancelled bookings and other rooms do not count', () => {
  const other = { ...booking('b', today, '14:00', '16:00'), roomId: 'r2' };
  assert.equal(word([booking('a', today, '14:00', '16:00', 'u2', 'cancelled'), other]), 'Free all day');
});

test('your own booking running now reads "Yours until" (pack: B-204)', () => {
  assert.deepEqual(roomStatus(room, [booking('a', today, '13:00', '15:00', 'u1')], today, me, now), {
    word: 'Yours until 15:00',
    tone: 'yours',
  });
});

test('who is looking changes the word: another user or nobody sees it as busy', () => {
  const mine = [booking('a', today, '13:00', '15:00', 'u1')];
  assert.equal(word(mine, today, { id: 'u3' }), 'Free from 15:00');
  assert.equal(word(mine, today, null), 'Free from 15:00');
});

test('a mostly booked day counts its gaps (pack: C-101)', () => {
  const day = [booking('a', tomorrow, '08:00', '12:00'), booking('b', tomorrow, '13:00', '17:00'), booking('c', tomorrow, '19:00', '22:00')];
  assert.deepEqual(roomStatus(room, day, tomorrow, me, now), { word: 'Two gaps', tone: 'busy' });
});

test('free now but booked to closing reads "Free until"', () => {
  assert.equal(word([booking('a', today, '17:00', '22:00')]), 'Free until 17:00');
});

test('no gap left is fully booked', () => {
  assert.equal(word([booking('a', today, '13:00', '22:00')]), 'Fully booked');
});

test('a later day is judged from 08:00', () => {
  assert.equal(word([booking('a', tomorrow, '08:00', '10:00')], tomorrow), 'Free from 10:00');
});

test('an out-of-service room says so, whatever is booked', () => {
  assert.deepEqual(roomStatus({ ...room, status: 'out-of-service' }, [], today, me, now), { word: 'Out of service', tone: 'off' });
});

test('a day that is over has no status', () => {
  assert.equal(roomStatus(room, [], '2026-11-08', me, now), null);
  assert.equal(roomStatus(room, [], today, me, new Date(2026, 10, 9, 22, 30)), null);
});

test('each tone gets the pack chip classes', () => {
  assert.match(statusChipClass('free'), /border-brand-300 text-brand-800/);
  assert.match(statusChipClass('yours'), /bg-brand-800 text-paper/);
  assert.match(statusChipClass('off'), /^inline-flex items-center border px-2 py-0\.5 font-mono/);
});
