// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daySegments, hourRows, overlayPosition, rangeLabel, rangeTitle } from './timeline.js';
import { toISO } from './time.js';

// A fixed day so the tests do not depend on the clock.
const day = '2026-11-09';
const block = (id, start, end, kind = 'booked') => ({ id, start: toISO(day, start), end: toISO(day, end), kind });
const widths = (parts) => parts.map((p) => `${p.type}:${p.width.toFixed(4)}`);

test('an empty day is one gap the width of the whole bar', () => {
  assert.deepEqual(widths(daySegments([])), ['gap:100.0000']);
});

test('segment widths match the design pack (two hours = 14.2857%)', () => {
  const parts = daySegments([block('a', '16:00', '18:00'), block('b', '10:00', '12:00')]);
  assert.deepEqual(widths(parts), [
    'gap:14.2857', 'segment:14.2857', 'gap:28.5714', 'segment:14.2857', 'gap:28.5714',
  ]);
  assert.equal(parts[1].id, 'b', 'blocks are drawn in time order, whatever order they come in');
});

test('back-to-back blocks have no gap between them, and a full day adds up to 100%', () => {
  const parts = daySegments([block('a', '08:00', '12:00'), block('b', '12:00', '22:00')]);
  assert.deepEqual(parts.map((p) => p.type), ['segment', 'segment']);
  assert.equal(Math.round(parts.reduce((sum, p) => sum + p.width, 0)), 100);
});

test('anything outside 08:00-22:00 is cut off', () => {
  const parts = daySegments([block('early', '07:00', '09:00'), block('night', '21:00', '23:00'), block('gone', '06:00', '07:30')]);
  assert.deepEqual(parts.filter((p) => p.type === 'segment').map((p) => [p.id, p.from, p.to]), [
    ['early', 480, 540],
    ['night', 1260, 1320],
  ]);
});

test('the kind of each block is kept so "yours" can be drawn differently', () => {
  const parts = daySegments([block('a', '14:00', '16:00', 'yours')]);
  assert.equal(parts[1].kind, 'yours');
});

test('labels and titles read like the pack', () => {
  assert.equal(rangeLabel(600, 720), '10–12');
  assert.equal(rangeLabel(630, 690), '10:30–11:30');
  assert.equal(rangeTitle(600, 720), '10:00–12:00');
});

test('an overlay sits at the same place as the times it covers', () => {
  const clash = overlayPosition(toISO(day, '11:00'), toISO(day, '13:00'));
  assert.equal(clash.left.toFixed(4), '21.4286');
  assert.equal(clash.width.toFixed(4), '14.2857');
  assert.equal(overlayPosition(toISO(day, '06:00'), toISO(day, '07:00')), null);
});

test('the phone list has one row per hour from 08:00 to 21:00', () => {
  const rows = hourRows([block('a', '10:00', '12:00'), block('b', '14:00', '16:00', 'yours')]);
  assert.equal(rows.length, 14);
  assert.deepEqual(rows[0], { hour: '08:00', kind: 'free' });
  assert.deepEqual(rows[2], { hour: '10:00', kind: 'booked' });
  assert.deepEqual(rows[4], { hour: '12:00', kind: 'free' });
  assert.deepEqual(rows[6], { hour: '14:00', kind: 'yours', until: '16:00' });
});

test('a half hour still marks the hour it touches', () => {
  const rows = hourRows([block('a', '10:30', '11:15')]);
  assert.deepEqual(rows.slice(2, 5).map((r) => r.kind), ['booked', 'booked', 'free']);
});

test('the time being chosen shows in the phone list, as a clash when it clashes', () => {
  const chosen = { start: toISO(day, '12:00'), end: toISO(day, '13:00') };
  assert.equal(hourRows([], chosen)[4].kind, 'chosen');
  assert.equal(hourRows([], { ...chosen, clash: true })[4].kind, 'clash');
});
