import { useEffect } from 'react';
import { useBlocker } from 'react-router';

// Warns before the user leaves a form with unsaved changes.
//   - Inside the app (a link or the Back button): useBlocker holds the page change. It returns the blocker,
//     and the form shows a ConfirmDialog while blocker.state is 'blocked': proceed() leaves, reset() stays.
//   - Closing or reloading the tab: the browser shows its own "Leave site?" prompt (beforeunload).
export function useUnsavedChangesWarning(hasChanges) {
  const blocker = useBlocker(hasChanges);

  useEffect(() => {
    if (!hasChanges) return;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges]);

  return blocker;
}
