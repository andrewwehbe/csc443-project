// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { digitsOnly, filterRooms, filtersToParams, formatLongDay, parseCapacity, readFilters, shiftDay } from './availabilityFilters.js';

// A fixed "today" so the tests do not depend on the clock.
const today = new Date(2026, 10, 9, 8, 0);
const read = (query) => readFilters(new URLSearchParams(query), today);
const noFilters = { date: '2026-11-09', capacity: 0, exact: false, amenities: [] };

test('an address with no filters means today and every room', () => {
  assert.deepEqual(read(''), noFilters);
});

test('valid filters are read from the address', () => {
  assert.deepEqual(read('date=2026-11-12&capacity=6&match=exact&amenity=screen&amenity=power'), {
    date: '2026-11-12',
    capacity: 6,
    exact: true,
    amenities: ['screen', 'power'],
  });
});

test('amenities come back in a fixed order with no repeats', () => {
  assert.deepEqual(read('amenity=power&amenity=whiteboard&amenity=power').amenities, ['whiteboard', 'power']);
});

test('an invalid value falls back instead of breaking the page', () => {
  for (const query of ['date=2026-02-31', 'date=2026-13-01', 'date=tomorrow', 'capacity=0', 'capacity=-3', 'capacity=2.5', 'capacity=abc', 'match=sideways', 'amenity=sofa']) {
    assert.deepEqual(read(query), noFilters, query);
  }
  assert.deepEqual(read('amenity=sofa&amenity=screen').amenities, ['screen']);
});

test('the capacity box keeps digits only', () => {
  assert.equal(digitsOnly('12'), '12');
  assert.equal(digitsOnly('1a2b'), '12');
  assert.equal(digitsOnly('abc'), '');
  assert.equal(digitsOnly('-3'), '3');
  assert.equal(digitsOnly('1e3'), '13');
  assert.equal(digitsOnly('007'), '7');
  assert.equal(digitsOnly('0'), '');
});

test('only a positive whole number counts as a capacity', () => {
  assert.equal(parseCapacity('7'), 7);
  for (const text of ['', '0', '-3', '2.5', 'abc', null]) assert.equal(parseCapacity(text), 0, String(text));
});

test('filters survive a trip through the address', () => {
  const filters = { date: '2026-11-12', capacity: 8, exact: true, amenities: ['whiteboard', 'power'] };
  assert.deepEqual(read(filtersToParams(filters).toString()), filters);
});

test('unset filters stay out of the address', () => {
  assert.equal(filtersToParams(noFilters).toString(), 'date=2026-11-09');
});

test('capacity is a minimum unless exact, and a room needs every ticked amenity', () => {
  const rooms = [
    { id: 'a', capacity: 2, amenities: [] },
    { id: 'b', capacity: 4, amenities: ['screen'] },
    { id: 'c', capacity: 8, amenities: ['screen', 'power'] },
  ];
  const ids = (capacity, amenities, exact = false) => filterRooms(rooms, { capacity, exact, amenities }).map((room) => room.id);
  assert.deepEqual(ids(0, []), ['a', 'b', 'c']);
  assert.deepEqual(ids(4, []), ['b', 'c']);
  assert.deepEqual(ids(4, [], true), ['b']);
  assert.deepEqual(ids(3, [], true), []);
  assert.deepEqual(ids(0, [], true), ['a', 'b', 'c']);
  assert.deepEqual(ids(0, ['screen', 'power']), ['c']);
  assert.deepEqual(ids(8, ['whiteboard']), []);
});

test('days move across month and year ends', () => {
  assert.equal(shiftDay('2026-11-30', 1), '2026-12-01');
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28');
});

test('a day is written out in full', () => {
  assert.equal(formatLongDay('2026-11-04'), 'Wednesday 4 November');
});
