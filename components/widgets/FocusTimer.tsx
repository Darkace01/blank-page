'use client';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BrutalButton, BrutalCard } from '@/components/brutal';
import { BREAK_MINUTES } from '@/lib/helpers';
import { playChime } from '@/lib/useAmbientNoise';

type Phase = 'work' | 'break';

const format = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

// Pomodoro-style focus timer: `workMinutes` of focus, then a 5 minute break,
// repeating. Counts against a wall-clock end time, so it stays accurate when
// the tab is in the background. A chime plays at each switch, and the tab
// title shows the countdown while it runs.
export default function FocusTimer({ workMinutes }: { workMinutes: number }) {
  const [phase, setPhase] = useState<Phase>('work');
  const [running, setRunning] = useState(false);
  const phaseSeconds = (phase === 'work' ? workMinutes : BREAK_MINUTES) * 60;
  const [remaining, setRemaining] = useState(phaseSeconds);
  const [endsAt, setEndsAt] = useState<number | null>(null);

  // Choosing a new work length resets the timer, unless it's running. (Only
  // `workMinutes` triggers this, so pausing doesn't reset the countdown.)
  const runningRef = useRef(running);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    if (!runningRef.current) {
      setPhase('work');
      setRemaining(workMinutes * 60);
    }
  }, [workMinutes]);

  useEffect(() => {
    if (!running || endsAt === null) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      if (left > 0) {
        setRemaining(left);
        return;
      }
      playChime();
      const nextPhase: Phase = phase === 'work' ? 'break' : 'work';
      const nextSeconds =
        (nextPhase === 'work' ? workMinutes : BREAK_MINUTES) * 60;
      setPhase(nextPhase);
      setRemaining(nextSeconds);
      setEndsAt(Date.now() + nextSeconds * 1000);
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [running, endsAt, phase, workMinutes]);

  useEffect(() => {
    if (!running) return;
    const original = document.title;
    document.title = `${format(remaining)} · ${phase === 'work' ? 'Focus' : 'Break'}`;
    return () => {
      document.title = original;
    };
  }, [running, remaining, phase]);

  const start = () => {
    setEndsAt(Date.now() + remaining * 1000);
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setPhase('work');
    setRemaining(workMinutes * 60);
  };
  const skip = () => {
    const nextPhase: Phase = phase === 'work' ? 'break' : 'work';
    const nextSeconds = (nextPhase === 'work' ? workMinutes : BREAK_MINUTES) * 60;
    setPhase(nextPhase);
    setRemaining(nextSeconds);
    if (running) setEndsAt(Date.now() + nextSeconds * 1000);
  };

  const progress = 1 - remaining / phaseSeconds;

  return (
    <BrutalCard className='w-56 font-brutal sm:w-60'>
      <div className='space-y-3 p-4'>
        <div className='flex items-center justify-between'>
          <span
            className={`border-2 border-brutal-line px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
              phase === 'work' ? 'bg-indigo-600 text-white' : 'bg-emerald-300 text-black'
            }`}
          >
            {phase === 'work' ? 'Focus' : 'Break'}
          </span>
          <span className='text-xs text-brutal-muted'>
            {phase === 'work' ? `${workMinutes} min` : `${BREAK_MINUTES} min`}
          </span>
        </div>
        <div
          className='text-5xl font-extrabold tabular-nums tracking-tight'
          role='timer'
          aria-live='off'
        >
          {format(remaining)}
        </div>
        <div className='h-3 border-2 border-brutal-line bg-brutal-paper'>
          <div
            className='h-full bg-indigo-600 transition-[width] duration-300'
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className='flex gap-2 pt-1'>
          <BrutalButton
            variant='primary'
            className='flex-1'
            onClick={running ? pause : start}
          >
            {running ? <Pause /> : <Play />}
            {running ? 'Pause' : 'Start'}
          </BrutalButton>
          <BrutalButton aria-label='Reset timer' title='Reset' onClick={reset}>
            <RotateCcw />
          </BrutalButton>
          <BrutalButton
            aria-label={phase === 'work' ? 'Skip to break' : 'Skip to focus'}
            title='Skip'
            onClick={skip}
          >
            <SkipForward />
          </BrutalButton>
        </div>
      </div>
    </BrutalCard>
  );
}
