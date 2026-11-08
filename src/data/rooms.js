// Rooms are reference data: nobody creates or edits them in the app.
// photo is a path inside public/; show it with `${import.meta.env.BASE_URL}${room.photo}`.
// The photos are drawn floor plans, not real photographs of the rooms.
// status is 'open' or 'out-of-service'. A room out of service still appears everywhere (hiding it would send
// people to a locked door) but accepts no booking; checkHouseRules refuses it.
export const AMENITIES = ['whiteboard', 'screen', 'power'];

export const rooms = [
  { id: 'r1', name: 'Study Room 104', building: 'Main Library', floor: 1, capacity: 4, amenities: ['whiteboard', 'power'], status: 'open', photo: 'rooms/r1.svg' },
  { id: 'r2', name: 'Study Room 105', building: 'Main Library', floor: 1, capacity: 4, amenities: ['power'], status: 'open', photo: 'rooms/r2.svg' },
  { id: 'r3', name: 'Study Room 112', building: 'Main Library', floor: 1, capacity: 6, amenities: ['whiteboard', 'screen', 'power'], status: 'open', photo: 'rooms/r3.svg' },
  { id: 'r4', name: 'Study Room 201', building: 'Main Library', floor: 2, capacity: 2, amenities: ['power'], status: 'out-of-service', photo: 'rooms/r4.svg' },
  { id: 'r5', name: 'Study Room 202', building: 'Main Library', floor: 2, capacity: 2, amenities: [], status: 'open', photo: 'rooms/r5.svg' },
  { id: 'r6', name: 'Study Room 210', building: 'Main Library', floor: 2, capacity: 8, amenities: ['whiteboard', 'screen', 'power'], status: 'open', photo: 'rooms/r6.svg' },
  { id: 'r7', name: 'Seminar Room 301', building: 'Main Library', floor: 3, capacity: 12, amenities: ['whiteboard', 'screen', 'power'], status: 'open', photo: 'rooms/r7.svg' },
  { id: 'r8', name: 'Study Room 305', building: 'Main Library', floor: 3, capacity: 6, amenities: ['whiteboard'], status: 'open', photo: 'rooms/r8.svg' },
  { id: 'r9', name: 'Group Room E1', building: 'Engineering Library', floor: 1, capacity: 4, amenities: ['whiteboard', 'power'], status: 'open', photo: 'rooms/r9.svg' },
  { id: 'r10', name: 'Group Room E2', building: 'Engineering Library', floor: 1, capacity: 6, amenities: ['whiteboard', 'screen', 'power'], status: 'open', photo: 'rooms/r10.svg' },
  { id: 'r11', name: 'Group Room E3', building: 'Engineering Library', floor: 1, capacity: 4, amenities: ['screen'], status: 'open', photo: 'rooms/r11.svg' },
  { id: 'r12', name: 'Project Lab E7', building: 'Engineering Library', floor: 2, capacity: 10, amenities: ['whiteboard', 'screen', 'power'], status: 'open', photo: 'rooms/r12.svg' },
];

export function findRoom(id) {
  return rooms.find((room) => room.id === id) ?? null;
}
