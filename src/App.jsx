import { useState } from 'react';
import { Routes, Route } from 'react-router';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
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
        {/* Surfaces go here, for example:
            <Route path="rooms" element={<RoomsPage {...shared} />} />
            <Route path="bookings/new" element={<NewBookingPage {...shared} addBooking={addBooking} />} />
            <Route path="bookings/:bookingId/edit" element={<EditBookingPage {...shared} updateBooking={updateBooking} />} />
            cancelBooking goes to the screens that have a Cancel button. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
