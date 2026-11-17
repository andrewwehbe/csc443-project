import { DAY_START, minuteOfDay } from './timeline.js';

// How busy the library is, by weekday and hour, for the busy-hours grid on The floor.
// Returns counts[day][hour]: day 0 = Monday … 6 = Sunday, hour 0 = 08:00 … 13 = 21:00, and each count is
// how many bookings held a room during that hour. Cancelled bookings never held a room, so they do not count.
export function busyHours(bookings) {
  const counts = Array.from({ length: 7 }, () => Array(14).fill(0));
  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue;
    const day = (new Date(booking.start).getDay() + 6) % 7;   // getDay() starts the week on Sunday
    const from = minuteOfDay(booking.start);
    const to = minuteOfDay(booking.end);
    for (let hour = 0; hour < 14; hour += 1) {
      const hourStart = DAY_START + hour * 60;
      if (from < hourStart + 60 && hourStart < to) counts[day][hour] += 1;
    }
  }
  return counts;
}

// The busiest cell, for the sentence under the grid: { day, hour, count }, or null when nothing is booked.
export function busiest(counts) {
  let best = null;
  counts.forEach((row, day) => row.forEach((count, hour) => {
    if (count > 0 && (best === null || count > best.count)) best = { day, hour, count };
  }));
  return best;
}
