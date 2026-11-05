import { useEffect } from 'react';
import { useBlocker } from 'react-router';

// Warns the user before they leave a form with unsaved changes.
//   - Leaving inside the app (a link, the menu, the Back button): useBlocker holds the route change,
//     and the form shows UnsavedChangesDialog so the user can stay or leave.
//   - Closing the tab or reloading: the browser shows its own "Leave site?" prompt (beforeunload).
// Returns the blocker. blocker.state is 'blocked' while a route change waits for the user's answer.
export function useUnsavedChangesWarning(hasChanges) {
  // Only a move to another page counts; a change to the ?query of the same page does not.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => hasChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!hasChanges) return;
    function handleBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = '';   // older browsers only show the prompt when this is set
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return blocker;
}
