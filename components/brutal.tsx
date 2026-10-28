'use client';
// Building blocks for advanced mode, in hover.dev's neo-brutalist style: 2px
// black borders, hard black offset shadows, a cut top-right corner, Poppins
// (`font-brutal`), an indigo accent and grid-paper backgrounds (.grid-paper in
// app/globals.css).
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// A clip-path that cuts the top-right corner. A clip alone would also cut away
// the border along the diagonal, so cards and buttons stack three layers: the
// offset shadow, a black border layer and the face, each clipped. The face's
// cut is smaller so a 2px border shows along the diagonal too.
const cutCorner = (size: number) =>
  `polygon(0 0, calc(100% - ${size}px) 0, 100% ${size}px, 100% 100%, 0 100%)`;

export function BrutalCard({
  children,
  className,
  faceClassName,
}: {
  children: ReactNode;
  className?: string;
  faceClassName?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <div
        aria-hidden
        className='absolute inset-0 translate-x-1 translate-y-1 bg-brutal-shadow'
        style={{ clipPath: cutCorner(16) }}
      />
      <div
        className='relative h-full bg-brutal-line p-0.5'
        style={{ clipPath: cutCorner(16) }}
      >
        <div
          className={cn('h-full bg-brutal-paper text-brutal-text', faceClassName)}
          style={{ clipPath: cutCorner(15) }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const buttonFaces = {
  primary: 'bg-indigo-600 text-white group-hover:bg-indigo-500',
  dark: 'bg-brutal-text text-brutal-paper group-hover:opacity-90',
  light: 'bg-brutal-paper text-brutal-text group-hover:bg-brutal-soft',
  // A toggle that's on.
  active: 'bg-brutal-soft text-brutal-accent',
};

// Presses into its shadow on hover/click, like hover.dev's buttons.
export function BrutalButton({
  variant = 'light',
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'button'> & {
  variant?: keyof typeof buttonFaces;
}) {
  return (
    <button
      type='button'
      className={cn(
        'group relative inline-flex select-none font-brutal text-sm font-semibold uppercase tracking-wide outline-none disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className='absolute inset-0 translate-x-[3px] translate-y-[3px] bg-brutal-shadow'
        style={{ clipPath: cutCorner(10) }}
      />
      <span
        className='relative flex w-full bg-brutal-line p-0.5 transition-transform group-hover:translate-x-[3px] group-hover:translate-y-[3px] group-focus-visible:translate-x-[3px] group-focus-visible:translate-y-[3px] group-active:translate-x-[3px] group-active:translate-y-[3px]'
        style={{ clipPath: cutCorner(10) }}
      >
        <span
          className={cn(
            'flex w-full items-center justify-center gap-2 px-3 py-2 transition-colors [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
            buttonFaces[variant],
          )}
          style={{ clipPath: cutCorner(9) }}
        >
          {children}
        </span>
      </span>
    </button>
  );
}

// Uppercase indigo section label with an icon, as on hover.dev's cards.
export function BrutalLabel({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className='flex items-center gap-2 font-brutal text-xs font-semibold uppercase tracking-wider text-brutal-accent [&_svg]:h-4 [&_svg]:w-4'>
      {icon}
      {children}
    </div>
  );
}

export function BrutalSwitch({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center border-2 border-brutal-line bg-brutal-paper p-0.5 shadow-[2px_2px_0_0_rgb(var(--brutal-shadow))] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-600',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className='pointer-events-none block h-4 w-4 border-2 border-brutal-line bg-brutal-paper transition-transform data-[state=checked]:translate-x-5' />
    </SwitchPrimitive.Root>
  );
}

export function BrutalSlider({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn(
        'relative flex w-full touch-none select-none items-center py-1',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className='relative h-3 w-full grow overflow-hidden border-2 border-brutal-line bg-brutal-paper'>
        <SliderPrimitive.Range className='absolute h-full bg-indigo-600' />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className='block h-5 w-5 border-2 border-brutal-line bg-brutal-paper shadow-[2px_2px_0_0_rgb(var(--brutal-shadow))] outline-none transition-colors hover:bg-brutal-soft focus-visible:ring-2 focus-visible:ring-indigo-500' />
    </SliderPrimitive.Root>
  );
}

// A row with a label on the left and a control (switch, select) on the right.
export function BrutalRow({
  htmlFor,
  label,
  hint,
  children,
}: {
  htmlFor?: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className='flex items-center justify-between gap-4'>
      <div className='min-w-0'>
        <label htmlFor={htmlFor} className='font-brutal text-sm font-medium'>
          {label}
        </label>
        {hint && <p className='text-xs text-brutal-muted'>{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// Class names for shadcn's Select, restyled to match.
export const brutalSelectTrigger =
  'h-9 rounded-none border-2 border-brutal-line bg-brutal-paper font-brutal text-sm text-brutal-text shadow-[2px_2px_0_0_rgb(var(--brutal-shadow))] focus:ring-indigo-500';
export const brutalSelectContent =
  'rounded-none border-2 border-brutal-line bg-brutal-paper font-brutal text-brutal-text shadow-[4px_4px_0_0_rgb(var(--brutal-shadow))]';
export const brutalSelectItem =
  'rounded-none focus:bg-brutal-soft focus:text-brutal-text';
