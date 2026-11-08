import { Link, useSearchParams } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { floorParams, floorsOf, floorTitle, readFloor, roomCount, roomsOnFloor } from '../lib/floor.js';
import { floorName } from '../lib/roomDetail.js';
import { roomStatus, statusChipClass } from '../lib/roomStatus.js';
import { dateKey } from '../lib/time.js';
import DayTimeline from '../components/DayTimeline.jsx';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';

// Surface: The floor, at /rooms (design pack 04-building.html). Owner: Elio El Koussa.
// One floor at a time: every room on it, with today's status and timeline. Each card opens the room.
// The chosen floor lives in the address (?building=main&floor=2), so it can be shared and survives a reload.

export default function FloorPage({ rooms, bookings, currentUser, simulation }) {
  const [searchParams] = useSearchParams();
  const chosen = readFloor(searchParams, rooms);
  const { status, data, retry } = useSimulatedRequest(roomsOnFloor(rooms, chosen), simulation);
  const title = floorTitle(chosen);

  return (
    <div>
      <nav className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ink">Ghurfa</Link> <span className="text-accent-600" aria-hidden="true">/</span>{' '}
        <span aria-current="page">{title}</span>
      </nav>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink">{title}</h1>

      <FloorPicker rooms={rooms} chosen={chosen} />

      <div className="mt-7">
        {status === 'loading' && <LoadingState label="Loading the rooms on this floor" />}
        {status === 'error' && <ErrorState message="We could not load the rooms on this floor." onRetry={retry} />}
        {status === 'empty' && (
          <EmptyState
            title="No rooms on this floor"
            message="There are no bookable rooms here right now. Pick another floor above."
          />
        )}
        {status === 'ready' && (
          <>
            <p className="max-w-prose text-sm text-muted">
              {roomCount(data.length)}. Capacity and equipment are fixed by the library; pick a room to see its week and book it.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((room) => (
                <RoomCard key={room.id} room={room} bookings={bookings} currentUser={currentUser} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Every floor of every building, as links, so changing floor is a change of address the back button undoes.
function FloorPicker({ rooms, chosen }) {
  const floors = floorsOf(rooms);
  const buildings = [...new Set(floors.map((f) => f.building))];
  return (
    <nav className="mt-5 flex flex-wrap gap-x-8 gap-y-3" aria-label="Floors">
      {buildings.map((building) => (
        <div key={building} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{building}</span>
          {floors.filter((f) => f.building === building).map((f) => {
            const current = f.building === chosen.building && f.floor === chosen.floor;
            return (
              <Link
                key={f.floor}
                to={`/rooms?${floorParams(f)}`}
                aria-current={current ? 'page' : undefined}
                className={`pb-1 text-sm ${current ? 'border-b-2 border-accent-500 font-semibold text-ink' : 'text-muted hover:text-ink'}`}
              >
                {floorName(f.floor).replace(/^./, (c) => c.toUpperCase())}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function RoomCard({ room, bookings, currentUser }) {
  const now = new Date();
  const today = dateKey(now.toISOString());
  const outOfService = room.status === 'out-of-service';
  // After 22:00 the day has no status left; the room is simply closed until tomorrow.
  const status = roomStatus(room, bookings, today, currentUser, now) ?? { word: 'Closed', tone: 'off' };

  return (
    <Link to={`/rooms/${room.id}`} className="block border border-line bg-surface p-5 transition hover:border-brand-400">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{room.name}</h2>
        <span className={statusChipClass(status.tone)}>{status.word}</span>
      </div>
      <p className="mt-1.5 text-sm text-muted">Seats {room.capacity}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Amenities">
        {room.amenities.length === 0 && <li className={statusChipClass('off')}>No amenities</li>}
        {room.amenities.map((amenity) => (
          <li key={amenity} className={statusChipClass('free')}>{amenity}</li>
        ))}
      </ul>
      <div className="mt-4">
        {outOfService ? (
          // A room out of service still appears, but its whole day is closed: it accepts nothing.
          <div className="h-8 overflow-hidden rounded-[2px] border border-line bg-paper p-0.5">
            <div className="flex h-full gap-px">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[1px] px-1 text-[11px] font-medium leading-none bg-brand-200 text-brand-900" title="08:00–22:00">
                Closed all day
              </div>
            </div>
          </div>
        ) : (
          <DayTimeline bookings={bookings.filter((b) => b.roomId === room.id)} date={today} currentUser={currentUser} hours={false} label="Today" />
        )}
      </div>
    </Link>
  );
}
