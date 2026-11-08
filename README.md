# Study Room Booking

CSC443 Web Programming, Fall 2026, Section 31. Phase 1 (front end) is due Monday 9 November 2026 at 23:59.

**Live site:** https://andrewwehbe.github.io/csc443-project/

## Team

Team name: **Not_vibeCoding**

| Member | Student ID |
| --- | --- |
| Elio El Koussa | 202400659 |
| Njteh Balian | 202402285 |
| Marc Hebbo | 202307801 |
| Andrew Wehbe | 202202056 |

## Topic

Topic 02, Study Room Booking. Brief reference code: `CSC443-F26 · T02 · rev A`.

The library's group study rooms are claimed by whoever gets there first. This application lets students see which rooms are free and book one for a time slot.

## Entities and fields

These are the minimum fields from the topic spec. Fields we add are listed here as we add them.

- **User**: name, email, student ID, password hash (Phase 2).
- **Room** (reference data, nobody creates or edits it): name, building, floor, capacity, amenities (whiteboard, screen, power), status (`open` or `out-of-service`), photo. Study Room 201 is out of service: it still appears everywhere, but no booking of it is accepted.
- **Booking** (owned by the user who made it): room, user, start time, end time, purpose, expected attendees, status (`confirmed`, `cancelled`, `completed`).
  - Stored as `{ id, roomId, userId, start, end, purpose, attendees, status }`; `start` and `end` are ISO date strings.
  - The booking form adds these limits: the start must still be in the future, the end comes after the start on the same day, attendees is a whole number from 1 to the room's capacity, and the purpose is required and at most 80 characters.
  - A confirmed booking whose end has passed is shown as `completed`.

**Ownership rule.** A user changes or cancels only their own bookings.

**House rule.** A booking attempt fails, with a message naming the broken rule and why, when:

1. it overlaps another confirmed booking of the same room, even by one minute;
2. it is longer than two hours;
3. the user already holds a confirmed future booking on that day (one per user per day).

The booking form warns about a conflict before the user submits, not only after. An availability view shows every room on a chosen day as a timeline of booked and free blocks.

## Who owns what

Each member owns two surfaces (a surface is a screen with its own route). We follow the design pack's own pairing: 01 + 02, 03 + 04, 05 + 06, 07 + 08. This table is what the individual examination is built from, so it must stay accurate: when you add a file to your screens, add it to your row.

| Member | Surfaces (routes) | Files |
| --- | --- | --- |
| Njteh Balian | 01 Today (`/`), 02 Availability (`/availability`) | `src/pages/AvailabilityPage.jsx`, `src/lib/availabilityFilters.js` and its test; Today to come |
| Elio El Koussa | 03 Room detail (`/rooms/:roomId`), 04 The floor (`/rooms`) | `src/pages/RoomPage.jsx`, `src/lib/roomDetail.js` and its test, `src/pages/FloorPage.jsx`, `src/lib/floor.js` and its test. Also the shared day timeline and room status words (see Shared code) |
| Andrew Wehbe | 05 Book a room (`/bookings/new`, and `/bookings/:bookingId/edit` to change a saved booking), 06 My bookings (`/my-bookings`) | `src/pages/NewBookingPage.jsx`, `src/pages/EditBookingPage.jsx`, `src/pages/MyBookingsPage.jsx`, `src/components/BookingForm.jsx`, `src/components/Field.jsx`, `src/lib/bookingForm.js` and its test, `src/lib/buttons.js`, `src/hooks/useUnsavedChangesWarning.js` |
| Marc Hebbo | 07 History (`/my-bookings/history`), 08 Sign in and register (`/sign-in`, `/register`) | to come |

Shared files: `src/main.jsx` (router), `src/App.jsx` (routes), `src/components/Layout.jsx` (navigation shell). Andrew also wrote the shared code listed below.

### Routes

Use these paths so the screens can link to each other (a booking links to its room, a room to its bookings, and so on). If you give your screen a different path, change it here in the same pull request, because other screens already link to these.

| Path | Surface (design pack file) | Owner |
| --- | --- | --- |
| `/` | 01 Today: what is free now, and the three rules (`01-today.html`) | Njteh |
| `/availability` | 02 Availability: every room across a day (`02-availability.html`) | Njteh |
| `/rooms/:roomId` | 03 Room detail: one room and its week (`03-room.html`) | Elio |
| `/rooms` | 04 The floor: every room, including the one out of service (`04-building.html`) | Elio |
| `/bookings/new` | 05 Book a room (`05-book.html`) | Andrew |
| `/bookings/:bookingId/edit` | 05 Book a room, changing a saved booking | Andrew |
| `/my-bookings` | 06 My bookings, the Upcoming tab (`06-bookings.html`) | Andrew |
| `/my-bookings/history` | 07 History, the History tab of My bookings (`07-history.html`) | Marc |
| `/sign-in`, `/register` | 08 Sign in and register (`08-auth.html`) | Marc |

**Opening the booking form already filled in.** Add any of `room`, `date`, `start` and `end` to the address, for example `/bookings/new?room=r3&date=2026-11-12&start=14:00&end=15:30`. Use this for "Book this room" on a room page and for a free slot on the availability timeline. A value that does not fit shows up as an error in the form.

**Change links.** An owner's Change button (as on My bookings and Room detail) goes to `/bookings/<id>/edit`. That page asks `isOwner` itself, so another student or someone signed out who opens the link sees a message instead of the form.

## Mock data

Phase 1 has no server. The data lives in `src/data/` and is held in React state in `src/App.jsx`. Adding or editing a booking updates that state; reloading the page resets it. This is expected for Phase 1 (the brief forbids `localStorage`).

- `src/data/users.js`: 8 demo accounts.
- `src/data/rooms.js`: 12 rooms in two buildings. Rooms are reference data: nobody creates or edits them.
- `src/data/bookings.js`: 48 bookings, the main entity. Their days are counted from today, so the timeline always has bookings on it whenever the app is opened. `npm test` checks that every seed booking obeys the house rules.
- `public/rooms/*.svg`: the room pictures are drawn floor plans, not real photographs.

## Shared code (use it, don't copy it)

Everything below is used by several surfaces. Change it only after telling the team.

| What | File | How to use it |
| --- | --- | --- |
| Shared state | `src/App.jsx` | App holds `currentUser`, `bookings` and the demo data mode, and passes them to each route as props: `rooms`, `users`, `bookings`, `currentUser`, `simulation`. |
| Changing bookings | `src/hooks/useBookings.js` | `addBooking(draft)`, `updateBooking(id, changes)`, `cancelBooking(id)`. Each returns `{ ok: true, booking }` or `{ ok: false, problems }`. They refuse anything that breaks a house rule or is not the user's own booking, so no screen can get around a rule. |
| House rules | `src/lib/bookingRules.js` | `checkHouseRules(draft, bookings)` returns a list of `{ rule, message }` (empty = allowed). Call it while the user types to warn about a conflict before submit. `effectiveStatus(booking)` turns a confirmed booking that has ended into `completed`. |
| "Is this mine?" | `src/lib/ownership.js` | `isOwner(booking, currentUser)`. Ask it before showing Edit or Cancel. |
| Dates | `src/lib/time.js` | `formatTime`, `formatDate`, `formatDuration`, `dateKey`, `atTime`, plus `timeKey` and `toISO` for date and time inputs. |
| Router | `src/main.jsx` | A data router (`createBrowserRouter`), because only a data router can hold back a route change; the booking form needs that for its unsaved-changes warning. Its single route hands every address to `App`, so pages are still added as `<Route>`s in `src/App.jsx`. |
| The four data states | `src/hooks/useSimulatedRequest.js` + `src/components/states/` | `const { status, data, retry } = useSimulatedRequest(myData, simulation)`, then render `LoadingState`, `ErrorState` (with `onRetry={retry}`), `EmptyState` or your data. `src/pages/HomePage.jsx` shows the pattern. The three boxes are styled like the pack's states in `02-availability.html`. |
| Demo bar | `src/components/DemoBar.jsx` | The dark bar at the top: switch who is signed in (including nobody) and force Normal, Slow, Empty or Error data. This is how the owner / other user / signed-out views and all four states are reachable in Phase 1. |
| Day timeline (Elio) | `src/components/DayTimeline.jsx`, geometry in `src/lib/timeline.js` | `<DayTimeline bookings={roomBookings} date="2026-11-12" currentUser={currentUser} />` draws one room's day, 08:00 to 22:00. `bookings`: that room's bookings (only `date`'s are drawn, cancelled ones skipped; leave out the booking being edited). `currentUser`: their bookings show as "yours", nobody else's name is shown. `chosen={{ start, end }}`: a time being picked, drawn on top. `clash`: draw `chosen` in red over the booking it hits. `hours` (default on): the 08 … 21 header. `legend`: the colour key. `label`: a name like "B-204 · Thursday" for the phone list and screen readers. Below `md` it is a list of hours. |
| Buttons (Andrew) | `src/lib/buttons.js` | The pack's buttons from `components.html`: `buttonClass('primary')`, `buttonClass('secondary', 'small')`, `buttonClass('quiet')`. One primary per screen. |
| Room status words (Elio) | `src/lib/roomStatus.js` | `roomStatus(room, bookings, date, currentUser)` returns `{ word, tone }` for a chip, e.g. `Free all day`, `Free from 15:00`, `Free until 17:00`, `Two gaps`, `Fully booked`, `Yours until 16:00`, `Out of service`; `null` for a day that is over. Only what is ahead of now counts. Draw it as `<span className={statusChipClass(status.tone)}>{status.word}</span>`. |
| Ghurfa colours and fonts | `src/index.css`, fonts in `src/assets/fonts/` | The design pack's skin, as given. Colours: `paper` (page), `surface` (cards and fields), `ink`, `muted`, `line`, `brand-50` to `brand-900` (navy) and `accent-50` to `accent-900` (ochre), so `bg-paper`, `text-muted`, `border-line`, `bg-brand-800` and so on. Fonts: `font-display` (Fraunces, for headings and room names) and `font-body` (IBM Plex Sans, the default). Use these names instead of fixed colours, so the skin changes in one place. |

## Tests

`npm test` runs every `*.test.js` file with Node's built-in test runner:

- `src/lib/bookingRules.test.js`: overlaps (touching ends allowed, one minute refused), the 2-hour limit, one booking per day, an out-of-service room, editing a booking without clashing with itself, and the seed data.
- `src/lib/bookingForm.test.js`: the booking form's field checks (missing fields, a time that has passed, end before start, capacity), filling the form from the address, and turning a booking into form values and back, and the nearest free stretch offered when a time clashes.
- `src/lib/timeline.js`'s test: segment and gap widths (matching the design pack), clipping to 08:00-22:00, the overlay position of a chosen time or clash, and the hour-by-hour list used on phones.
- `src/lib/roomStatus.test.js`: each status word (the pack's rooms B-204, B-206 and C-101), bookings that are over or cancelled, who is looking, a later day, out of service, and a day that is over.
- `src/lib/roomDetail.test.js`: the Room detail week (Monday to Sunday, `?week=` read safely), the signed-in user's next booking of a room, and how its day is written.
- `src/lib/floor.test.js`: The floor's list of floors, the floor read from the address (a missing or bad one opens the first floor), the rooms on a floor, and its title and room count.

## Run it locally

You need Git and Node.js 24 (22.22 or newer also works; React Router refuses older versions). Check with `node -v`.

```bash
git clone https://github.com/andrewwehbe/csc443-project.git
cd csc443-project
npm install
npm run dev
```

Then open the address Vite prints (http://localhost:5173/csc443-project/).

`npm run build` makes the production files in `dist/`. `npm run preview` serves that build locally.

## How we work with Git

- `main` always runs. Nobody pushes broken code to it.
- Work on a branch named after the change, for example `rooms-list` or `booking-detail`.
- Commit messages say what changed and why, for example `Add building and floor filters kept in the URL`. Never just `fix` or `update`.
- Open a pull request into `main`; merge it once it runs.

```bash
git checkout main
git pull
git checkout -b rooms-list
# ...work, then:
git add src/pages/RoomsPage.jsx src/App.jsx
git commit -m "Add the rooms list with its search kept in the URL"
git push -u origin rooms-list
```

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes it to GitHub Pages.

Two settings make the app work on GitHub Pages:

1. `base: '/csc443-project/'` in `vite.config.js`, because the site lives under the repository name and not at the root of the domain. The router in `src/main.jsx` uses the same value as its `basename`.
2. A `404.html` that is a copy of `index.html`. GitHub Pages has no file for a route like `/csc443-project/rides/12`, so it serves `404.html`. Because that file is the app, React loads, React Router reads the URL and shows the right page. Without it, refreshing any page other than the home page shows GitHub's own 404 page.

## Screenshots

_To be added._
