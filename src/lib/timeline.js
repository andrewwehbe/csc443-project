// Geometry of the day timeline. Pure functions, so the maths can be tested without React.
// The library day runs 08:00-22:00; every position is a percentage of those 14 hours.

export const DAY_START = 8 * 60;
export const DAY_END = 22 * 60;
const DAY_LENGTH = DAY_END - DAY_START;

// Minutes since local midnight: '…T14:30' -> 870.
export function minuteOfDay(iso) {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
}

const clamp = (minute) => Math.min(Math.max(minute, DAY_START), DAY_END);
const percent = (minutes) => (minutes / DAY_LENGTH) * 100;
const hhmm = (minute) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

// '10:00–12:00' for the title, '10–12' (or '10:30–11:30') for the label inside a short segment.
export function rangeTitle(from, to) {
  return `${hhmm(from)}–${hhmm(to)}`;
}
export function rangeLabel(from, to) {
  const short = (minute) => (minute % 60 === 0 ? hhmm(minute).slice(0, 2) : hhmm(minute));
  return `${short(from)}–${short(to)}`;
}

// Turns the day's blocks into what the bar draws, left to right: gaps and segments that add up to 100%.
//   blocks = [{ id, start, end, kind }]  (kind is 'booked' or 'yours'; start and end are ISO strings on that day)
// Returns [{ type: 'gap', width }, { type: 'segment', id, kind, from, to, width }, ...].
// Anything before 08:00 or after 22:00 is cut off, and a block that would overlap the previous one starts where it ends.
export function daySegments(blocks) {
  const sorted = blocks
    .map((b) => ({ ...b, from: clamp(minuteOfDay(b.start)), to: clamp(minuteOfDay(b.end)) }))
    .sort((a, b) => a.from - b.from);

  const parts = [];
  let cursor = DAY_START;
  for (const block of sorted) {
    const from = Math.max(block.from, cursor);
    if (block.to <= from) continue;
    if (from > cursor) parts.push({ type: 'gap', width: percent(from - cursor) });
    parts.push({ type: 'segment', id: block.id, kind: block.kind, from, to: block.to, width: percent(block.to - from) });
    cursor = block.to;
  }
  if (cursor < DAY_END) parts.push({ type: 'gap', width: percent(DAY_END - cursor) });
  return parts;
}

// Where an overlay (the time being chosen, or a clash) sits on the bar, so it can be drawn on top of the bookings.
// Returns null when the range is not within the day at all.
export function overlayPosition(start, end) {
  const from = clamp(minuteOfDay(start));
  const to = clamp(minuteOfDay(end));
  if (to <= from) return null;
  return { from, to, left: percent(from - DAY_START), width: percent(to - from) };
}

// The phone version: one row per hour, 08:00 to 21:00, saying what fills that hour.
//   blocks = the same blocks as daySegments; chosen = { start, end, clash } or null.
// Returns [{ hour: '14:00', kind: 'free' | 'booked' | 'yours' | 'chosen' | 'clash', until? }].
// `until` is the end time of your own booking ('16:00'), so the row can read "Yours · until 16:00".
export function hourRows(blocks, chosen = null) {
  const rows = [];
  for (let hour = DAY_START; hour < DAY_END; hour += 60) {
    const inHour = (b) => minuteOfDay(b.start) < hour + 60 && hour < minuteOfDay(b.end);
    const block = blocks.find(inHour);
    let row = { hour: hhmm(hour), kind: 'free' };
    if (block) row = { hour: row.hour, kind: block.kind, ...(block.kind === 'yours' && { until: hhmm(minuteOfDay(block.end)) }) };
    if (chosen && inHour(chosen)) row = { hour: row.hour, kind: chosen.clash ? 'clash' : 'chosen' };
    rows.push(row);
  }
  return rows;
}
