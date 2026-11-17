import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AMENITIES } from '../data/rooms.js';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import {
  digitsOnly,
  filterRooms,
  filtersToParams,
  formatLongDay,
  parseCapacity,
  readFilters,
  shiftDay,
} from '../lib/availabilityFilters.js';
import { roomStatus, statusChipClass } from '../lib/roomStatus.js';
import DayTimeline, { TimelineLegend } from '../components/DayTimeline.jsx';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-muted';
const inputClass =
  'w-full rounded-lg border border-ink/20 bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100';
const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const outlineButton = `${buttonClass} border border-ink/20 bg-surface text-ink hover:bg-brand-50`;
const quietButton = `${buttonClass} text-muted hover:bg-brand-50 hover:text-ink`;

const capitalise = (word) => word[0].toUpperCase() + word.slice(1);

// Keeps what's being typed: the URL updates a moment later, and resetting
// the field in between would break typing key by key.
function LiveInput({ value, onChange, clean = (text) => text, ...inputProps }) {
  const [typed, setTyped] = useState(value);
  useEffect(() => setTyped(value), [value]);

  function handleChange(e) {
    const text = clean(e.target.value);
    setTyped(text);
    onChange(text);
  }

  // On leaving the field, drop anything that wasn't applied.
  return <input {...inputProps} value={typed} onChange={handleChange} onBlur={() => setTyped(value)} />;
}

// A dropdown of tick boxes, so several amenities can be picked at once.
function AmenityDropdown({ selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const summary = selected.length > 1 ? `${selected.length} selected` : capitalise(selected[0] ?? 'anything');

  // While open: a click or focus elsewhere closes it, and so does Escape.
  useEffect(() => {
    if (!open) return;
    const closeIfOutside = (e) => {
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    const closeOnEscape = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      rootRef.current.querySelector('button').focus();
    };
    document.addEventListener('pointerdown', closeIfOutside);
    document.addEventListener('focusin', closeIfOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside);
      document.removeEventListener('focusin', closeIfOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex w-40 flex-col gap-1.5">
      <label htmlFor="amenity" className={labelClass}>Must have</label>
      <button id="amenity" type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={`${inputClass} flex items-center justify-between text-left`}>
        {summary}
        <svg aria-hidden="true" viewBox="0 0 12 12" className={`h-3 w-3 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      {open && (
        // The fallback keeps the list opaque until the Ghurfa theme defines surface.
        <div role="group" aria-label="Must have" className="pop-in absolute left-0 top-full z-10 mt-1 w-full origin-top rounded-lg border border-line bg-[var(--color-surface,white)] p-1">
          {AMENITIES.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink hover:bg-brand-50">
              <input type="checkbox" checked={selected.includes(amenity)} onChange={() => onToggle(amenity)} className="accent-brand-800" />
              {capitalise(amenity)}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// "At least" or "Exactly", joined into one control. Words, not ≥ and =, so nobody has to guess.
// The fallback keeps the text readable until the theme defines paper.
function MatchToggle({ exact, onChange }) {
  const choices = [
    { label: 'At least', value: false },
    { label: 'Exactly', value: true },
  ];

  return (
    <div role="group" aria-label="Capacity match" className="flex">
      {choices.map(({ label, value }, i) => (
        <button
          key={label}
          type="button"
          aria-pressed={exact === value}
          onClick={() => onChange(value)}
          className={`border px-3 py-2.5 text-sm ${i === 0 ? 'rounded-l-lg' : '-ml-px rounded-r-lg'} ${
            // The chosen one is tinted, not filled: a filled navy button would compete with the page's one primary.
            exact === value ? 'relative border-brand-800 bg-brand-50 font-semibold text-brand-900' : 'border-ink/20 bg-surface text-ink hover:bg-brand-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// Surface: 02 Availability, at /availability. Owner: Njteh Balian.
export default function AvailabilityPage({ rooms, bookings, currentUser, simulation }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const { status, data, retry } = useSimulatedRequest(rooms, simulation);
  const matches = status === 'ready' ? filterRooms(data, filters) : [];
  const filtered = filters.capacity > 0 || filters.amenities.length > 0;

  // replace: Back leaves the page instead of undoing one filter at a time.
  function update(changes) {
    setSearchParams(filtersToParams({ ...filters, ...changes }), { replace: true });
  }

  const clearFilters = () => update({ capacity: 0, exact: false, amenities: [] });

  function clearCapacity() {
    update({ capacity: 0 });
    document.getElementById('capacity').focus();   // the × is about to disappear
  }

  function toggleAmenity(amenity) {
    const { amenities } = filters;
    update({ amenities: amenities.includes(amenity) ? amenities.filter((a) => a !== amenity) : [...amenities, amenity] });
  }

  let content;
  if (status === 'loading') {
    content = <LoadingState label="Loading rooms" />;
  } else if (status === 'error') {
    content = (
      <ErrorState
        title="The bookings would not load"
        message="The server did not answer. This usually passes in a moment."
        onRetry={retry}
      />
    );
  } else if (matches.length === 0) {
    content = (
      <EmptyState
        title={filtered ? 'No room found that matches your filters' : 'No rooms to show'}
        message={filtered ? 'Clear the filters to see every room.' : 'The library has not listed any study rooms yet.'}
        action={filtered && <button type="button" onClick={clearFilters} className={outlineButton}>Clear filters</button>}
      />
    );
  } else {
    content = (
      <>
        <div className="mb-4 hidden md:block"><TimelineLegend canBook /></div>
        <ul className="space-y-3">
          {matches.map((room) => {
            // The chip and the bar are for the chosen day; a day already over has no chip.
            const status = roomStatus(room, bookings, filters.date, currentUser);
            const open = room.status !== 'out-of-service';
            return (
              <li key={room.id} className="rounded-xl border border-line bg-surface px-5 py-4">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                    <Link to={`/rooms/${room.id}`} className="hover:underline">{room.name}</Link>
                  </h2>
                  <p className="text-xs text-muted">{[`${room.capacity} people`, room.amenities.join(', ')].filter(Boolean).join(' · ')}</p>
                  <span className="flex-1" />
                  {status && <span className={statusChipClass(status.tone)}>{status.word}</span>}
                </div>
                {/* Phones get the chip and a Book link: twelve hour-by-hour lists would make the page endless. */}
                {open && (
                  <div className="mt-3 hidden md:block">
                    <DayTimeline bookings={bookings.filter((b) => b.roomId === room.id)} date={filters.date} currentUser={currentUser}
                      label={room.name} bookRoomId={room.id} />
                  </div>
                )}
                {open && status && (
                  <Link to={`/bookings/new?room=${room.id}&date=${filters.date}`} className={`${outlineButton} mt-3 md:hidden`}>Book this room</Link>
                )}
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return (
    <section>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">Availability</h1>
      <p className="mt-2 text-sm text-muted">{formatLongDay(filters.date)}</p>

      <div className="mt-6 space-y-5">
        <form onSubmit={(e) => e.preventDefault()} className="flex select-none flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4">
          <div className="flex items-end gap-2">
            <button type="button" aria-label="Previous day" onClick={() => update({ date: shiftDay(filters.date, -1) })} className={outlineButton}>
              &larr;
            </button>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="day" className={labelClass}>Day</label>
              {/* A half-typed date comes through empty: keep the current day until it's complete. */}
              <LiveInput id="day" type="date" value={filters.date} onChange={(date) => date && update({ date })} className={`${inputClass} w-44`} />
            </div>
            <button type="button" aria-label="Next day" onClick={() => update({ date: shiftDay(filters.date, 1) })} className={outlineButton}>
              &rarr;
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="capacity" className={labelClass}>Capacity</label>
            <div className="flex gap-2">
              <MatchToggle exact={filters.exact} onChange={(exact) => update({ exact })} />
              <div className="relative w-20">
                {/* Text, not number: browsers still let letters into a number field. */}
                <LiveInput
                  id="capacity"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength="3"
                  placeholder="Any"
                  clean={digitsOnly}
                  value={filters.capacity || ''}
                  onChange={(text) => update({ capacity: parseCapacity(text) })}
                  className={`${inputClass} pr-8`}
                />
                {filters.capacity > 0 && (
                  <button
                    type="button"
                    aria-label="Clear capacity"
                    title="Clear capacity"
                    onClick={clearCapacity}
                    className="hit-area absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-base leading-none text-muted hover:bg-brand-50 hover:text-ink"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          </div>

          <AmenityDropdown selected={filters.amenities} onToggle={toggleAmenity} />

          <button type="button" onClick={clearFilters} className={quietButton}>Clear</button>
          <span className="flex-1" />
          {status === 'ready' && (
            <span role="status" className="pb-2.5 text-sm font-semibold text-ink">
              {matches.length} {matches.length === 1 ? 'room matches' : 'rooms match'}
            </span>
          )}
        </form>

        {content}
      </div>
    </section>
  );
}
