import { busiest, busyHours } from '../lib/busyHours.js';

// When the library is busiest: one row per weekday, one square per hour, darker when more rooms were booked.
// Adapted from 21st.dev/@starc007/heat-calendar (a one-colour grid with a Quiet-to-Busy legend), turned
// from days of the year into weekdays by hours. The grid is a picture; screen readers get the sentence.
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LONG_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHADES = ['bg-brand-100', 'bg-brand-200', 'bg-brand-400', 'bg-brand-600', 'bg-brand-800'];
const hourName = (hour) => `${String(8 + hour).padStart(2, '0')}:00`;

export default function BusyHours({ bookings }) {
  const counts = busyHours(bookings);
  const most = busiest(counts);
  const max = most ? most.count : 1;
  const shade = (count) => (count === 0 ? 'bg-paper' : SHADES[Math.ceil((count / max) * SHADES.length) - 1]);

  return (
    <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="busy-title">
      <h2 id="busy-title" className="font-display text-xl font-semibold tracking-tight text-ink">When rooms are busiest</h2>
      <p className="mt-1 text-sm text-muted">
        {most ? `Busiest: ${LONG_DAYS[most.day]}s from ${hourName(most.hour)}, with ${most.count} rooms booked.` : 'Nothing is booked yet.'} Every booking in the library, by weekday and hour.
      </p>
      <div className="mt-4" aria-hidden="true">
        <div className="ml-9 grid grid-cols-14 gap-0.5 sm:gap-1">
          {counts[0].map((_, hour) => <span key={hour} className="font-mono text-[9px] text-muted/70 sm:text-[10px]">{hour % 2 === 0 ? hourName(hour).slice(0, 2) : ''}</span>)}
        </div>
        {counts.map((row, day) => (
          <div key={DAYS[day]} className="mt-0.5 flex items-center gap-1 sm:mt-1">
            <span className="w-8 flex-none font-mono text-[10px] text-muted">{DAYS[day]}</span>
            <div className="grid flex-1 grid-cols-14 gap-0.5 sm:gap-1">
              {row.map((count, hour) => (
                <span key={hour} title={`${LONG_DAYS[day]} ${hourName(hour)}: ${count} booked`} className={`h-5 rounded-sm border border-line/60 ${shade(count)}`} />
              ))}
            </div>
          </div>
        ))}
        <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-muted">
          Quiet {['bg-paper', ...SHADES].map((c) => <span key={c} className={`h-3 w-4 rounded-sm border border-line/60 ${c}`} />)} Busy
        </div>
      </div>
    </section>
  );
}
