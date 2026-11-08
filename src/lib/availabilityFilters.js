import { AMENITIES } from '../data/rooms.js';
import { dateKey } from './time.js';

function parseDay(day) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

// Date rolls impossible days forward (31 Feb becomes March), so check nothing moved.
function isDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [, month, date] = value.split('-').map(Number);
  const parsed = parseDay(value);
  return parsed.getMonth() === month - 1 && parsed.getDate() === date;
}

// What the capacity box accepts: digits only, no leading zeros.
export function digitsOnly(text) {
  return text.replace(/\D/g, '').replace(/^0+/, '');
}

// A whole number of people, or 0 for no filter.
export function parseCapacity(text) {
  const capacity = Number(text);
  return Number.isInteger(capacity) && capacity > 0 ? capacity : 0;
}

// /availability?date=2026-11-12&capacity=4&match=exact&amenity=screen&amenity=power
// A missing or invalid value means no filter, so a bad link still opens.
export function readFilters(searchParams, today = new Date()) {
  const date = searchParams.get('date');
  const picked = searchParams.getAll('amenity');
  return {
    date: isDay(date) ? date : dateKey(today),
    capacity: parseCapacity(searchParams.get('capacity')),
    exact: searchParams.get('match') === 'exact',
    amenities: AMENITIES.filter((amenity) => picked.includes(amenity)),
  };
}

export function filtersToParams({ date, capacity, exact, amenities }) {
  const params = new URLSearchParams({ date });
  if (capacity) params.set('capacity', capacity);
  if (exact) params.set('match', 'exact');
  amenities.forEach((amenity) => params.append('amenity', amenity));
  return params;
}

// Capacity is a minimum unless exact is set. A room must have every ticked amenity.
export function filterRooms(rooms, { capacity, exact, amenities }) {
  const fits = (room) => !capacity || (exact ? room.capacity === capacity : room.capacity >= capacity);
  return rooms.filter((room) => fits(room) && amenities.every((amenity) => room.amenities.includes(amenity)));
}

export function shiftDay(day, by) {
  const next = parseDay(day);
  next.setDate(next.getDate() + by);
  return dateKey(next);
}

// 'Wednesday 4 November'
export function formatLongDay(day) {
  return parseDay(day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
