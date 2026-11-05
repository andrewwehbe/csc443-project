// Date helpers. Every time is stored as an ISO string (the format an API returns in Phase 2)
// and shown in the browser's local time.

// The date `dayOffset` days from today at a 'HH:MM' local time, as an ISO string.
// atTime(0, '14:00') = today at 14:00; atTime(-1, '09:30') = yesterday at 09:30.
export function atTime(dayOffset, hhmm, today = new Date()) {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hours, minutes);
  return date.toISOString();
}

export function minutesBetween(startISO, endISO) {
  return (new Date(endISO) - new Date(startISO)) / 60000;
}

// 'YYYY-MM-DD' in local time: two bookings are on the same day when their keys match.
export function dateKey(iso) {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// '14:00'
export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// 'Thu 5 Nov'
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// 90 -> '1 h 30 min', 120 -> '2 h', 45 -> '45 min'
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
