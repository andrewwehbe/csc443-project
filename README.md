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
- **Room** (reference data, nobody creates or edits it): name, building, floor, capacity, amenities (whiteboard, screen, power), photo.
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

Each member owns two surfaces (a surface is a screen with its own route). This table is what the individual examination is built from, so it must stay accurate.

| Member | Surfaces (routes) | Files |
| --- | --- | --- |
| Elio El Koussa | | |
| Njteh Balian | | |
| Marc Hebbo | | |
| Andrew Wehbe | New booking (`/bookings/new`), Edit booking (`/bookings/:bookingId/edit`) | `src/pages/NewBookingPage.jsx`, `src/pages/EditBookingPage.jsx`, `src/components/booking-form/` (`BookingForm.jsx`, `Field.jsx`, `HouseRulesCheck.jsx`, `RoomDaySchedule.jsx`, `BookingSummary.jsx`, `Notice.jsx`, `UnsavedChangesDialog.jsx`), `src/lib/bookingForm.js` and its test, `src/hooks/useUnsavedChangesWarning.js` |

Shared files: `src/main.jsx` (router), `src/App.jsx` (routes), `src/components/Layout.jsx` (navigation shell). Andrew also wrote the shared code listed below.

### Routes

Use these paths so the screens can link to each other (a booking links to its room, a room to its bookings, and so on). If you give your screen a different path, change it here in the same pull request, because other screens already link to these.

| Path | Surface | Owner |
| --- | --- | --- |
| `/` | Home: which rooms are free right now | shared |
| `/rooms` | Rooms list | Elio |
| `/rooms/:roomId` | Room detail | Elio |
| `/availability` | Availability timeline for a chosen day | Njteh |
| `/users/:userId` | User profile | Njteh |
| `/bookings/:bookingId` | Booking detail | Marc |
| `/my-bookings` | My bookings | Marc |
| `/bookings/new` | New booking | Andrew |
| `/bookings/:bookingId/edit` | Edit booking | Andrew |

**Opening the booking form already filled in.** Add any of `room`, `date`, `start` and `end` to the address, for example `/bookings/new?room=r3&date=2026-11-12&start=14:00&end=15:30`. With a start and no end, the end is one hour later. Use this for "Book this room" on a room page and for a free slot on the availability timeline. Values that are missing or malformed are left empty.

**Edit links.** An owner's Edit button goes to `/bookings/<id>/edit`. That page asks `isOwner` itself, so another student or someone signed out who opens the link sees a message instead of the form.

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
| The four data states | `src/hooks/useSimulatedRequest.js` + `src/components/states/` | `const { status, data, retry } = useSimulatedRequest(myData, simulation)`, then render `LoadingState`, `ErrorState` (with `onRetry={retry}`), `EmptyState` or your data. `src/pages/HomePage.jsx` shows the pattern. |
| Demo bar | `src/components/DemoBar.jsx` | The dark bar at the top: switch who is signed in (including nobody) and force Normal, Slow, Empty or Error data. This is how the owner / other user / signed-out views and all four states are reachable in Phase 1. |
| Colours | `src/index.css` | `brand-50` to `brand-800`. Use `bg-brand-600`, `text-brand-700` and so on instead of a fixed colour, so the palette can change in one place. |

## Tests

`npm test` runs every `*.test.js` file with Node's built-in test runner:

- `src/lib/bookingRules.test.js`: overlaps (touching ends allowed, one minute refused), the 2-hour limit, one booking per day, editing a booking without clashing with itself, and the seed data.
- `src/lib/bookingForm.test.js`: the booking form's field checks (missing fields, a time that has passed, end before start, capacity, purpose length), filling the form from the address bar, and turning a booking into form values and back.

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
