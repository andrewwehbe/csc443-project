// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildingSlug, floorParams, floorsOf, floorTitle, readFloor, roomCount, roomsOnFloor } from './floor.js';
import { rooms } from '../data/rooms.js';

const params = (query) => new URLSearchParams(query);

test('a building gets a short name for the address', () => {
  assert.equal(buildingSlug('Main Library'), 'main');
  assert.equal(buildingSlug('Engineering Library'), 'engineering');
});

test('the floors come from the rooms, in order, each once', () => {
  assert.deepEqual(
    floorsOf(rooms).map((f) => `${f.slug}-${f.floor}`),
    ['main-1', 'main-2', 'main-3', 'engineering-1', 'engineering-2'],
  );
});

test('the floor in the address is the one shown', () => {
  const floor = readFloor(params('building=engineering&floor=2'), rooms);
  assert.equal(floor.building, 'Engineering Library');
  assert.equal(floor.floor, 2);
});

test('a missing or bad floor opens the first floor', () => {
  const first = { building: 'Main Library', slug: 'main', floor: 1 };
  assert.deepEqual(readFloor(params(''), rooms), first);
  assert.deepEqual(readFloor(params('building=main&floor=9'), rooms), first);
  assert.deepEqual(readFloor(params('building=annex&floor=1'), rooms), first);
  assert.deepEqual(readFloor(params('building=main&floor=two'), rooms), first);
});

test('a floor turns back into the same address', () => {
  const floor = readFloor(params('building=main&floor=3'), rooms);
  assert.equal(floorParams(floor).toString(), 'building=main&floor=3');
});

test('a floor lists its own rooms, the one out of service included', () => {
  const floor = readFloor(params('building=main&floor=2'), rooms);
  assert.deepEqual(roomsOnFloor(rooms, floor).map((r) => r.id), ['r4', 'r5', 'r6']);
  assert.deepEqual(roomsOnFloor(rooms, readFloor(params('building=engineering&floor=1'), rooms)).map((r) => r.id), ['r9', 'r10', 'r11']);
});

test('the floor title and room count read as words', () => {
  assert.equal(floorTitle({ building: 'Main Library', floor: 2 }), 'Main Library, second floor');
  assert.equal(roomCount(1), 'One room');
  assert.equal(roomCount(3), 'Three rooms');
  assert.equal(roomCount(0), 'No rooms');
});
