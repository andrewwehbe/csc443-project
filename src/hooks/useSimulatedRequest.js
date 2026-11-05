import { useEffect, useState } from 'react';

// Phase 1 has no server, so a screen fakes the wait for its data. The demo bar picks the mode:
//   'normal' = short wait, then the data
//   'slow'   = long wait (to look at the loading state)
//   'empty'  = no data (to look at the empty state)
//   'error'  = the request fails (to look at the error state)
// Returns { status, data, retry } where status is 'loading', 'error', 'empty' or 'ready'.
// In Phase 2 this hook is replaced by a real fetch to the API; the four states stay the same.
const DELAYS = { normal: 400, slow: 2500, empty: 400, error: 800 };

export function useSimulatedRequest(data, mode = 'normal') {
  const [phase, setPhase] = useState('loading');   // 'loading' | 'done' | 'failed'
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setPhase('loading');
    const timer = setTimeout(() => setPhase(mode === 'error' ? 'failed' : 'done'), DELAYS[mode] ?? DELAYS.normal);
    return () => clearTimeout(timer);   // leaving the screen early cancels the fake request
  }, [mode, attempt]);

  // data can be a list (a list screen) or one object (a detail screen).
  const shown = mode === 'empty' ? (Array.isArray(data) ? [] : null) : data;
  const isEmpty = Array.isArray(shown) ? shown.length === 0 : shown == null;

  let status = 'ready';
  if (phase === 'loading') status = 'loading';
  else if (phase === 'failed') status = 'error';
  else if (isEmpty) status = 'empty';

  return { status, data: shown, retry: () => setAttempt((n) => n + 1) };
}
