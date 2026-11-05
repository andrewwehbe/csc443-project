import { useState } from 'react';
import { makeSeedBookings } from '../data/bookings.js';
import { checkHouseRules } from '../lib/bookingRules.js';
import { isOwner } from '../lib/ownership.js';

// Every booking lives here, in React state, and every change goes through these three functions.
// They play the part the API plays in Phase 2: they check who is asking and enforce the house rules,
// so no screen can skip a rule. Reloading the page resets the bookings to the seed data (expected in Phase 1).
//
// Each function returns { ok: true, booking } or { ok: false, problems: [{ rule, message }] }.
export function useBookings(currentUser) {
  const [bookings, setBookings] = useState(() => makeSeedBookings());

  function addBooking(draft) {
    if (currentUser === null) {
      return { ok: false, problems: [{ rule: 'signed-out', message: 'Sign in to book a room.' }] };
    }
    // The owner is always the signed-in user, never an id sent in by the form.
    const booking = { ...draft, id: `b${Date.now()}`, userId: currentUser.id, status: 'confirmed' };
    const problems = checkHouseRules(booking, bookings);
    if (problems.length > 0) return { ok: false, problems };

    setBookings((current) => [...current, booking]);
    return { ok: true, booking };
  }

  function updateBooking(id, changes) {
    const existing = bookings.find((b) => b.id === id);
    if (!existing) return { ok: false, problems: [{ rule: 'not-found', message: 'This booking no longer exists.' }] };
    if (!isOwner(existing, currentUser)) {
      return { ok: false, problems: [{ rule: 'not-owner', message: 'You can only change your own bookings.' }] };
    }
    // id, owner and status cannot be changed through an edit.
    const booking = { ...existing, ...changes, id: existing.id, userId: existing.userId, status: existing.status };
    const problems = checkHouseRules(booking, bookings);
    if (problems.length > 0) return { ok: false, problems };

    setBookings((current) => current.map((b) => (b.id === id ? booking : b)));
    return { ok: true, booking };
  }

  function cancelBooking(id) {
    const existing = bookings.find((b) => b.id === id);
    if (!existing) return { ok: false, problems: [{ rule: 'not-found', message: 'This booking no longer exists.' }] };
    if (!isOwner(existing, currentUser)) {
      return { ok: false, problems: [{ rule: 'not-owner', message: 'You can only cancel your own bookings.' }] };
    }
    const booking = { ...existing, status: 'cancelled' };
    setBookings((current) => current.map((b) => (b.id === id ? booking : b)));
    return { ok: true, booking };
  }

  return { bookings, addBooking, updateBooking, cancelBooking };
}
