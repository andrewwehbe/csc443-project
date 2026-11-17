// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clock, freeStretchAt, quickRange } from './quickBook.js';
import { toISO } from './time.js';

const day = '2026-11-16';
const block = (start, end) => ({ start: toISO(day, start), end: toISO(day, end) });
const m = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const blocks = [block('10:00', '12:00'), block('15:30', '17:00')];

test('the free stretch runs from the booking before to the booking after', () => {
  assert.deepEqual(freeStretchAt(blocks, m('13:10')), { from: m('12:00'), to: m('15:30') });
  assert.deepEqual(freeStretchAt(blocks, m('09:00')), { from: m('08:00'), to: m('10:00') });
  assert.deepEqual(freeStretchAt(blocks, m('20:00')), { from: m('17:00'), to: m('22:00') });
});

test('a click inside a booking offers nothing', () => {
  assert.equal(freeStretchAt(blocks, m('11:00')), null);
  assert.equal(freeStretchAt(blocks, m('10:00')), null);
});

test('the offer starts at the half hour clicked and lasts up to two hours', () => {
  const stretch = { from: m('12:00'), to: m('15:30') };
  assert.deepEqual(quickRange(stretch, m('12:40')), { start: m('12:30'), end: m('14:30') });
  assert.deepEqual(quickRange(stretch, m('14:50')), { start: m('14:30'), end: m('15:30') });
});

test('the offer never starts before the stretch or before now', () => {
  assert.deepEqual(quickRange({ from: m('12:15'), to: m('15:30') }, m('12:20')), { start: m('12:15'), end: m('14:15') });
  assert.deepEqual(quickRange({ from: m('08:00'), to: m('22:00') }, m('09:00'), m('13:05')), { start: m('13:30'), end: m('15:30') });
});

test('less than half an hour left offers nothing', () => {
  assert.equal(quickRange({ from: m('12:00'), to: m('12:20') }, m('12:10')), null);
  assert.equal(quickRange({ from: m('08:00'), to: m('22:00') }, m('21:50'), m('21:45')), null);
});

test('minutes are written as a clock', () => {
  assert.equal(clock(870), '14:30');
  assert.equal(clock(480), '08:00');
});
