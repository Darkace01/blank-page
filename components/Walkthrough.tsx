'use client';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const SEEN_KEY = 'blank-page:tourSeen';

type Step = {
  title: string;
  body: React.ReactNode;
  // A `data-tour` value to spotlight; centred card when absent.
  target?: string;
};

const kbd =
  'rounded border border-white/20 bg-white/10 px-1.5 font-mono text-xs';

const STEPS: Step[] = [
  {
    title: 'Welcome to Blank Page',
    body: 'A calm, blank screen, made for the second monitor you don’t need right now. This quick guide takes 20 seconds.',
  },
  {
    title: 'Everything is in here',
    body: 'Open the controls to change the colour, show the clock or go full screen. The button stays faded until you hover it.',
    target: 'controls',
  },
  {
    title: 'Keyboard shortcuts',
    body: (
      <ul className='space-y-1.5'>
        <li>
          <kbd className={kbd}>Space</kbd> random colour or photos
        </li>
        <li>
          <kbd className={kbd}>F</kbd> full screen, <kbd className={kbd}>B</kbd>{' '}
          black, <kbd className={kbd}>H</kbd> hide widgets
        </li>
        <li>
          <kbd className={kbd}>Ctrl /</kbd> or <kbd className={kbd}>⌘ /</kbd>{' '}
          developer toolkit
        </li>
      </ul>
    ),
  },
  {
    title: 'Want more? Try advanced mode',
    body: 'Photo slideshows and galleries, a focus timer, a breathing guide, ambient sound, a screen dimmer, dark mode and a developer toolkit.',
    target: 'controls',
  },
];

// Whether this browser has finished or skipped the guide.
export const hasSeenWalkthrough = () => {
  try {
    return window.localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    // Storage blocked: don't nag on every visit.
    return true;
  }
};

const markSeen = () => {
  try {
    window.localStorage.setItem(SEEN_KEY, 'true');
  } catch {
    // Storage blocked: nothing to remember it in.
  }
};

// A short first-visit tour. Steps with a `target` spotlight that element (any
// element with a matching `data-tour` attribute) by darkening everything
// around it; the others show a centred card. Finishing or skipping it is
// remembered, and it can be replayed from either controls panel.
export default function Walkthrough({
  open,
  onClose,
  onTryAdvanced,
}: {
  open: boolean;
  onClose: () => void;
  onTryAdvanced: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Track the spotlighted element's position (it can move on resize).
  useEffect(() => {
    if (!open || !step.target) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, step.target]);

  // Focus moves into the guide, so the app's keyboard shortcuts stay quiet.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `index` refocuses the new step's button
  useEffect(() => {
    if (open) primary.current?.focus();
  }, [open, index]);

  if (!open) return null;

  const finish = () => {
    markSeen();
    onClose();
  };
  const next = () => (last ? finish() : setIndex(index + 1));

  // Card placement: under and left of the spotlight, or centred.
  const pad = 8;
  const cardStyle: React.CSSProperties = rect
    ? {
        top: rect.bottom + pad + 12,
        right: Math.max(12, window.innerWidth - rect.right),
      }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='walkthrough-title'
      className='fixed inset-0 z-[60] text-foreground'
      onKeyDown={(e) => {
        if (e.key === 'Escape') finish();
      }}
    >
      {rect ? (
        // The spotlight: a border around the target, with a huge shadow that
        // darkens the rest of the screen. (A Tailwind ring would be lost: it's
        // drawn with box-shadow, which the inline shadow replaces.)
        <div
          aria-hidden
          className='pointer-events-none fixed rounded-xl border-2 border-indigo-400 transition-all duration-300'
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.65)',
          }}
        />
      ) : (
        <div aria-hidden className='fixed inset-0 bg-black/65' />
      )}

      {/* Positioned by the outer box, animated by the inner one: the entry
          animation's transform would otherwise replace the centring one. */}
      <div
        className='fixed w-[min(22rem,calc(100vw-1.5rem))]'
        style={cardStyle}
      >
        <div
          className='relative rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-300'
          key={index}
        >
          <button
            type='button'
            onClick={finish}
            aria-label='Skip the guide'
            className='absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground'
          >
            <X className='h-4 w-4' />
          </button>
          <div className='mb-1 text-xs font-medium text-indigo-300'>
            Step {index + 1} of {STEPS.length}
          </div>
          <h2 id='walkthrough-title' className='pr-6 text-lg font-semibold'>
            {step.title}
          </h2>
          <div className='mt-2 text-sm text-muted-foreground'>{step.body}</div>

          <div className='mt-5 flex items-center justify-between gap-3'>
            <div className='flex gap-1.5' aria-hidden>
              {STEPS.map((s, i) => (
                <span
                  key={s.title}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-5 bg-indigo-400' : 'w-1.5 bg-white/25'
                  }`}
                />
              ))}
            </div>
            <div className='flex gap-2'>
              {index > 0 && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIndex(index - 1)}
                >
                  Back
                </Button>
              )}
              {last ? (
                <>
                  <Button variant='secondary' size='sm' onClick={finish}>
                    Maybe later
                  </Button>
                  <Button
                    ref={primary}
                    size='sm'
                    onClick={() => {
                      finish();
                      onTryAdvanced();
                    }}
                  >
                    <Sparkles /> Try it
                  </Button>
                </>
              ) : (
                <Button ref={primary} size='sm' onClick={next}>
                  {index === 0 ? 'Show me' : 'Next'} <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
