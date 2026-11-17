// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headline, isFreeNow, openingState, roomsToShow, todayWindow } from './today.js';
import { toISO } from './time.js';

// A fixed "now" (Monday 16 November 2026, 14:30) so the tests do not depend on the clock.
const day = '2026-11-16';
const at = (hhmm) => new Date(`${day}T${hhmm}`);
const now = at('14:30');
const me = { id: 'u1' };
const room = (id, status = 'open') => ({ id, name: id, status });
const booking = (id, roomId, start, end, userId = 'u2', status = 'confirmed') => ({
  id, roomId, userId, start: toISO(day, start), end: toISO(day, end), status,
});
const shown = (rooms, bookings, span = 'soon', user = me, when = now) =>
  roomsToShow(rooms, bookings, span, user, when).map((r) => r.id);

test('the library is open from 08:00 until 22:00', () => {
  assert.equal(openingState(at('07:59')), 'before');
  assert.equal(openingState(at('08:00')), 'open');
  assert.equal(openingState(at('21:59')), 'open');
  assert.equal(openingState(at('22:00')), 'after');
});

test('a room is free now unless a confirmed booking is running', () => {
  assert.equal(isFreeNow(room('r1'), [], now), true);
  assert.equal(isFreeNow(room('r1'), [booking('a', 'r1', '14:00', '15:00')], now), false);
  assert.equal(isFreeNow(room('r1'), [booking('a', 'r1', '14:00', '15:00', 'u2', 'cancelled')], now), true);
  assert.equal(isFreeNow(room('r1'), [booking('a', 'r2', '14:00', '15:00')], now), true);
});

test('a booking that ends this minute no longer holds the room', () => {
  assert.equal(isFreeNow(room('r1'), [booking('a', 'r1', '13:00', '14:30')], now), true);
});

test('no room is free when it is out of service or the library is closed', () => {
  assert.equal(isFreeNow(room('r1', 'out-of-service'), [], now), false);
  assert.equal(isFreeNow(room('r1'), [], at('07:00')), false);
  assert.equal(isFreeNow(room('r1'), [], at('22:30')), false);
});

test('the window runs two hours from now, or to closing for the whole day', () => {
  assert.deepEqual(todayWindow('soon', now), { from: 870, to: 990 });
  assert.deepEqual(todayWindow('day', now), { from: 870, to: 1320 });
});

test('the window starts at 08:00 and stops at 22:00', () => {
  assert.deepEqual(todayWindow('soon', at('07:00')), { from: 480, to: 540 });
  assert.deepEqual(todayWindow('soon', at('21:00')), { from: 1260, to: 1320 });
  assert.equal(todayWindow('soon', at('05:00')), null);
  assert.equal(todayWindow('day', at('22:00')), null);
});

test('a room shows when its bookings leave part of the next two hours free (pack: B-206)', () => {
  // Booked until 15:00, free afterwards.
  assert.deepEqual(shown([room('r1')], [booking('a', 'r1', '13:00', '15:00')]), ['r1']);
});

test('a room booked for the whole two hours is left out, even by bookings that touch', () => {
  const back2back = [booking('a', 'r1', '14:00', '15:30'), booking('b', 'r1', '15:30', '17:00')];
  assert.deepEqual(shown([room('r1')], back2back), []);
});

test('the whole day shows a room that is only free later on', () => {
  const busy = [booking('a', 'r1', '14:00', '16:30')];
  assert.deepEqual(shown([room('r1')], busy, 'soon'), []);
  assert.deepEqual(shown([room('r1')], busy, 'day'), ['r1']);
});

test('your own booking keeps the room on your list, not on anyone else\'s (pack: B-204)', () => {
  const mine = [booking('a', 'r1', '14:00', '17:00', 'u1')];
  assert.deepEqual(shown([room('r1')], mine, 'soon', me), ['r1']);
  assert.deepEqual(shown([room('r1')], mine, 'soon', { id: 'u3' }), []);
  assert.deepEqual(shown([room('r1')], mine, 'soon', null), []);
});

test('cancelled bookings, other days and rooms out of service', () => {
  assert.deepEqual(shown([room('r1')], [booking('a', 'r1', '14:00', '17:00', 'u2', 'cancelled')]), ['r1']);
  const tomorrow = { ...booking('a', 'r1', '14:00', '17:00'), start: toISO('2026-11-17', '14:00'), end: toISO('2026-11-17', '17:00') };
  assert.deepEqual(shown([room('r1')], [tomorrow]), ['r1']);
  assert.deepEqual(shown([room('r1', 'out-of-service')], []), []);
});

test('nothing shows once the library has closed', () => {
  assert.deepEqual(shown([room('r1')], [], 'day', me, at('22:15')), []);
});

test('the headline counts the free rooms in words', () => {
  assert.deepEqual(headline(3, now), ['Three rooms are free', 'right now.']);
  assert.deepEqual(headline(1, now), ['One room is free', 'right now.']);
  assert.deepEqual(headline(0, now), ['No room is free', 'right now.']);
  assert.deepEqual(headline(14, now), ['14 rooms are free', 'right now.']);
});

test('outside opening hours the headline says the library is closed', () => {
  assert.deepEqual(headline(0, at('07:15')), ['The library opens', 'at 08:00.']);
  assert.deepEqual(headline(0, at('22:15')), ['The library has closed', 'for today.']);
});
