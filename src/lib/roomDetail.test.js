// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayLabel, floorName, nextOwnBooking, parseWeek, weekDays, weekTitle, whenPhrase } from './roomDetail.js';
import { toISO } from './time.js';

// A fixed "now" (Wednesday 11 November 2026, 13:30) so the tests do not depend on the clock.
const now = new Date(2026, 10, 11, 13, 30);
const me = { id: 'u1' };
const booking = (id, userId, day, start, end, status = 'confirmed', roomId = 'r1') => ({
  id, roomId, userId, start: toISO(day, start), end: toISO(day, end), status,
});

test('the week in the address is a whole number, anything else is this week', () => {
  assert.equal(parseWeek('1'), 1);
  assert.equal(parseWeek('-2'), -2);
  assert.equal(parseWeek(null), 0);
  assert.equal(parseWeek('soon'), 0);
  assert.equal(parseWeek('1.5'), 0);
});

test('a week runs Monday to Sunday around today', () => {
  assert.deepEqual(weekDays(0, now), [
    '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
  ]);
  assert.equal(weekDays(1, now)[0], '2026-11-16');
  assert.equal(weekDays(-1, now)[6], '2026-11-08');
});

test('on a Sunday the week still starts the Monday before', () => {
  assert.equal(weekDays(0, new Date(2026, 10, 15, 9, 0))[0], '2026-11-09');
});

test('weeks and days read like the pack', () => {
  assert.equal(weekTitle(0, weekDays(0, now)), 'This week');
  assert.equal(weekTitle(1, weekDays(1, now)), 'Next week');
  assert.equal(weekTitle(2, weekDays(2, now)), 'Week of Mon 23 Nov');
  assert.equal(dayLabel('2026-11-09'), 'Mon 9');
  assert.equal(floorName(2), 'second floor');
});

test('your next booking of this room skips ended, cancelled, other rooms and other people', () => {
  const all = [
    booking('ended', 'u1', '2026-11-11', '09:00', '10:00'),
    booking('cancelled', 'u1', '2026-11-11', '15:00', '16:00', 'cancelled'),
    booking('other-room', 'u1', '2026-11-11', '17:00', '18:00', 'confirmed', 'r2'),
    booking('someone-else', 'u2', '2026-11-11', '14:00', '15:00'),
    booking('later', 'u1', '2026-11-13', '10:00', '11:00'),
    booking('next', 'u1', '2026-11-12', '14:00', '16:00'),
  ];
  assert.equal(nextOwnBooking('r1', all, me, now).id, 'next');
});

test('a booking running now still counts, and signed out has none', () => {
  const running = [booking('now', 'u1', '2026-11-11', '13:00', '15:00')];
  assert.equal(nextOwnBooking('r1', running, me, now).id, 'now');
  assert.equal(nextOwnBooking('r1', running, null, now), null);
  assert.equal(nextOwnBooking('r1', running, { id: 'u2' }, now), null);
});

test('the day of a booking reads today, tomorrow or its date', () => {
  assert.equal(whenPhrase(toISO('2026-11-11', '14:00'), now), 'today');
  assert.equal(whenPhrase(toISO('2026-11-12', '14:00'), now), 'tomorrow');
  assert.equal(whenPhrase(toISO('2026-11-13', '14:00'), now), 'on Fri 13 Nov');
});
