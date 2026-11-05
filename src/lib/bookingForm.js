import { dateKey, timeKey, toISO } from './time.js';

// Helpers for the booking form. The form holds strings, because that is what inputs give back:
//   { roomId: 'r3', date: '2026-11-12', start: '14:00', end: '15:30', attendees: '4', purpose: 'Group study' }

// The starting values of a new booking. Other screens can fill some in through the address:
// /bookings/new?room=r3&date=2026-11-12&start=14:00&end=15:00
export function emptyForm(searchParams) {
  return {
    roomId: searchParams.get('room') ?? '',
    date: searchParams.get('date') ?? dateKey(new Date()),
    start: searchParams.get('start') ?? '',
    end: searchParams.get('end') ?? '',
    attendees: '',
    purpose: '',
  };
}

// The starting values when editing: a saved booking turned back into form strings.
export function bookingToForm(booking) {
  return {
    roomId: booking.roomId,
    date: dateKey(booking.start),
    start: timeKey(booking.start),
    end: timeKey(booking.end),
    attendees: String(booking.attendees),
    purpose: booking.purpose,
  };
}

// The form strings turned into the shape a booking is stored in.
export function formToDraft(form) {
  return {
    roomId: form.roomId,
    start: toISO(form.date, form.start),
    end: toISO(form.date, form.end),
    attendees: Number(form.attendees),
    purpose: form.purpose.trim(),
  };
}

// Checks each field and returns { field: 'what is wrong' }. An empty object means every field is fine.
// The house rules are checked separately, by checkHouseRules, once the room and times are valid.
export function validateForm(form, rooms, now = new Date()) {
  const errors = {};
  const room = rooms.find((r) => r.id === form.roomId);
  const start = new Date(`${form.date}T${form.start}`);   // Invalid Date when a part is missing
  const end = new Date(`${form.date}T${form.end}`);
  const people = Number(form.attendees);
  const purpose = form.purpose.trim();

  if (!room) errors.roomId = 'Choose a room.';
  if (!form.date) errors.date = 'Choose a date.';
  if (isNaN(start)) errors.start = 'Choose a start time.';
  else if (start <= now) errors.start = 'This time has already passed. Choose a later one.';
  if (isNaN(end)) errors.end = 'Choose an end time.';
  else if (end <= start) errors.end = 'The end must be after the start.';
  if (!Number.isInteger(people) || people < 1) errors.attendees = 'Enter how many people are coming, 1 or more.';
  else if (room && people > room.capacity) errors.attendees = `${room.name} seats ${room.capacity}. Choose a bigger room.`;
  if (purpose === '') errors.purpose = 'Say what the room is for.';
  else if (purpose.length > 80) errors.purpose = 'Keep it to 80 characters.';

  return errors;
}
