// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { busiest, busyHours } from './busyHours.js';
import { toISO } from './time.js';

// 2026-11-16 is a Monday, 2026-11-18 a Wednesday.
const booking = (date, start, end, status = 'confirmed') => ({ start: toISO(date, start), end: toISO(date, end), status });

test('a booking fills every hour it touches, on its weekday', () => {
  const counts = busyHours([booking('2026-11-16', '10:30', '12:00')]);
  assert.equal(counts[0][2], 1);   // Monday 10:00
  assert.equal(counts[0][3], 1);   // Monday 11:00
  assert.equal(counts[0][4], 0);   // Monday 12:00: it ended at 12:00
  assert.equal(counts[2][2], 0);   // Wednesday
});

test('bookings add up, and cancelled ones do not count', () => {
  const counts = busyHours([
    booking('2026-11-18', '14:00', '15:00'),
    booking('2026-11-18', '14:00', '16:00'),
    booking('2026-11-18', '14:00', '15:00', 'cancelled'),
  ]);
  assert.equal(counts[2][6], 2);
  assert.equal(counts[2][7], 1);
});

test('the busiest cell is the one with the most bookings', () => {
  const counts = busyHours([booking('2026-11-18', '14:00', '15:00'), booking('2026-11-18', '14:00', '16:00')]);
  assert.deepEqual(busiest(counts), { day: 2, hour: 6, count: 2 });
  assert.equal(busiest(busyHours([])), null);
});
