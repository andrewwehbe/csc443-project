import { floorName } from './roomDetail.js';

// The floor screen (/rooms) shows one floor at a time. The chosen floor lives in the address,
//   /rooms?building=main&floor=2
// so a floor view survives a reload and can be shared. A missing or bad value opens the first floor.

const COUNT = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

// 'Main Library' -> 'main', 'Engineering Library' -> 'engineering': short enough for the address.
export function buildingSlug(building) {
  return building.split(' ')[0].toLowerCase();
}

// Every floor that has rooms, in the order the rooms are listed: [{ building, slug, floor }].
export function floorsOf(rooms) {
  const floors = [];
  for (const room of rooms) {
    if (!floors.some((f) => f.building === room.building && f.floor === room.floor)) {
      floors.push({ building: room.building, slug: buildingSlug(room.building), floor: room.floor });
    }
  }
  return floors;
}

export function readFloor(searchParams, rooms) {
  const floors = floorsOf(rooms);
  const slug = searchParams.get('building');
  const floor = Number(searchParams.get('floor'));
  return floors.find((f) => f.slug === slug && f.floor === floor) ?? floors[0];
}

export function floorParams({ slug, floor }) {
  return new URLSearchParams({ building: slug, floor: String(floor) });
}

export function roomsOnFloor(rooms, { building, floor }) {
  return rooms.filter((room) => room.building === building && room.floor === floor);
}

// 'Main Library, second floor'
export function floorTitle({ building, floor }) {
  return `${building}, ${floorName(floor)}`;
}

// 'Three rooms' / 'One room'
export function roomCount(n) {
  return `${COUNT[n] ?? n} ${n === 1 ? 'room' : 'rooms'}`;
}
