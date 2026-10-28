'use client';
import { useEffect, useState } from 'react';

const PREFIX = 'blank-page:';

// useState that survives a refresh by saving to localStorage under
// `blank-page:<key>`. The page is prerendered, so the saved value is read after
// mount (reading it during render would cause a hydration mismatch); until
// then the default shows. Nothing is written until that read has happened, so
// the default never overwrites a saved value. A stored value that fails
// `isValid` (or isn't the same type as the default) is ignored. If storage is
// unavailable (e.g. blocked in a private window), it behaves like useState.
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  isValid: (value: unknown) => boolean = (value) =>
    typeof value === typeof defaultValue,
) {
  const [value, setValue] = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: read once, on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (raw !== null) {
        const stored: unknown = JSON.parse(raw);
        if (isValid(stored)) setValue(stored as T);
      }
    } catch {
      // Unreadable or blocked storage: keep the default.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage full or blocked: the setting just isn't remembered.
    }
  }, [key, value, loaded]);

  return [value, setValue] as const;
}
