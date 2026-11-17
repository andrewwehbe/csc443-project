import { DAY_END, DAY_START, minuteOfDay } from './timeline.js';

// Click-to-book on a day timeline: click a free part of the bar, get a ready-made booking for that spot.
// Minutes count from midnight (14:30 = 870), like the rest of the timeline code.

// The free stretch around the minute that was clicked: from the end of the booking before it to the start
// of the booking after it (or the opening hours). null when the minute is inside a booking.
//   blocks = [{ start, end }] ISO strings, one room, one day
export function freeStretchAt(blocks, minute) {
  let from = DAY_START;
  let to = DAY_END;
  for (const block of blocks) {
    const start = minuteOfDay(block.start);
    const end = minuteOfDay(block.end);
    if (start <= minute && minute < end) return null;
    if (end <= minute) from = Math.max(from, end);
    if (start > minute) to = Math.min(to, start);
  }
  return { from, to };
}

// The booking to offer: it starts at the half hour that was clicked (never before the stretch, never before
// now) and lasts up to two hours, the house limit. null when less than half an hour is left.
// nowMinute is -1 for a day that has not started yet.
export function quickRange(stretch, minute, nowMinute = -1) {
  const start = Math.max(stretch.from, Math.floor(minute / 30) * 30, Math.ceil(nowMinute / 30) * 30);
  const end = Math.min(start + 120, stretch.to);
  return end - start >= 30 ? { start, end } : null;
}

// 870 -> '14:30'
export const clock = (minute) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
