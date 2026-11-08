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
import { rooms } from './data/rooms.js';
import { users } from './data/users.js';
import { useBookings } from './hooks/useBookings.js';

// App owns the state that several screens share: who is signed in, the bookings, and the demo data mode.
// Each screen receives what it needs as props. One <Route> per surface; Layout wraps them all.
export default function App() {
  const [currentUser, setCurrentUser] = useState(users[0]);
  const [simulation, setSimulation] = useState('normal');
  const { bookings, addBooking, updateBooking, cancelBooking } = useBookings(currentUser);

  const shared = { rooms, users, bookings, currentUser, simulation };

  return (
    <Routes>
      <Route
        element={
          <Layout
            users={users}
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
        <Route path="my-bookings" element={<MyBookingsPage {...shared} cancelBooking={cancelBooking} />} />
        {/* Elio: Room detail and The floor */}
        <Route path="rooms" element={<FloorPage {...shared} />} />
        <Route path="rooms/:roomId" element={<RoomPage {...shared} cancelBooking={cancelBooking} />} />
        {/* Njteh: Availability */}
        <Route path="availability" element={<AvailabilityPage {...shared} />} />
        {/* The other surfaces go here, on the paths in the README's route table.
            cancelBooking goes to the screens that have a Cancel button. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
