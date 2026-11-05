import { dateKey, formatDate, formatDuration, formatTime, minutesBetween } from './time.js';

export const MAX_MINUTES = 120;

// Two time ranges overlap when each one starts before the other ends.
// Touching ends do not overlap: 10:00-11:00 and 11:00-12:00 are both allowed.
export function overlaps(a, b) {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end);
}

// Checks a booking against the three house rules of Topic 02.
//   draft    = { id?, roomId, userId, start, end }  (id is set when editing, so a booking never clashes with itself)
//   bookings = every booking in the app
// Returns a list of problems, each { rule, message }. An empty list means the booking is allowed.
export function checkHouseRules(draft, bookings, now = new Date()) {
  const problems = [];
  // Cancelled and completed bookings never block anyone.
  const others = bookings.filter((b) => b.id !== draft.id && b.status === 'confirmed');

  // Rule 1: no overlap with another confirmed booking of the same room, not even by one minute.
  const clash = others.find((b) => b.roomId === draft.roomId && overlaps(b, draft));
  if (clash) {
    problems.push({
      rule: 'overlap',
      bookingId: clash.id,
      message: `This room is already booked from ${formatTime(clash.start)} to ${formatTime(clash.end)}. Two bookings of the same room cannot overlap, not even by one minute.`,
    });
  }

  // Rule 2: at most two hours.
  const minutes = minutesBetween(draft.start, draft.end);
  if (minutes > MAX_MINUTES) {
    problems.push({
      rule: 'max-length',
      message: `This booking lasts ${formatDuration(minutes)}. A booking can last at most 2 hours.`,
    });
  }

  // Rule 3: one confirmed future booking per user per day.
  if (new Date(draft.start) > now) {
    const sameDay = others.find(
      (b) => b.userId === draft.userId && new Date(b.start) > now && dateKey(b.start) === dateKey(draft.start)
    );
    if (sameDay) {
      problems.push({
        rule: 'one-per-day',
        bookingId: sameDay.id,
        message: `You already have a booking on ${formatDate(sameDay.start)} from ${formatTime(sameDay.start)} to ${formatTime(sameDay.end)}. You can hold only one upcoming booking per day.`,
      });
    }
  }

  return problems;
}

// A confirmed booking whose end time has passed counts as completed.
export function effectiveStatus(booking, now = new Date()) {
  if (booking.status === 'confirmed' && new Date(booking.end) <= now) return 'completed';
  return booking.status;
}
