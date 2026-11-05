// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkHouseRules, effectiveStatus, overlaps } from './bookingRules.js';
import { atTime } from './time.js';
import { makeSeedBookings } from '../data/bookings.js';
import { rooms, findRoom } from '../data/rooms.js';
import { findUser } from '../data/users.js';

// A fixed "now" (Monday 9 November 2026, 08:00) so the tests do not depend on the clock.
const now = new Date(2026, 10, 9, 8, 0);
const at = (day, hhmm) => atTime(day, hhmm, now);
const booking = (id, roomId, userId, day, start, end, status = 'confirmed') => ({
  id, roomId, userId, start: at(day, start), end: at(day, end), status,
});
const rulesBroken = (draft, all) => checkHouseRules(draft, all, now).map((p) => p.rule);

const existing = [
  booking('a', 'r1', 'u1', 1, '10:00', '11:00'),
  booking('b', 'r1', 'u2', 1, '13:00', '14:00', 'cancelled'),
];

test('back-to-back bookings do not overlap', () => {
  assert.equal(overlaps(existing[0], booking('x', 'r1', 'u2', 1, '11:00', '12:00')), false);
  assert.equal(overlaps(existing[0], booking('x', 'r1', 'u2', 1, '09:00', '10:00')), false);
});

test('one minute of overlap is an overlap', () => {
  assert.equal(overlaps(existing[0], booking('x', 'r1', 'u2', 1, '10:59', '12:00')), true);
  assert.equal(overlaps(existing[0], booking('x', 'r1', 'u2', 1, '09:00', '10:01')), true);
});

test('a booking inside another one overlaps', () => {
  assert.equal(overlaps(existing[0], booking('x', 'r1', 'u2', 1, '10:15', '10:45')), true);
});

test('overlap on the same room is refused, on another room it is allowed', () => {
  assert.deepEqual(rulesBroken(booking('x', 'r1', 'u2', 1, '10:30', '11:30'), existing), ['overlap']);
  assert.deepEqual(rulesBroken(booking('x', 'r2', 'u2', 1, '10:30', '11:30'), existing), []);
});

test('a cancelled booking does not block the slot', () => {
  assert.deepEqual(rulesBroken(booking('x', 'r1', 'u3', 1, '13:00', '14:00'), existing), []);
});

test('exactly 2 hours is allowed, 2 hours and 1 minute is not', () => {
  assert.deepEqual(rulesBroken(booking('x', 'r2', 'u3', 2, '10:00', '12:00'), existing), []);
  assert.deepEqual(rulesBroken(booking('x', 'r2', 'u3', 2, '10:00', '12:01'), existing), ['max-length']);
});

test('a second upcoming booking on the same day is refused, even in another room', () => {
  assert.deepEqual(rulesBroken(booking('x', 'r5', 'u1', 1, '16:00', '17:00'), existing), ['one-per-day']);
  assert.deepEqual(rulesBroken(booking('x', 'r5', 'u1', 2, '16:00', '17:00'), existing), []);
});

test('editing a booking does not clash with itself', () => {
  const moved = { ...existing[0], start: at(1, '10:30'), end: at(1, '11:30') };
  assert.deepEqual(rulesBroken(moved, existing), []);
});

test('every broken rule is reported, each with a message', () => {
  const draft = booking('x', 'r1', 'u1', 1, '09:00', '11:30');
  const problems = checkHouseRules(draft, existing, now);
  assert.deepEqual(problems.map((p) => p.rule), ['overlap', 'max-length', 'one-per-day']);
  for (const p of problems) assert.ok(p.message.length > 20);
});

test('a confirmed booking that has ended counts as completed', () => {
  assert.equal(effectiveStatus(booking('x', 'r1', 'u1', -1, '10:00', '11:00'), now), 'completed');
  assert.equal(effectiveStatus(existing[0], now), 'confirmed');
  assert.equal(effectiveStatus(existing[1], now), 'cancelled');
});

test('the seed data has at least 40 bookings and obeys every house rule', () => {
  const seed = makeSeedBookings(now);
  assert.ok(seed.length >= 40, `only ${seed.length} bookings`);
  assert.equal(new Set(seed.map((b) => b.id)).size, seed.length, 'duplicate booking ids');

  for (const b of seed) {
    const room = findRoom(b.roomId);
    assert.ok(room, `${b.id}: unknown room ${b.roomId}`);
    assert.ok(findUser(b.userId), `${b.id}: unknown user ${b.userId}`);
    assert.ok(b.attendees >= 1 && b.attendees <= room.capacity, `${b.id}: ${b.attendees} people in a room for ${room.capacity}`);
    if (b.status === 'confirmed') {
      assert.deepEqual(checkHouseRules(b, seed, now), [], `${b.id} breaks a house rule`);
    }
  }
  assert.equal(rooms.length, new Set(rooms.map((r) => r.id)).size, 'duplicate room ids');
});
