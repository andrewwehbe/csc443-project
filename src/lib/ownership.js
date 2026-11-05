// "Is this mine?" Every screen asks this before it shows Edit or Cancel.
// currentUser is null when nobody is signed in.
// In Phase 2 the server asks the same question, comparing the booking's owner with the user in the token.
export function isOwner(booking, currentUser) {
  return currentUser !== null && booking.userId === currentUser.id;
}
