import { useState } from 'react';
import { Routes, Route } from 'react-router';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import NewBookingPage from './pages/NewBookingPage.jsx';
import EditBookingPage from './pages/EditBookingPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import RoomPage from './pages/RoomPage.jsx';
import FloorPage from './pages/FloorPage.jsx';
import AvailabilityPage from './pages/AvailabilityPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import { rooms } from './data/rooms.js';
import { users } from './data/users.js';
import { useBookings } from './hooks/useBookings.js';
import UndoToast from './components/UndoToast.jsx';
import { formatTime } from './lib/time.js';

// App owns the state that several screens share: who is signed in, the bookings, and the demo data mode.
// Each screen receives what it needs as props. One <Route> per surface; Layout wraps them all.
export default function App() {
  const [userList, setUserList] = useState(users);
  const [currentUser, setCurrentUser] = useState(users[0]);
  const [simulation, setSimulation] = useState('normal');
  const { bookings, addBooking, updateBooking, cancelBooking, restoreBooking } = useBookings(currentUser);
  const [toast, setToast] = useState(null);   // the message at the bottom: { id, message, bookingId, canUndo }

  // Every Cancel button goes through here, so each cancel offers Undo for a few seconds.
  function cancelWithUndo(id) {
    const result = cancelBooking(id);
    if (result.ok) {
      const room = rooms.find((r) => r.id === result.booking.roomId);
      setToast({ id: Date.now(), message: `Cancelled ${room.name}, ${formatTime(result.booking.start)}.`, bookingId: id, canUndo: true });
    }
    return result;
  }

  // restoreBooking re-checks the house rules, so Undo can fail if the slot was taken in the meantime.
  function undoCancel() {
    const result = restoreBooking(toast.bookingId);
    setToast({ id: Date.now(), message: result.ok ? 'Booking restored.' : result.problems[0].message, canUndo: false });
  }

  const shared = { rooms, users: userList, bookings, currentUser, simulation };

  function registerUser(user) {
    setUserList((current) => [...current, user]);
    setCurrentUser(user);
  }

  return (
    <>
    <Routes>
      <Route
        element={
          <Layout
            users={userList}
            currentUser={currentUser}
            onUserChange={setCurrentUser}
            simulation={simulation}
            onSimulationChange={setSimulation}
          />
        }
      >
        <Route index element={<HomePage {...shared} />} />
        {/* Andrew: 05 Book a room (new and edit) and 06 My bookings */}
        <Route path="bookings/new" element={<NewBookingPage {...shared} addBooking={addBooking} />} />
        <Route path="bookings/:bookingId/edit" element={<EditBookingPage {...shared} updateBooking={updateBooking} />} />
        <Route path="my-bookings" element={<MyBookingsPage {...shared} cancelBooking={cancelWithUndo} />} />
        {/* 07 History and 08 Sign in / register */}
        <Route path="my-bookings/history" element={<HistoryPage {...shared} />} />
        <Route path="sign-in" element={<SignInPage users={userList} onUserChange={setCurrentUser} />} />
        <Route path="register" element={<RegisterPage users={userList} onRegister={registerUser} />} />
        {/* Elio: Room detail and The floor */}
        <Route path="rooms" element={<FloorPage {...shared} />} />
        <Route path="rooms/:roomId" element={<RoomPage {...shared} cancelBooking={cancelWithUndo} />} />
        {/* Njteh: Availability */}
        <Route path="availability" element={<AvailabilityPage {...shared} />} />
        {/* The other surfaces go here, on the paths in the README's route table.
            cancelBooking goes to the screens that have a Cancel button. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    <UndoToast toast={toast} onUndo={undoCancel} onDone={() => setToast(null)} />
    </>
  );
}
