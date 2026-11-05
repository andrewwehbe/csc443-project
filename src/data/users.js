// Demo accounts. Phase 1 has no real sign-in: the demo bar at the top of the page switches between them.
// In Phase 2 these move into the database, with a bcrypt password hash instead of no password at all.
export const users = [
  { id: 'u1', name: 'Lara Haddad', email: 'lara.haddad@lau.edu', studentId: '202301184' },
  { id: 'u2', name: 'Omar Khoury', email: 'omar.khoury@lau.edu', studentId: '202204417' },
  { id: 'u3', name: 'Maya Saab', email: 'maya.saab@lau.edu', studentId: '202402093' },
  { id: 'u4', name: 'Karim Nassar', email: 'karim.nassar@lau.edu', studentId: '202305562' },
  { id: 'u5', name: 'Rita Azar', email: 'rita.azar@lau.edu', studentId: '202401276' },
  { id: 'u6', name: 'Jad Fares', email: 'jad.fares@lau.edu', studentId: '202206831' },
  { id: 'u7', name: 'Nour Hamdan', email: 'nour.hamdan@lau.edu', studentId: '202303349' },
  { id: 'u8', name: 'Tarek Mansour', email: 'tarek.mansour@lau.edu', studentId: '202405708' },
];

export function findUser(id) {
  return users.find((user) => user.id === id) ?? null;
}
