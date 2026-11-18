import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { firstSlot, hasBegun, nextDays, openRooms } from '../lib/findTime.js';
import { shiftDay } from '../lib/availabilityFilters.js';
import { clock } from '../lib/quickBook.js';
import { dateKey, toISO } from '../lib/time.js';
import { Lock } from 'lucide-react';
import Icon from '../components/Icon.jsx';

// Surface: Book a room, at /explore. Owner: Andrew Wehbe. The one way to book: three steps, each filling the window:
//   1 Day:  a calendar with today in the middle row; the next seven days are lit, every other day is dark.
//   2 Time: a clock of the opening hours; drag round it (or tap) to take a section, 10 am to 1 pm.
//   3 Room: the library. It rises in, its lights come on, and every room with an opening in your days and
//           section stays lit. Click a floor to zoom onto it; hover a room for its picture and openings.
// Everything picked lives in the address, so Back steps back and a reload keeps it.

// The pictures' map, in their own pixels (1168 × 880), measured from the day and night pictures.
const IMG = { width: 1168, height: 880 };
const FLOOR_Y = [[642, 790], [522, 642], [402, 522], [282, 402], [150, 282]];    // floors 1 to 5, slab to slab (hover, zoom)
// The floors are drawn in slight perspective: each slab is 15-25px higher at the right edge than the left.
// So each floor's interior is given at both edges, x 306 and x 998, as [top, bottom] (the bottom is the middle
// of the slab below, whose top face glows by day), and every box in between follows the slope.
const EDGE_X = [306, 998];
const ROOM_Y = [
  { left: [655, 790], right: [640, 785] },
  { left: [540, 648], right: [520, 627] },
  { left: [420, 531], right: [400, 507] },
  { left: [298, 412], right: [280, 387] },
  { left: [167, 291], right: [150, 267] },
];
const CELL_X = [[306, 570], [570, 772], [772, 998]];                              // the three spaces, glass frames included
// The top (edge 0) or bottom (edge 1) of floor i's interior at x, following the slope.
const yAt = (i, x, edge) => {
  const t = (x - EDGE_X[0]) / (EDGE_X[1] - EDGE_X[0]);
  return ROOM_Y[i].left[edge] + t * (ROOM_Y[i].right[edge] - ROOM_Y[i].left[edge]);
};
// The four corners of floor i between x1 and x2, as SVG points, pulled in by `inset` on every side.
const quad = (i, x1, x2, inset = 0) =>
  `${x1 + inset},${yAt(i, x1, 0) + inset} ${x2 - inset},${yAt(i, x2, 0) + inset} ${x2 - inset},${yAt(i, x2, 1) - inset} ${x1 + inset},${yAt(i, x1, 1) - inset}`;
const BUILDING_X = [158, 1000];
// Which room is in each space, floor 1 to 5. A plain word is a space nobody books.
const LAYOUT = [
  ['Entrance', 'r1', 'r2'],
  ['r3', 'r4', 'r5'],
  ['r6', 'r7', 'r8'],
  ['r9', 'r10', 'r11'],
  ['r12', 'Reading area', 'Reading area'],
];
const ALWAYS_LIT = ['Entrance'];
const ZOOM = 1.7;
const FLOOR_AT = 0.64;   // where the zoom puts the opened floor, as a share of the height: low, so its card fits above
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);   // the clock: 08:00 … 22:00, one segment per hour

function middleOf([a, b]) { return (a + b) / 2; }
const CX = middleOf([CELL_X[0][0], CELL_X[2][1]]) / IMG.width;   // the zoom centres the rooms across
// Where a point of the picture (as a share of its width or height) lands once a floor is zoomed onto.
const zoomX = (x) => 0.5 + ZOOM * (x - CX);
const zoomY = (y, level) => FLOOR_AT + ZOOM * (y - middleOf(FLOOR_Y[level - 1]) / IMG.height);

const longDay = (day, today) =>
  day === today ? 'Today' : new Date(`${day}T12:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
// Times shown on a 12-hour clock: 10 am, 1:30 pm. (The booking form's address still takes 24-hour 13:30.)
const ampm = (minute) => {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
};
const slotName = (hour) => `${ampm(hour * 60)}–${ampm(hour * 60 + 60)}`;
// The picked hours as runs of back-to-back hours: [10, 11, 12, 16, 17] -> [[10, 12], [16, 17]].
const sections = (hours) => hours.reduce((runs, h) => {
  const last = runs.at(-1);
  if (last && last[1] === h - 1) last[1] = h; else runs.push([h, h]);
  return runs;
}, []);
// '10 am–1 pm, 4 pm–6 pm'
const windowName = (hours) => sections(hours).map(([a, b]) => `${ampm(a * 60)}–${ampm(b * 60 + 60)}`).join(', ');
const shortName = (room) => room.name.replace(/^(Study|Group|Seminar) Room |^Project Lab /, '');
const picture = (name) => `${import.meta.env.BASE_URL}explore/${name}.webp`;
const range = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);
const goButton = 'group inline-flex items-center gap-2 rounded-xl bg-brand-800 px-6 py-3 text-base font-semibold text-paper transition-[background-color,scale] hover:bg-brand-900 active:scale-[0.96] disabled:opacity-30';
const quietButton = 'rounded-lg border border-line bg-paper px-2 py-2 text-xs font-medium text-ink transition-colors hover:border-accent-500 hover:bg-accent-50';
const arrow = <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>;

export default function ExplorePage({ rooms, bookings, currentUser, addBooking }) {
  const now = new Date();
  const today = dateKey(now);
  const [searchParams, setSearchParams] = useSearchParams();
  const { days, hours } = readPicks(searchParams, today, now);
  const askedView = searchParams.get('view') ?? 'day';
  const booked = askedView === 'done' ? bookings.find((b) => b.id === searchParams.get('booked')) : null;
  const view = booked ? 'done' : askedView === 'library' && days.length && hours.length ? 'library' : askedView === 'time' && days.length ? 'time' : 'day';
  const [asking, setAsking] = useState(null);         // { room, opening } while the confirm dialog is open
  const [hovered, setHovered] = useState(null);       // the room under the pointer, when a floor is open
  const [aimed, setAimed] = useState(null);           // the floor under the pointer, on the building

  // Every opening: each picked day in each hour of the section, the rooms free for that hour.
  const openings = new Map();   // room id -> [{ day, start }]
  for (const day of days) {
    for (const hour of hours) {
      if (hasBegun(day, hour * 60, now)) continue;
      for (const room of openRooms(rooms, bookings, day, hour * 60, 60, now)) {
        openings.set(room.id, [...(openings.get(room.id) ?? []), { day, start: hour * 60 }]);
      }
    }
  }
  const openIds = new Set(openings.keys());
  const total = [...openings.values()].reduce((sum, list) => sum + list.length, 0);
  const levels = LAYOUT.map((ids, i) => {
    const spaces = ids.map((id) => rooms.find((r) => r.id === id) ?? { label: id });
    const own = spaces.filter((s) => s.id);
    return { level: i + 1, spaces, open: own.filter((r) => openIds.has(r.id)).length, rooms: own };
  });
  const level = view === 'library' ? levels.find((l) => l.level === Number(searchParams.get('level'))) ?? null : null;

  // Picking replaces the address entry (no Back step per tap); moving to another step pushes one.
  const go = ({ nextView = view, nextLevel = level?.level, push = false, bookedId, ...changes }) => {
    const next = { days, hours, ...changes };
    const params = new URLSearchParams({ days: next.days.join(','), hours: next.hours.join(','), view: nextView });
    if (nextView === 'library' && nextLevel) params.set('level', String(nextLevel));
    if (bookedId) params.set('booked', bookedId);
    setSearchParams(params, { replace: !push });
  };
  const openFloor = (l) => { setHovered(null); go({ nextLevel: l ? l.level : null }); };
  // A click on a room (or on one of its openings) asks first; Confirm books it with the house rules checked.
  const pick = (room, opening) => setAsking({ room, opening: opening ?? openings.get(room.id)?.[0] ?? null });
  function confirm({ room, opening, purpose, people }) {
    const result = addBooking({ roomId: room.id, start: toISO(opening.day, clock(opening.start)), end: toISO(opening.day, clock(opening.start + 60)),
      attendees: people, purpose });
    if (result.ok) { setAsking(null); setHovered(null); go({ nextView: 'done', push: true, bookedId: result.booking.id }); }
    return result;
  }

  // How many rooms are free at an hour on at least one picked day: the clock shows it in each segment.
  const freeAt = (hour) => new Set(days.filter((d) => !hasBegun(d, hour * 60, now))
    .flatMap((d) => openRooms(rooms, bookings, d, hour * 60, 60, now).map((r) => r.id))).size;

  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
      <Steps view={view} days={days} hours={hours} today={today} onGo={(nextView) => go({ nextView, push: true })} />
      {view === 'done' && <DoneScreen booking={booked} room={rooms.find((r) => r.id === booked.roomId)} today={today} onAgain={() => go({ nextView: 'day', push: true })} />}
      {view === 'day' && (
        <DayStep days={days} today={today} onChange={(d) => go({ days: d })} onNext={() => go({ nextView: 'time', push: true })} />
      )}
      {view === 'time' && (
        <TimeStep hours={hours} days={days} today={today} now={now} total={total} freeAt={freeAt}
          onChange={(h) => go({ hours: h })} onNext={() => go({ nextView: 'library', nextLevel: null, push: true })} />
      )}
      {view === 'library' && (
        <>
          <div className="rise-in flex flex-wrap items-end gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{level ? `Floor ${level.level}` : 'The library'}</h1>
              <p className="mt-1 truncate text-sm text-muted">
                <span className="font-semibold text-ink">{total}</span> {total === 1 ? 'opening' : 'openings'} in {openIds.size} rooms · {days.map((d) => longDay(d, today)).join(', ')} · {windowName(hours)}
              </p>
            </div>
            <span className="flex-1" />
            {level && <button type="button" onClick={() => openFloor(null)} className="rounded-lg border border-ink/20 bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-brand-50">Back to the building</button>}
          </div>
          {/* As big as the space allows without scrolling: the box keeps the picture's shape and fits
              whichever of width or height runs out first (cqw/cqh: the container's size). */}
          <div className="flex min-h-[24rem] flex-1 items-center justify-center [container-type:size]">
            <div className="building-in relative aspect-[1168/880]" style={{ width: 'min(100cqw, calc(100cqh * 1168 / 880))' }}>
              <Library levels={levels} level={level} openIds={openIds} aimed={aimed} hovered={hovered}
                onAim={setAimed} onOpen={openFloor} onHover={setHovered} onPick={pick} />
              <LiftPanel levels={levels} level={level} aimed={aimed} onAim={setAimed} onOpen={openFloor} />
              {level && hovered && !asking && <RoomPopover key={hovered.id} room={hovered} level={level} list={openings.get(hovered.id) ?? []} today={today} onPick={pick} />}
              {asking && <BookDialog ask={asking} list={openings.get(asking.room.id) ?? []} level={level} today={today} signedIn={Boolean(currentUser)}
                onCancel={() => setAsking(null)} onConfirm={confirm} />}
              {level && !hovered && (
                <p className="pop-in absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-900 px-4 py-2 text-xs font-medium text-paper">Hover a room to see it, click to book it</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// The picks from the address: /explore?days=2026-11-19,2026-11-20&hours=10,11,12&view=time .
// With nothing picked yet: the first day that still has an hour open, and no time.
function readPicks(searchParams, today, now) {
  const valid = nextDays(today);
  if (!searchParams.has('days')) return { days: [firstSlot(today, 60, now).day], hours: [] };
  const days = searchParams.get('days').split(',').filter((d) => valid.includes(d));
  const hours = (searchParams.get('hours') ?? '').split(',').filter(Boolean).map(Number).filter((h) => HOURS.includes(h));
  return { days, hours: [...new Set(hours)].sort((a, b) => a - b) };
}

// The three steps across the top. A step already done can be clicked to go back to it.
function Steps({ view, days, hours, today, onGo }) {
  const steps = [
    { key: 'day', label: 'Day', note: days.map((d) => longDay(d, today)).join(', ') },
    { key: 'time', label: 'Time', note: windowName(hours) },
    { key: 'library', label: 'Room', note: '' },
  ];
  const at = view === 'done' ? steps.length : steps.findIndex((s) => s.key === view);
  return (
    <ol className="rise-in flex w-full items-center gap-2 text-sm">
      {steps.map((s, i) => {
        const done = i < at;
        const current = i === at;
        return (
          <li key={s.key} className={`flex items-center gap-2 ${i > 0 ? 'flex-1' : ''}`}>
            {i > 0 && <span aria-hidden="true" className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${i <= at ? 'bg-accent-500' : 'bg-line'}`} />}
            <button type="button" disabled={!done} onClick={() => onGo(s.key)} aria-current={current ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors ${current ? 'border-accent-500 bg-accent-100 text-ink' : done ? 'border-ink/20 bg-surface text-ink hover:bg-brand-50' : 'border-line text-muted'}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${current ? 'bg-accent-500 text-surface' : done ? 'bg-brand-800 text-paper' : 'bg-line text-muted'}`}>{done ? '✓' : i + 1}</span>
              <span className="font-semibold">{s.label}</span>
              {done && s.note && <span className="hidden max-w-48 truncate text-xs text-muted sm:inline">{s.note}</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// Step 1: five weeks of calendar with today in the middle row. The seven days you can book are lit; every
// other day is locked (a padlock, greyed). The grid fades in, then the bookable days light up one after another.
function DayStep({ days, today, onChange, onNext }) {
  const bookable = nextDays(today);
  const sinceMonday = (new Date(`${today}T12:00`).getDay() + 6) % 7;
  const cells = Array.from({ length: 35 }, (_, i) => shiftDay(today, i - 14 - sinceMonday));
  const months = [...new Set(cells.map((d) => new Date(`${d}T12:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })))];
  const toggle = (day) => onChange(days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort());

  return (
    <div className="flex w-full flex-1 flex-col gap-4 lg:min-h-0">
      <div className="rise-in flex flex-wrap items-end justify-between gap-3" style={{ '--i': 1 }}>
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Which day?</h1>
          <p className="mt-2 text-muted">The gold days can be booked. Pick one, or several.</p>
        </div>
        <p className="font-display text-xl font-semibold text-accent-700">{months.join(' – ')}</p>
      </div>

      <div className="grid flex-1 grid-cols-7 grid-rows-[auto_repeat(5,minmax(3.5rem,1fr))] gap-2 text-center lg:min-h-0">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, i) => (
          <span key={name} className="rise-in pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted" style={{ '--i': 2 + i }}>{name}</span>
        ))}
        {cells.map((day, i) => {
          const lit = bookable.includes(day);
          const picked = days.includes(day);
          const date = new Date(`${day}T12:00`);
          const row = Math.floor(i / 7);
          return (
            <button key={day} type="button" disabled={!lit} aria-pressed={lit ? picked : undefined} onClick={() => toggle(day)}
              aria-label={`${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}${lit ? '' : ', not bookable'}`}
              className={`rise-in relative flex h-full flex-col items-start justify-between rounded-xl border px-3 py-2.5 text-left transition-[background-color,border-color,color,scale] duration-200 ease-enter active:scale-[0.97] sm:px-3 ${
                picked ? 'border-accent-600 bg-accent-400 text-ink hover:z-10 hover:scale-110'
                  : lit ? 'lamp border-accent-500 bg-accent-50 text-ink hover:z-10 hover:scale-110 hover:bg-accent-100'
                    : 'cursor-not-allowed border-line bg-surface text-muted/60'}`}
              style={{ '--i': 4 + row + (i % 7), '--d': `${450 + Math.max(0, bookable.indexOf(day)) * 110}ms` }}>
              {picked && <span aria-hidden="true" className="tick absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-900 text-[11px] font-bold text-accent-300">✓</span>}
              {!lit && <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted/60"><span className="scale-125"><Icon icon={Lock} size="lg" /></span></span>}
              <span className="font-display text-3xl font-semibold leading-none">{date.getDate()}</span>
              <span className="text-[11px] font-semibold">
                {day === today ? 'Today' : date.getDate() === 1 ? date.toLocaleDateString('en-GB', { month: 'short' }) : lit ? date.toLocaleDateString('en-GB', { weekday: 'short' }) : ''}
              </span>
              {day === today && <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-[0.9rem] ring-2 ring-brand-800" />}
            </button>
          );
        })}
      </div>

      <div className="rise-in flex items-center justify-between gap-4" style={{ '--i': 14 }}>
        <p className="text-sm text-muted">{days.length ? `${days.length} ${days.length === 1 ? 'day' : 'days'} picked` : 'No day picked yet'}</p>
        <button type="button" disabled={!days.length} onClick={onNext} className={goButton}>Next: the time {arrow}</button>
      </div>
    </div>
  );
}

// Step 2: the opening hours as a clock, 8 am at the top, one segment per hour round to 10 pm. Press on an
// hour and drag round to take a section (or tap one hour); each segment says how many rooms are free then.
const RING = { inner: 112, outer: 172 };
const polar = (r, deg) => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
function sector(r1, r2, a0, a1) {
  const [x0, y0] = polar(r2, a0);
  const [x1, y1] = polar(r2, a1);
  const [x2, y2] = polar(r1, a1);
  const [x3, y3] = polar(r1, a0);
  return `M${x0} ${y0} A${r2} ${r2} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r1} ${r1} 0 0 0 ${x3} ${y3} Z`;
}

function TimeStep({ hours, days, today, now, total, freeAt, onChange, onNext }) {
  // While the pointer is down: { from, to, adding }. Pressing on a free hour adds the section you drag over;
  // pressing on a picked hour takes it away. So a tap toggles one hour, and several sections can be picked.
  const [drag, setDrag] = useState(null);
  const onlyToday = days.length === 1 && days[0] === today;
  const gone = (hour) => onlyToday && hasBegun(today, hour * 60, now);
  const apply = ({ from, to, adding }) => {
    const swept = range(from, to).filter((h) => !gone(h));
    return adding ? [...new Set([...hours, ...swept])].sort((a, b) => a - b) : hours.filter((h) => !swept.includes(h));
  };
  const shown = drag ? apply(drag) : hours;
  const step = 360 / HOURS.length;

  // Letting go anywhere commits it.
  useEffect(() => {
    if (!drag) return undefined;
    const up = () => { onChange(apply(drag)); setDrag(null); };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  });

  const parts = [['Morning', range(8, 11)], ['Afternoon', range(12, 16)], ['Evening', range(17, 21)]];
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-evenly gap-4 lg:min-h-0 lg:flex-row">
      <div className="rise-in w-full max-w-md rounded-2xl border border-line bg-surface p-8" style={{ '--i': 1 }}>
        <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">What time?</h1>
        <p className="mt-2 text-sm text-muted">Drag round the clock to take a section; drag again for another. Tap a picked hour to drop it. Each hour shows how many rooms are free then.</p>
        <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-sm font-semibold text-ink">{hours.length ? windowName(hours) : 'No time picked yet'}</p>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {parts.map(([name, list]) => (
            <button key={name} type="button" onClick={() => onChange(list.filter((h) => !gone(h)))} className={quietButton}>{name}</button>
          ))}
          <button type="button" onClick={() => onChange([])} className={quietButton}>Clear</button>
        </div>
        <button type="button" disabled={!hours.length || total === 0} onClick={onNext} className={`${goButton} mt-5 w-full justify-center`}>See the rooms {arrow}</button>
      </div>

      <svg viewBox="-240 -240 480 480" className="rise-in aspect-square w-full max-w-[min(48rem,72vh)] touch-none select-none" style={{ '--i': 2 }}
        role="group" aria-label="Opening hours as a clock">
        <circle r={RING.outer + 10} className="fill-surface stroke-line" strokeWidth="1.5" />
        <circle r={RING.inner - 8} className="fill-paper" />
        {HOURS.map((hour, i) => {
          const a0 = -90 + i * step + 0.8;
          const a1 = -90 + (i + 1) * step - 0.8;
          const on = shown.includes(hour);
          const off = gone(hour);
          const free = off ? 0 : freeAt(hour);
          const [lx, ly] = polar(RING.outer + 30, (a0 + a1) / 2);
          const [cx, cy] = polar((RING.inner + RING.outer) / 2, (a0 + a1) / 2);
          return (
            <g key={hour} role="button" tabIndex={off ? -1 : 0} aria-pressed={on} aria-label={`${slotName(hour)}: ${off ? 'already begun' : `${free} rooms free`}`}
              onPointerDown={(e) => { if (off) return; e.preventDefault(); setDrag({ from: hour, to: hour, adding: !hours.includes(hour) }); }}
              onPointerEnter={() => drag && !off && setDrag({ ...drag, to: hour })}
              onKeyDown={(e) => { if (!off && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onChange(apply({ from: hour, to: hour, adding: !hours.includes(hour) })); } }}
              className={`rise-in outline-none ${off ? 'cursor-not-allowed' : 'cursor-pointer'}`} style={{ '--i': 3 + i }}>
              <path d={sector(RING.inner, RING.outer, a0, a1)}
                className={`transition-[fill] duration-200 ${on ? 'fill-accent-400' : off ? 'fill-brand-900' : 'fill-brand-50 hover:fill-accent-100'}`} />
              <text x={cx} y={cy + 5} textAnchor="middle" className={`pointer-events-none text-[15px] font-semibold ${on ? 'fill-ink' : off ? 'fill-paper/40' : 'fill-brand-800'}`}>{off ? '–' : free}</text>
              <text x={lx} y={ly + 4} textAnchor="middle" className={`pointer-events-none text-[12px] font-semibold ${on ? 'fill-accent-700' : off ? 'fill-muted/50' : 'fill-muted'}`}>{ampm(hour * 60)}</text>
            </g>
          );
        })}
        {/* the centre says what is taken, and what it opens */}
        <g key={windowName(shown)} className="count-bump pointer-events-none">
          {shown.length ? (
            <>
              {sections(shown).length === 1
                ? <text y="-14" textAnchor="middle" className="fill-ink font-display text-[26px] font-semibold">{windowName(shown)}</text>
                : <text y="-14" textAnchor="middle" className="fill-ink font-display text-[26px] font-semibold">{sections(shown).length} sections</text>}
              <text y="14" textAnchor="middle" className="fill-muted text-[13px]">{shown.length} {shown.length === 1 ? 'hour' : 'hours'}</text>
              {!drag && <text y="38" textAnchor="middle" className="fill-accent-700 text-[14px] font-semibold">{total} {total === 1 ? 'opening' : 'openings'}</text>}
            </>
          ) : (
            <>
              <text y="-4" textAnchor="middle" className="fill-ink font-display text-[22px] font-semibold">Drag round</text>
              <text y="20" textAnchor="middle" className="fill-muted text-[13px]">the clock</text>
            </>
          )}
        </g>
      </svg>

    </div>
  );
}

// The floors as big lift buttons beside the picture, 5 at the top, each level with its floor: lit or dark, and what is open.
function LiftPanel({ levels, level, aimed, onAim, onOpen }) {
  // Each button beside its floor: where the floor sits in the picture, or, zoomed in, where the zoom moved it.
  // Floors pushed off the edge stack up there in order, never overlapping.
  const middle = (i) => middleOf(FLOOR_Y[i]) / IMG.height;
  const ys = levels.map((l, i) => (level ? zoomY(middle(i), level.level) : middle(i)));
  const gap = 0.16;   // a card is about 14% of the picture's height
  for (let i = 0; i < ys.length; i += 1) ys[i] = Math.min(ys[i], 0.92, i > 0 ? ys[i - 1] - gap : 1);
  for (let i = ys.length - 1; i >= 0; i -= 1) ys[i] = Math.max(ys[i], 0.08, i < ys.length - 1 ? ys[i + 1] + gap : 0);
  return (
    <nav aria-label="Floors" className="absolute inset-y-0 right-full mr-4 w-48">
      {levels.map((l, i) => {
        const current = level?.level === l.level || aimed === l.level;
        return (
          <button key={l.level} type="button" aria-current={level?.level === l.level ? 'page' : undefined}
            onClick={() => onOpen(l)} onMouseEnter={() => onAim(l.level)} onMouseLeave={() => onAim(null)}
            style={{ top: `${ys[i] * 100}%`, '--i': 8 + (levels.length - l.level) }}
            className={`rise-in absolute left-0 flex w-full -translate-y-1/2 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-[top,background-color,border-color] duration-700 ease-move ${
              current ? 'border-accent-500 bg-accent-50' : 'border-line bg-surface hover:border-brand-400'}`}>
            <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-2xl font-semibold transition-colors duration-500 ${l.open ? 'bg-accent-400 text-ink' : 'bg-brand-900 text-paper'}`}>{l.level}</span>
            <span className="min-w-0 leading-tight">
              <span className="block text-base font-semibold text-ink">Floor {l.level}</span>
              <span className={`block text-sm font-medium ${l.open ? 'text-accent-700' : 'text-muted'}`}>{l.open ? `${l.open} open` : 'Lights off'}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// The day picture with the night picture laid over every space that has no opening, cut exactly to that
// space's interior, so its lamps go out. On arrival every light starts off and they come on floor by floor.
// Opening a floor zooms onto it and darkens the rest.
function Library({ levels, level, openIds, aimed, hovered, onAim, onOpen, onHover, onPick }) {
  const [powered, setPowered] = useState(false);   // false on the first frame: everything dark, then the switch-on
  const [settled, setSettled] = useState(false);   // after the switch-on, changes happen without the stagger
  useEffect(() => {
    const on = setTimeout(() => setPowered(true), 450);
    const done = setTimeout(() => setSettled(true), 2200);
    return () => { clearTimeout(on); clearTimeout(done); };
  }, []);

  let transform = 'none';
  if (level) {
    // scale about the centre, after a shift that brings the floor to FLOOR_AT and the rooms to the middle
    const cy = middleOf(FLOOR_Y[level.level - 1]) / IMG.height;
    transform = `scale(${ZOOM}) translate(${(0.5 - CX) * 100}%, ${((FLOOR_AT - 0.5) / ZOOM + 0.5 - cy) * 100}%)`;
  }
  const isLit = (space) => ALWAYS_LIT.includes(space.label) || (space.id && openIds.has(space.id));

  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl">
      <div className="h-full transition-transform duration-700 ease-move" style={{ transform }}>
        <svg viewBox={`0 0 ${IMG.width} ${IMG.height}`} className="block h-full w-full" role="group" aria-label="The library, cut open to show its five floors">
          <defs>
            {/* one clip per space: its interior only, between the posts and the slabs */}
            {levels.map((l, i) => CELL_X.map(([x1, x2], k) => (
              <clipPath key={`${l.level}-${k}`} id={`space-${l.level}-${k}`}>
                <polygon points={quad(i, x1, x2)} />
              </clipPath>
            )))}
          </defs>
          <image href={picture('library')} width={IMG.width} height={IMG.height} />
          {levels.map((l) => l.spaces.map((space, k) => (
            <image key={`${l.level}-${k}`} href={picture('library-night')} width={IMG.width} height={IMG.height} clipPath={`url(#space-${l.level}-${k})`}
              className="pointer-events-none transition-opacity duration-500"
              style={{ opacity: powered && isLit(space) ? 0 : 1, transitionDelay: settled ? '0ms' : `${(l.level - 1) * 180 + k * 80}ms` }} />
          )))}

          {levels.map((l, i) => {
            if (level && level.level !== l.level) {
              return <polygon key={l.level} points={quad(i, BUILDING_X[0], BUILDING_X[1])} className="pointer-events-none fill-paper/70" />;
            }
            if (level) return <Spaces key={l.level} l={l} i={i} openIds={openIds} hovered={hovered} onHover={onHover} onPick={onPick} />;
            return (
              <polygon key={l.level} points={quad(i, EDGE_X[0], EDGE_X[1])} role="button" tabIndex={0} aria-label={`Floor ${l.level}: ${l.open ? `${l.open} rooms open` : 'nothing open'}`}
                onClick={() => onOpen(l)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(l); } }}
                onMouseEnter={() => onAim(l.level)} onMouseLeave={() => onAim(null)}
                className={`cursor-pointer outline-none transition-[stroke,fill] duration-200 focus-visible:stroke-accent-500 ${aimed === l.level ? 'fill-accent-200/10 stroke-accent-500' : 'fill-transparent stroke-transparent'}`}
                strokeWidth="4" />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// An opened floor's spaces: each room an outline you can hover, with a small chip in its corner.
function Spaces({ l, i, openIds, hovered, onHover, onPick }) {
  return (
    <g>
      {l.spaces.map((space, k) => {
        const [x1, x2] = CELL_X[k];
        const top = yAt(i, x1 + 14, 0);   // the chip sits at the room's top-left corner, on the slope
        if (!space.id) {
          return (
            <g key={k} className="pointer-events-none">
              <rect x={x1 + 14} y={top + 8} width={space.label.length * 6.5 + 18} height="20" rx="10" className="fill-surface" />
              <text x={x1 + 23} y={top + 22} className="fill-ink text-[11px]">{space.label}</text>
            </g>
          );
        }
        const off = space.status === 'out-of-service';
        const on = openIds.has(space.id);
        const isHovered = hovered?.id === space.id;
        const label = `${shortName(space)}${off ? ' · closed' : on ? '' : ' · taken'}`;
        return (
          <g key={space.id} role="button" tabIndex={0} aria-label={`${space.name}: ${off ? 'closed' : on ? 'open' : 'taken'}`}
            onMouseEnter={() => onHover(space)} onFocus={() => onHover(space)} onClick={() => onPick(space)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(space); } }} className="cursor-pointer outline-none">
            <polygon points={quad(i, x1, x2, 2)} strokeLinejoin="round"
              className={`transition-[fill,stroke] duration-200 ${isHovered ? 'fill-accent-200/15 stroke-accent-500' : 'fill-transparent stroke-transparent'}`}
              strokeWidth="3" />
            <rect x={x1 + 14} y={top + 8} width={label.length * 6.8 + 26} height="21" rx="10.5" className={on ? 'fill-surface' : 'fill-brand-900'} />
            <circle cx={x1 + 25} cy={top + 18.5} r="3.5" className={off ? 'fill-paper/60' : on ? 'fill-accent-500' : 'fill-paper/60'} />
            <text x={x1 + 33} y={top + 23} className={`font-display text-[12px] font-semibold ${on ? 'fill-ink' : 'fill-paper'}`}>{label}</text>
          </g>
        );
      })}
    </g>
  );
}

// Pops up above the room under the pointer: its picture, its details and every opening as a Book link.
// Placed in the zoomed picture's coordinates, so it sits on top of that room.
function RoomPopover({ room, level, list, today, onPick }) {
  const k = LAYOUT[level.level - 1].indexOf(room.id);
  const x = zoomX(middleOf(CELL_X[k]) / IMG.width);
  const y = zoomY(yAt(level.level - 1, middleOf(CELL_X[k]), 0) / IMG.height, level.level);
  const off = room.status === 'out-of-service';
  const [src, setSrc] = useState(picture(`rooms/${room.id}`));
  return (
    <div className="room-pop absolute z-20 w-64 -translate-x-1/2 -translate-y-full"
      style={{ left: `${Math.min(Math.max(x * 100, 22), 78)}%`, top: `calc(${y * 100}% - 12px)` }}>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface text-ink">
        <img src={src} onError={() => setSrc(`${import.meta.env.BASE_URL}${room.photo}`)} alt={`${room.name}, illustration`} className="aspect-[16/9] w-full bg-paper object-cover" />
        <div className="space-y-2 p-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-lg font-semibold leading-tight tracking-tight">{room.name}</p>
            <span className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${off ? 'border-ink/15 text-muted' : list.length ? 'border-accent-500 bg-accent-100 text-accent-900' : 'border-brand-800 bg-brand-800 text-paper'}`}>
              {off ? 'Closed' : list.length ? `${list.length} open` : 'Taken'}
            </span>
          </div>
          <p className="text-xs text-muted">Floor {level.level} · {room.capacity} seats · {room.amenities.length ? room.amenities.join(', ') : 'no amenities'}</p>
          {!off && list.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {list.slice(0, 6).map(({ day, start }) => (
                <li key={`${day}${start}`}>
                  <button type="button" onClick={() => onPick(room, { day, start })}
                    className="inline-flex rounded-md border border-accent-500 bg-accent-50 px-2 py-1 text-[11px] font-medium text-accent-900 transition-colors hover:bg-accent-100">
                    {longDay(day, today)} · {slotName(start / 60)}
                  </button>
                </li>
              ))}
              {list.length > 6 && <li className="px-1 py-1 text-[11px] text-muted">+{list.length - 6} more</li>}
            </ul>
          )}
          {!off && list.length === 0 && <p className="text-sm text-muted">Taken in every hour you picked.</p>}
        </div>
      </div>
      <span aria-hidden="true" className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-line bg-surface" />
    </div>
  );
}

// The confirm, on the browser's own <dialog> (as ConfirmDialog): which opening, what for, how many of you.
// Confirm books it; a house-rule refusal (one upcoming booking a day) is said here, in its own words.
function BookDialog({ ask, list, level, today, signedIn, onCancel, onConfirm }) {
  const ref = useRef(null);
  const { room } = ask;
  const [opening, setOpening] = useState(ask.opening);
  const [purpose, setPurpose] = useState('Group study');
  const [people, setPeople] = useState(Math.min(2, room.capacity));
  const [error, setError] = useState('');
  useEffect(() => { ref.current.showModal(); }, []);
  const off = room.status === 'out-of-service';
  const ready = signedIn && !off && opening && purpose.trim();
  function submit(e) {
    e.preventDefault();
    const result = onConfirm({ room, opening, purpose: purpose.trim(), people });
    if (!result.ok) setError(result.problems[0].message);
  }
  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); onCancel(); }} onClick={(e) => { if (e.target === ref.current) onCancel(); }}
      className="sheet m-auto w-[min(32rem,calc(100%-2rem))] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink">
      <form onSubmit={submit}>
        <img src={picture(`rooms/${room.id}`)} alt={`${room.name}, illustration`} className="aspect-[21/9] w-full object-cover" />
        <div className="space-y-4 p-6">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Book {room.name}?</h2>
            <p className="mt-1 text-sm text-muted">Floor {level.level} · {room.capacity} seats · {room.amenities.length ? room.amenities.join(', ') : 'no amenities'}</p>
          </div>
          {!signedIn && <p className="rounded-lg bg-accent-50 p-3 text-sm text-accent-900">Sign in first (the demo controls in the header), then book.</p>}
          {off && <p className="rounded-lg bg-paper p-3 text-sm text-muted">This room is out of service and cannot be booked.</p>}
          {!off && list.length === 0 && <p className="rounded-lg bg-paper p-3 text-sm text-muted">It is taken in every hour you picked.</p>}
          {!off && list.length > 0 && (
            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">When</legend>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {list.map((o) => {
                  const on = opening && o.day === opening.day && o.start === opening.start;
                  return (
                    <button key={`${o.day}${o.start}`} type="button" aria-pressed={on} onClick={() => { setOpening(o); setError(''); }}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${on ? 'border-accent-600 bg-accent-400 text-ink' : 'border-line bg-paper text-ink hover:border-accent-500'}`}>
                      {longDay(o.day, today)} · {slotName(o.start / 60)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
          <div className="grid grid-cols-[1fr_8rem] gap-3">
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">What for
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={80}
                className="mt-1.5 w-full rounded-lg border border-ink/20 bg-surface px-3 py-2 text-sm normal-case tracking-normal text-ink" />
            </label>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">How many
              <select value={people} onChange={(e) => setPeople(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-ink/20 bg-surface px-3 py-2 text-sm normal-case tracking-normal text-ink">
                {Array.from({ length: room.capacity }, (_, n) => <option key={n + 1} value={n + 1}>{n + 1}</option>)}
              </select>
            </label>
          </div>
          {error && <p role="alert" className="rounded-lg border-l-4 border-red-600 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button type="button" onClick={onCancel} className="rounded-lg border border-ink/20 bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-brand-50">Not now</button>
          <button type="submit" disabled={!ready} className="rounded-lg bg-brand-800 px-5 py-2 text-sm font-semibold text-paper transition-[background-color,scale] hover:bg-brand-900 active:scale-[0.96] disabled:opacity-40">
            Confirm booking
          </button>
        </div>
      </form>
    </dialog>
  );
}

// After Confirm: the whole window says what was booked, with everything you need to know about it.
function DoneScreen({ booking, room, today, onAgain }) {
  const day = dateKey(booking.start);
  const start = new Date(booking.start);
  const end = new Date(booking.end);
  const minutes = (end - start) / 60000;
  const level = LAYOUT.findIndex((ids) => ids.includes(room.id)) + 1;
  const facts = [
    ['Day', new Date(`${day}T12:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + (day === today ? ' (today)' : '')],
    ['Time', `${ampm(start.getHours() * 60 + start.getMinutes())}–${ampm(end.getHours() * 60 + end.getMinutes())} · ${minutes / 60} ${minutes === 60 ? 'hour' : 'hours'}`],
    ['Room', `${room.name}, floor ${level}`],
    ['Seats', `${booking.attendees} of ${room.capacity}`],
    ['Equipment', room.amenities.length ? room.amenities.join(', ') : 'none'],
    ['What for', booking.purpose],
    ['Booking', booking.id.toUpperCase()],
  ];
  return (
    <div className="grid flex-1 items-center gap-8 lg:min-h-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <img src={picture(`rooms/${room.id}`)} alt={`${room.name}, illustration`} className="building-in max-h-full w-full rounded-2xl border border-line object-cover lg:h-full" />
      <div className="rise-in rounded-2xl border border-line bg-surface p-8" style={{ '--i': 2 }}>
        <span aria-hidden="true" className="tick flex h-12 w-12 items-center justify-center rounded-full bg-accent-400 text-2xl font-bold text-ink">✓</span>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink">{room.name} is yours.</h1>
        <p className="mt-2 text-muted">It is in My bookings, where you can change or cancel it until it starts.</p>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {facts.map(([name, value], i) => (
            <div key={name} className="rise-in flex justify-between gap-6 py-2.5 text-sm" style={{ '--i': 3 + i }}>
              <dt className="text-muted">{name}</dt>
              <dd className="text-right font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link to="/my-bookings" className="rounded-xl bg-brand-800 px-4 py-3 text-center text-sm font-semibold text-paper hover:bg-brand-900">See my bookings</Link>
          <button type="button" onClick={onAgain} className="rounded-xl border border-ink/20 bg-surface px-4 py-3 text-sm font-semibold text-ink hover:bg-brand-50">Book another</button>
        </div>
      </div>
    </div>
  );
}
