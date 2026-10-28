'use client';
import { useEffect, useState } from 'react';
import { BrutalCard } from '@/components/brutal';

// Box breathing: in 4s, hold 4s, out 4s, hold 4s. The square's scaling is the
// CSS `breathe` animation (app/globals.css), which starts when this mounts;
// the label and countdown follow the same 16s cycle from the same moment.
const PHASES = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];
const PHASE_MS = 4000;

export default function BreathingGuide() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Date.now() - start), 200);
    return () => clearInterval(interval);
  }, []);

  const cycle = elapsed % (PHASE_MS * PHASES.length);
  const phase = PHASES[Math.floor(cycle / PHASE_MS)];
  const secondsLeft = Math.ceil((PHASE_MS - (cycle % PHASE_MS)) / 1000);

  return (
    <BrutalCard className='w-52 font-brutal'>
      <div className='flex flex-col items-center gap-3 p-4'>
        <div className='grid-paper flex h-28 w-28 items-center justify-center border-2 border-brutal-line'>
          <div className='breathing-square h-24 w-24 border-2 border-brutal-line bg-indigo-600 shadow-[3px_3px_0_0_rgb(var(--brutal-shadow))]' />
        </div>
        <div className='text-center' aria-live='polite'>
          <div className='text-lg font-extrabold uppercase tracking-wide'>
            {phase}
          </div>
          <div className='text-xs tabular-nums text-brutal-muted'>
            {secondsLeft}s
          </div>
        </div>
      </div>
    </BrutalCard>
  );
}
