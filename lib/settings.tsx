'use client';
import { createContext, useContext } from 'react';
import {
  AMBIENT_SOUNDS,
  DEFAULT_SLIDESHOW_INTERVAL,
  SLIDESHOW_INTERVALS,
  TIMER_MINUTES,
} from '@/lib/helpers';
import { usePersistentState } from '@/lib/usePersistentState';

export type BgMode = 'color' | 'picture';
export type AmbientSound = 'off' | 'white' | 'pink' | 'brown';
// Advanced mode's look; 'system' follows the device's light/dark setting.
export type Theme = 'light' | 'dark' | 'system';

const isHexColor = (value: unknown) =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const isNumberBetween = (min: number, max: number) => (value: unknown) =>
  typeof value === 'number' && value >= min && value <= max;

// Every saved setting, each restored from localStorage after a refresh (see
// usePersistentState). Fullscreen isn't one: browsers only allow entering it
// from a user's click. Validators make a bad stored value fall back to the
// default.
export function useSettingsState() {
  // Basic mode (the default) is just a colour screen; advanced unlocks the rest.
  const [advanced, setAdvanced] = usePersistentState('advanced', false);
  const [theme, setTheme] = usePersistentState<Theme>(
    'theme',
    'system',
    (value) => value === 'light' || value === 'dark' || value === 'system',
  );

  const [color, setColor] = usePersistentState('color', '#000000', isHexColor);
  const [showClock, setShowClock] = usePersistentState('showClock', true);

  // Advanced only.
  const [bgMode, setBgMode] = usePersistentState<BgMode>(
    'bgMode',
    'color',
    (value) => value === 'color' || value === 'picture',
  );
  const [crazyMode, setCrazyMode] = usePersistentState('crazyMode', false);
  const [crazyModeInterval, setCrazyModeInterval] = usePersistentState(
    'crazyModeInterval',
    500,
    isNumberBetween(100, 10000),
  );
  const [autoChange, setAutoChange] = usePersistentState('autoChange', true);
  const [changeInterval, setChangeInterval] = usePersistentState(
    'changeInterval',
    DEFAULT_SLIDESHOW_INTERVAL,
    (value) => SLIDESHOW_INTERVALS.includes(value as number),
  );
  const [showQuote, setShowQuote] = usePersistentState('showQuote', false);
  const [showTimer, setShowTimer] = usePersistentState('showTimer', false);
  const [timerMinutes, setTimerMinutes] = usePersistentState(
    'timerMinutes',
    25,
    (value) => TIMER_MINUTES.includes(value as number),
  );
  const [showBreathing, setShowBreathing] = usePersistentState(
    'showBreathing',
    false,
  );
  const [ambientSound, setAmbientSound] = usePersistentState<AmbientSound>(
    'ambientSound',
    'off',
    (value) => AMBIENT_SOUNDS.includes(value as AmbientSound),
  );
  const [ambientVolume, setAmbientVolume] = usePersistentState(
    'ambientVolume',
    0.4,
    isNumberBetween(0, 1),
  );
  const [dim, setDim] = usePersistentState('dim', 0, isNumberBetween(0, 0.8));
  const [warmLight, setWarmLight] = usePersistentState('warmLight', false);

  return {
    advanced,
    setAdvanced,
    theme,
    setTheme,
    color,
    setColor,
    showClock,
    setShowClock,
    bgMode,
    setBgMode,
    crazyMode,
    setCrazyMode,
    crazyModeInterval,
    setCrazyModeInterval,
    autoChange,
    setAutoChange,
    changeInterval,
    setChangeInterval,
    showQuote,
    setShowQuote,
    showTimer,
    setShowTimer,
    timerMinutes,
    setTimerMinutes,
    showBreathing,
    setShowBreathing,
    ambientSound,
    setAmbientSound,
    ambientVolume,
    setAmbientVolume,
    dim,
    setDim,
    warmLight,
    setWarmLight,
  };
}

export type Settings = ReturnType<typeof useSettingsState>;

const SettingsContext = createContext<Settings | null>(null);

export const SettingsProvider = SettingsContext.Provider;

export function useSettings() {
  const settings = useContext(SettingsContext);
  if (!settings) {
    throw new Error('useSettings must be used inside a SettingsProvider');
  }
  return settings;
}
