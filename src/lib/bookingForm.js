import { dateKey, toISO, timeKey } from './time.js';

// Plain functions behind the booking form (New booking and Edit booking). No React here,
// so npm test can check them. The form holds strings, because that is what inputs give back:
//   form = { roomId: 'r3', date: '2026-11-06', start: '14:00', end: '15:30', attendees: '4', purpose: '...' }

export const PURPOSE_MAX = 80;
export const FIELDS = ['roomId', 'date', 'start', 'end', 'attendees', 'purpose'];

const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '');
const isTime = (value) => /^\d{2}:\d{2}$/.test(value ?? '');

// '14:00' plus 60 minutes = '15:00'. Returns '' when the result would pass midnight.
function addMinutes(hhmm, minutes) {
  const [hours, mins] = hhmm.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  if (total >= 24 * 60) return '';
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// The starting values of a new booking. prefill comes from the address bar, so other screens can
// open the form already filled in: /bookings/new?room=r3&date=2026-11-06&start=14:00&end=15:00
// Anything missing or malformed is left empty; the date defaults to today, the end to one hour after the start.
export function newBookingForm(prefill, rooms, now = new Date()) {
  const room = rooms.find((r) => r.id === prefill.room);
  const start = isTime(prefill.start) ? prefill.start : '';
  let end = isTime(prefill.end) ? prefill.end : '';
  if (start && !end) end = addMinutes(start, 60);

  return {
    roomId: room ? room.id : '',
    date: isDate(prefill.date) ? prefill.date : dateKey(now),
    start,
    end,
    attendees: '',
    purpose: '',
  };
}

// The starting values when editing: the saved booking turned back into form strings.
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

// The form strings turned into the shape a booking is stored in (what addBooking and updateBooking take).
export function formToDraft(form) {
  return {
    roomId: form.roomId,
    start: toISO(form.date, form.start),
    end: toISO(form.date, form.end),
    attendees: Number(form.attendees),
    purpose: form.purpose.trim(),
  };
}

// True when any field differs from where the form started (used for the unsaved-changes warning).
export function formChanged(form, initialForm) {
  return FIELDS.some((name) => form[name] !== initialForm[name]);
}

// Checks each field on its own and returns { field: 'what is wrong' } (an empty object = all fine).
// The three house rules are checked separately, by checkHouseRules, once the room and times are valid.
export function validateForm(form, rooms, now = new Date()) {
  const errors = {};
  const room = rooms.find((r) => r.id === form.roomId);

  if (!room) errors.roomId = 'Choose a room.';

  if (!isDate(form.date)) errors.date = 'Choose a date.';
  else if (form.date < dateKey(now)) errors.date = 'This day has already passed. Choose today or a later day.';

  if (!isTime(form.start)) errors.start = 'Choose a start time.';
  else if (!errors.date && new Date(toISO(form.date, form.start)) <= now) {
    errors.start = `${form.start} today has already passed. Choose a later start time.`;
  }

  // 'HH:MM' strings sort like times, so a plain comparison works.
  if (!isTime(form.end)) errors.end = 'Choose an end time.';
  else if (isTime(form.start) && form.end <= form.start) errors.end = 'The end time must be after the start time.';

  const attendees = Number(form.attendees);
  if (form.attendees.trim() === '') errors.attendees = 'Enter how many people are coming, you included.';
  else if (!Number.isInteger(attendees) || attendees < 1) errors.attendees = 'Enter a whole number, 1 or more.';
  else if (room && attendees > room.capacity) {
    errors.attendees = `${room.name} seats ${room.capacity}. Choose a bigger room or bring fewer people.`;
  }

  const purpose = form.purpose.trim();
  if (purpose === '') errors.purpose = 'Say what the room is for, for example "CSC443 project meeting".';
  else if (purpose.length > PURPOSE_MAX) {
    errors.purpose = `Keep it to ${PURPOSE_MAX} characters. It is ${purpose.length} now.`;
  }

  return errors;
}
